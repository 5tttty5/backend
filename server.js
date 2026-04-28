const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// test route gốc
app.get("/", (req, res) => {
  res.send("Server OK");
});

// test API
app.get("/point", (req, res) => {
  res.json({
    type: "FeatureCollection",
    features: [
      {
        id: 61,
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [7.599553866763814, 51.93986225429269],
        },
        properties: {
          usage: "tree",
        },
      },
      {
        id: 62,
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [7.599934470449944, 51.9399696126641],
        },
        properties: {
          usage: "tree",
        },
      },
      {
        id: 63,
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [7.600289627906244, 51.94010652021739],
        },
        properties: {
          usage: "tree",
        },
      },
      {
        id: 64,
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [7.598866183630354, 51.94032673622099],
        },
        properties: {
          usage: "car",
        },
      },
      {
        id: 65,
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [7.599050883633974, 51.94007101917839],
        },
        properties: {
          usage: "car",
        },
      },
    ],
  });
});

app.get("/polygon", (req, res) => {
  res.json({
    type: "FeatureCollection",
    features: [
      {
        id: 23,
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [7.599439006525681, 51.94016722856796],
              [7.599639006525681, 51.94016722856796],
              [7.599639006525681, 51.93996722856796],
              [7.599439006525681, 51.93996722856796],
              [7.599439006525681, 51.94016722856796],
            ],
          ],
        },
        properties: {
          usage: "Warning",
          foo: 0,
        },
      },
    ],
  });
});

app.listen(3000, () => {
  console.log("Backend chạy tại http://localhost:3000");
});
