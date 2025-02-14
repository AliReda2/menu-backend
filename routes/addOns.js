// routes/addOns.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /addOns - Get all addOns (optionally filtered by shop_id)
router.get("/", (req, res) => {
  const { shop_id } = req.query;
  let sql = "SELECT * FROM addOns";
  let values = [];
  if (shop_id) {
    sql += " WHERE shop_id = ?";
    values.push(shop_id);
  }
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(
      result.map((addOn) => ({
        ...addOn,
        price: Number(addOn.price), // Convert price to a number
      }))
    );
  });
});

// GET /addOns/:id - Get a single addOn by id
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM addOns WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0)
      return res.status(404).json({ error: "addOn not found" });
    res.json(result[0]);
  });
});

// POST /addOns - Create a new addOn
router.post("/", (req, res) => {
  try {
    const { name, price, shop_id } = req.body;

    if (!name || !price || !shop_id) {
      return res.status(400).json({
        error: "addOn name, price, and shop_id are required",
      });
    }

    const sql = "INSERT INTO addOns (name, shop_id, price) VALUES (?, ?, ?)";
    db.query(sql, [name, shop_id, parseFloat(price)], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      // Fetch the newly inserted record using insertId
      const selectSql = "SELECT * FROM addOns WHERE id = ?";
      db.query(selectSql, [result.insertId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          ...rows[0], // Return the newly created record
          price: Number(rows[0].price), // Convert price to a number
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /addOns/:id - Update a addOn
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, shop_id } = req.body;
  let updateFields = [];
  let values = [];
  if (name) {
    updateFields.push("name = ?");
    values.push(name);
  }
  if (shop_id) {
    updateFields.push("shop_id = ?");
    values.push(shop_id);
  }
  if (price) {
    updateFields.push("price = ?");
    values.push(parseFloat(price)); // Ensure it's stored as a number
  }

  if (updateFields.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid fields provided for update" });
  }
  values.push(id);
  const sql = `UPDATE addOns SET ${updateFields.join(", ")} WHERE id = ?`;
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "addOn not found" });
    res.json({ message: "addOn updated" });
  });
});

// DELETE /addOns/:id - Delete a addOn
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM addOns WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "addOn not found" });
    res.json({ message: "addOn deleted" });
  });
});

module.exports = router;
