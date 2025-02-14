// routes/categories.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads")); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// GET /categories - Get all categories (optionally filtered by shop_id)
router.get("/", (req, res) => {
  const { shop_id } = req.query;
  let sql = "SELECT * FROM categories";
  let values = [];
  if (shop_id) {
    sql += " WHERE shop_id = ?";
    values.push(shop_id);
  }
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET /categories/:id - Get a single category by id
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM categories WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0)
      return res.status(404).json({ error: "Category not found" });
    res.json(result[0]);
  });
});

// POST /categories - Create a new category with optional image upload
router.post("/", upload.single("image"), (req, res) => {
  try {
    const { name, shop_id } = req.body;

    // Validate required fields
    if (!name || !shop_id) {
      return res.status(400).json({
        error: "Category name and shop_id are required",
      });
    }

    // Store only the relative image path
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    // Insert into the database
    const sql =
      "INSERT INTO categories (name, shop_id, image) VALUES (?, ?, ?)";
    db.query(sql, [name, shop_id, imagePath], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        message: "Category created successfully",
        id: result.insertId,
        image: imagePath, // Send image path in response for confirmation
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /categories/:id - Update a category
router.patch("/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, shop_id } = req.body;
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
  if (req.file) {
    updateFields.push("image = ?");
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    values.push(imagePath);
  }
  if (updateFields.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid fields provided for update" });
  }
  values.push(id);
  const sql = `UPDATE categories SET ${updateFields.join(", ")} WHERE id = ?`;
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Category not found" });
    res.json({ message: "Category updated" });
  });
});

// DELETE /categories/:id - Delete a category
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM categories WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Category not found" });
    res.json({ message: "Category deleted" });
  });
});

module.exports = router;
