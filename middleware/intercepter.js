// src/middleware/interceptor.js
const interceptor = (req, res, next) => {
  // Pre-processing logic here (for example, logging or modifying the request)
  console.log("Interceptor: Request received", req.method, req.url);

  // You can also modify the request (e.g., add custom headers, validate input, etc.)
  if (!req.headers["authorization"]) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Call the next middleware or route handler
  next();
};

module.exports = interceptor;
