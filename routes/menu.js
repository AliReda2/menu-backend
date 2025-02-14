// routes/menu.js
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

// GET /menu - Retrieve menu items with optional filters
router.get("/", (req, res) => {
  const { category, search } = req.query;
  let sql = `
    SELECT 
      menu.id, 
      menu.shop_id, 
      menu.name, 
      menu.price, 
      menu.description,
      menu.category_id,
      menu.image,
      categories.name AS category_name,
      shops.name AS shop_name
    FROM menu
    LEFT JOIN categories ON menu.category_id = categories.id
    LEFT JOIN shops ON menu.shop_id = shops.id
  `;
  let conditions = [];
  let values = [];

  if (category) {
    conditions.push("categories.name = ?");
    values.push(category);
  }
  if (search) {
    conditions.push("menu.name LIKE ?");
    values.push(`%${search}%`);
  }
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});
// POST /menu - Create a new menu item
router.post("/", upload.single("image"), (req, res) => {
  const { shop_id, name, price, description, category_id } = req.body;

  // Validate required fields
  if (!shop_id || !name || !price || !category_id) {
    return res.status(400).json({
      error: "shop_id, name, price, and category_id are required",
    });
  }

  // Get the image file path if an image was uploaded
  const imagePath = req.file ? `uploads/${req.file.filename}` : null;

  // Insert the new menu item into the database
  const sql = `
    INSERT INTO menu (shop_id, name, price, description, category_id, image) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [shop_id, name, price, description, category_id, imagePath],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Menu item added", id: result.insertId });
    }
  );
});

// PATCH /menu/:id - Update a menu item
router.patch("/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, price, category_id } = req.body;
  let updateFields = [];
  let values = [];

  if (name) {
    updateFields.push("name = ?");
    values.push(name);
  }
  if (price) {
    updateFields.push("price = ?");
    values.push(price);
  }
  if (req.file) {
    updateFields.push("image = ?");
    const imagePath = `uploads/${req.file.filename}`;
    values.push(imagePath);
  }
  if (category_id) {
    updateFields.push("category_id = ?");
    values.push(category_id);
  }

  if (updateFields.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid fields provided for update" });
  }
  values.push(id);
  const sql = `UPDATE menu SET ${updateFields.join(", ")} WHERE id = ?`;
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Menu item updated" });
  });
});

// DELETE /menu/:id - Delete a menu item
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM menu WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Menu item deleted" });
  });
});

module.exports = router;
