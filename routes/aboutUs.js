// routes/aboutUs.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /aboutUs - Get all aboutUs
router.get("/", (req, res) => {
  db.query("SELECT * FROM aboutUs", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result[0]);
  });
});

// GET /aboutUs/:id - Get a single aboutUs by id
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM aboutUs WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0)
      return res.status(404).json({ error: "aboutUs not found" });
    res.json(result[0]);
  });
});

// POST /aboutUs - Create a new aboutUs
router.post("/", (req, res) => {
  const { shop_id, address, description, latitude, longitude } = req.body;

  console.log("Request Body:", req.body);

  if (!shop_id || !address || !description || !latitude || !longitude) {
    return res.status(400).json({
      error:
        "shop_id, address, description, latitude, and longitude are required",
    });
  }

  const lat = parseFloat(latitude);
  const long = parseFloat(longitude);

  if (isNaN(lat) || isNaN(long)) {
    return res.status(400).json({
      error: "Invalid latitude or longitude values",
    });
  }

  const sql =
    "INSERT INTO aboutUs (shop_id, address, description, latitude, longitude) VALUES (?, ?, ?, ?, ?)";
  console.log("SQL Query:", sql, [shop_id, address, description, lat, long]);

  db.query(sql, [shop_id, address, description, lat, long], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const selectSql = "SELECT * FROM aboutUs WHERE id = ?";
    db.query(selectSql, [result.insertId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json(rows[0]);
    });
  });
});

// PATCH /aboutUs/:id - Update an existing aboutUs
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const { shop_id, address, description, latitude, longitude } = req.body;

  let updateFields = [];
  let values = [];

  if (shop_id) {
    updateFields.push("shop_id = ?");
    values.push(shop_id);
  }
  if (address) {
    updateFields.push("address = ?");
    values.push(address);
  }
  if (description) {
    updateFields.push("description = ?");
    values.push(description);
  }
  if (latitude) {
    updateFields.push("latitude = ?");
    values.push(latitude);
  }
  if (longitude) {
    updateFields.push("longitude = ?");
    values.push(longitude);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({
      error:
        "At least one of shop_id, address, description, latitude, or longitude is required",
    });
  }

  values.push(id);
  const sql = `UPDATE aboutUs SET ${updateFields.join(", ")} WHERE id = ?`;
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "aboutUs not found" });

    res.json({ message: "aboutUs updated successfully" });
  });
});

module.exports = router;
