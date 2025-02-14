// routes/users.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// GET /users - Get all users (optionally filtered by shop_id or role)
router.get("/", (req, res) => {
  const { shop_id, role } = req.query;
  let sql = `
    SELECT 
      users.id, 
      users.name, 
      users.role, 
      users.shop_id, 
      roles.name AS role_name, 
      shops.name AS shop_name
    FROM users
    LEFT JOIN roles ON users.role = roles.id
    LEFT JOIN shops ON users.shop_id = shops.id
  `;
  let conditions = [];
  let values = [];
  if (shop_id) {
    conditions.push("users.shop_id = ?");
    values.push(shop_id);
  }
  if (role) {
    conditions.push("roles.name = ?");
    values.push(role);
  }
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET /users/:id - Get a single user by id
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      users.id, 
      users.name, 
      users.role, 
      users.shop_id, 
      roles.name AS role_name, 
      shops.name AS shop_name
    FROM users
    LEFT JOIN roles ON users.role = roles.id
    LEFT JOIN shops ON users.shop_id = shops.id
    WHERE users.id = ?
  `;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json(result[0]);
  });
});

// POST /users - Create a new user
router.post("/", async (req, res) => {
  const { name, role, shop_id, password } = req.body;
  if (!name || !role || !shop_id || !password) {
    return res
      .status(400)
      .json({ error: "name, role, shop_id, and password are required" });
  }

  // Check that password is at least 7 characters long.
  if (password.length < 7) {
    return res
      .status(400)
      .json({ error: "Password must be at least 7 characters" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql =
      "INSERT INTO users (name, role, shop_id, password) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, role, shop_id, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "User created", id: result.insertId });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /users/:id - Update a user
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, role, shop_id, password } = req.body;
  let updateFields = [];
  let values = [];

  if (name) {
    updateFields.push("name = ?");
    values.push(name);
  }
  if (role) {
    updateFields.push("role = ?");
    values.push(role);
  }
  if (shop_id) {
    updateFields.push("shop_id = ?");
    values.push(shop_id);
  }
  if (password) {
    // Check that password is at least 7 characters long.
    if (password.length < 7) {
      return res
        .status(400)
        .json({ error: "Password must be at least 7 characters" });
    }
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password = ?");
      values.push(hashedPassword);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (updateFields.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid fields provided for update" });
  }
  values.push(id);
  const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated" });
  });
});

// DELETE /users/:id - Delete a user
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM users WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  });
});
// POST /users/login - Log in a user (admin or general user)

router.post("/login", async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res
      .status(400)
      .json({ error: "Name and password are required for login" });
  }

  const sql = `
    SELECT 
      users.*, 
      roles.name AS role_name 
    FROM users
    INNER JOIN roles ON users.role = roles.id
    WHERE users.name = ?
  `;

  db.query(sql, [name], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // On successful login, return a success message and user details.
      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          role: user.role_name,
          shop_id: user.shop_id,
        },
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
});

module.exports = router;
