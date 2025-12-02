const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    let token;

    // Accept token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // OR accept token from cookies (optional)
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;

    next();
  } catch (err) {
    console.log("Auth error:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};
