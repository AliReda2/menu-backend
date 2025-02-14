require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// Import routes
const menuRoutes = require("./routes/menu");
const shopRoutes = require("./routes/shops");
const categoryRoutes = require("./routes/categories");
const userRoutes = require("./routes/users");
const addOnRoutes = require("./routes/addOns");
const aboutUsRoutes = require("./routes/aboutUs");

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Allow requests from the frontend domain
const allowedOrigins = [
  "https://menu-frontend-gabl77dno-alireda2s-projects.vercel.app",
  "http://localhost:3000",
];
app.use(cors({ origin: allowedOrigins }));

// Static file serving for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/menu", menuRoutes);
app.use("/shops", shopRoutes);
app.use("/categories", categoryRoutes);
app.use("/users", userRoutes);
app.use("/addOns", addOnRoutes);
app.use("/aboutUs", aboutUsRoutes);

// Error handling middleware (should be added after your routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

module.exports = app;
