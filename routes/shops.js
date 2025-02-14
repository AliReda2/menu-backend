// routes/shops.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// GET /shops - Get all shops
router.get("/", (req, res) => {
  const sql = "SELECT * FROM shops";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET /shops/:id - Get a single shop with categories and menu items
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
  shops.id AS shop_id, 
  shops.name AS shop_name, 
  shops.image AS shop_image,
  shops.description AS shop_description,
  GROUP_CONCAT(DISTINCT CONCAT(
    IFNULL(categories.id, ''), ':', 
    IFNULL(categories.name, ''), ':', 
    IFNULL(categories.image, '')
  ) SEPARATOR '|') AS categories,
  GROUP_CONCAT(DISTINCT CONCAT(
    IFNULL(menu.id, ''), ':', 
    IFNULL(menu.name, ''), ':', 
    IFNULL(menu.price, ''), ':', 
    IFNULL(menu.category_id, ''), ':',
    IFNULL(menu.image, ''), ':',
    IFNULL(menu.description, '')
  ) SEPARATOR '|') AS menu
FROM shops
LEFT JOIN categories ON categories.shop_id = shops.id
LEFT JOIN menu ON menu.shop_id = shops.id
WHERE shops.id = ?
GROUP BY shops.id
  `;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0)
      return res.status(404).json({ error: "Shop not found" });

    const shop = result[0];
    const categories = shop.categories
      ? shop.categories
          .split("|")
          .map((cat) => {
            const [id, name, image] = cat.split(":");
            return id ? { id: Number(id), name, image } : null;
          })
          .filter(Boolean)
      : [];
    const menu = shop.menu
      ? shop.menu
          .split("|")
          .map((item) => {
            const [id, name, price, category_id, image, description] =
              item.split(":");
            return id
              ? {
                  id: Number(id),
                  name,
                  price: parseFloat(price),
                  category_id: Number(category_id),
                  image,
                  description, // Ensure description is included
                }
              : null;
          })
          .filter(Boolean)
      : [];

    // Attach menu items to their respective categories.
    categories.forEach((cat) => {
      cat.menu = menu.filter((item) => item.category_id === cat.id);
    });

    res.json({
      shop: {
        id: shop.shop_id,
        name: shop.shop_name,
        image: shop.shop_image,
        description: shop.shop_description,
        categories,
      },
    });
  });
});

// POST /shops - Create a new shop
router.post("/", upload.single("image"), (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Shop name is required" });
  }
  const imagePath = `uploads/${req.file.filename}`;
  const sql = "INSERT INTO shops (name, description, image) VALUES (?, ?, ?)";
  db.query(sql, [name, description || "", imagePath], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Shop created", id: result.insertId });
  });
});

// PATCH /shops/:id - Update a shop
router.patch("/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  let updateFields = [];
  let values = [];
  if (name) {
    updateFields.push("name = ?");
    values.push(name);
  }
  if (description) {
    updateFields.push("description = ?");
    values.push(description);
  }
  if (req.file) {
    updateFields.push("image = ?");
    const imagePath = `uploads/${req.file.filename}`;
    values.push(imagePath);
  }
  if (updateFields.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid fields provided for update" });
  }
  values.push(id);
  const sql = `UPDATE shops SET ${updateFields.join(", ")} WHERE id = ?`;
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Shop not found" });
    res.json({ message: "Shop updated" });
  });
});

// DELETE /shops/:id - Delete a shop
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM shops WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Shop not found" });
    res.json({ message: "Shop deleted" });
  });
});

module.exports = router;
