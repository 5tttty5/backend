const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

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
    `);

    res.json({
      message: "Đã tạo bảng cesium_point và cesium_polygon thành công",
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
    await pool.query(`DELETE FROM cesium_point;`);
    await pool.query(`DELETE FROM cesium_polygon;`);

    await pool.query(`
      INSERT INTO cesium_point (id, usage, geom)
      VALUES
      (
        61,
        'tree',
        ST_SetSRID(ST_MakePoint(7.599553866763814, 51.93986225429269), 4326)
      ),
      (
        62,
        'tree',
        ST_SetSRID(ST_MakePoint(7.599934470449944, 51.9399696126641), 4326)
      ),
      (
        63,
        'tree',
        ST_SetSRID(ST_MakePoint(7.600289627906244, 51.94010652021739), 4326)
      ),
      (
        64,
        'car',
        ST_SetSRID(ST_MakePoint(7.598866183630354, 51.94032673622099), 4326)
      ),
      (
        65,
        'car',
        ST_SetSRID(ST_MakePoint(7.599050883633974, 51.94007101917839), 4326)
      );
    `);

    await pool.query(`
      INSERT INTO cesium_polygon (id, usage, foo, geom)
      VALUES (
        23,
        'Warning',
        0,
        ST_SetSRID(
          ST_GeomFromText(
            'POLYGON((7.599439006525681 51.94016722856796, 7.599639006525681 51.94016722856796, 7.599639006525681 51.93996722856796, 7.599439006525681 51.93996722856796, 7.599439006525681 51.94016722856796))'
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Backend chạy tại port " + PORT);
});
