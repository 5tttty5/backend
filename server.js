const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// Serve terrain tiles tĩnh
app.use(
  "/terrain",
  express.static(path.join(__dirname, "terrain"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".terrain")) {
        res.setHeader("Content-Type", "application/octet-stream");
      }
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  }),
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// test route gốc
app.get("/", (req, res) => {
  res.send("Server OK");
});

// tạo bảng database
app.get("/init-db", async (req, res) => {
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS postgis;

      CREATE TABLE IF NOT EXISTS cesium_point (
        id SERIAL PRIMARY KEY,
        usage TEXT,
        geom geometry(Point, 4326)
      );

      CREATE TABLE IF NOT EXISTS cesium_polygon (
        id SERIAL PRIMARY KEY,
        usage TEXT,
        foo INTEGER DEFAULT 0,
        geom geometry(Polygon, 4326)
      );

      CREATE TABLE IF NOT EXISTS cesium_line (
        id SERIAL PRIMARY KEY,
        usage TEXT,
        project_id TEXT,
        geom geometry(LineString, 4326)
      );
    `);

    res.json({
      message: "Database initialized",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

// thêm dữ liệu mẫu ban đầu vào database
app.get("/seed-db", async (req, res) => {
  try {
    await pool.query(`DELETE FROM cesium_line;`);

    await pool.query(`
  INSERT INTO cesium_line (id, usage, project_id, geom)
  VALUES
  (
    1,
    'bus',
    'part_10',
    ST_SetSRID(
      ST_GeomFromText(
        'LINESTRING(
          7.607662906124652 51.9489624267296,
          7.607435742657485 51.94891351480369,
          7.607182490868212 51.948995237404745
        )'
      ),
      4326
    )
  ),
  (
    2,
    'car',
    'part_10',
    ST_SetSRID(
      ST_GeomFromText(
        'LINESTRING(
          7.606938505781948 51.94899473797764,
          7.607277456264367 51.94886552154649,
          7.607644983257613 51.948808013688846
        )'
      ),
      4326
    )
  );
`);

    res.json({
      message: "Đã thêm dữ liệu mẫu vào database",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// API lấy point từ database
app.get("/point", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(feature), '[]'::json)
      ) AS geojson
      FROM (
        SELECT json_build_object(
          'id', id,
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(geom)::json,
          'properties', json_build_object(
            'usage', usage
          )
        ) AS feature
        FROM cesium_point
        ORDER BY id
      ) AS features;
    `);

    res.json(result.rows[0].geojson);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// API lấy polygon từ database
app.get("/polygon", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(feature), '[]'::json)
      ) AS geojson
      FROM (
        SELECT json_build_object(
          'id', id,
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(geom)::json,
          'properties', json_build_object(
            'usage', usage,
            'foo', foo
          )
        ) AS feature
        FROM cesium_polygon
        ORDER BY id
      ) AS features;
    `);

    res.json(result.rows[0].geojson);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// get line
app.get("/line", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(feature), '[]'::json)
      ) AS geojson
      FROM (
        SELECT json_build_object(
          'id', id,
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(geom)::json,
          'properties', json_build_object(
            'usage', usage,
            'project_id', project_id
          )
        ) AS feature
        FROM cesium_line
        ORDER BY id
      ) AS features;
    `);

    res.json(result.rows[0].geojson);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Backend chạy tại port " + PORT);
});
