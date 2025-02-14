// routes/roles.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /roles - Get all roles (optionally filtered by )
router.get("/", (req, res) => {
  let sql = "SELECT * FROM roles";
  let values = [];
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET /roles/:id - Get a single role by id
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM roles WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0)
      return res.status(404).json({ error: "Role not found" });
    res.json(result[0]);
  });
});

// POST /roles - Create a new role
router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  const sql = "INSERT INTO roles (name) VALUES (?)";
  db.query(sql, [name], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Role created", id: result.insertId });
  });
});

// PATCH /roles/:id - Update a role
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID format" });

  const { name } = req.body;
  let updateFields = [];
  let values = [];

  if (name) {
    updateFields.push("name = ?");
    values.push(name);
  }

  if (updateFields.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid fields provided for update" });
  }

  values.push(id);
  const sql = `UPDATE roles SET ${updateFields.join(", ")} WHERE id = ?`;
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Role not found" });
    res.json({ message: "Role updated" });
  });
});

// DELETE /roles/:id - Delete a role
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID format" });

  const sql = "DELETE FROM roles WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Role not found" });
    res.json({ message: "Role deleted" });
  });
});

module.exports = router;
