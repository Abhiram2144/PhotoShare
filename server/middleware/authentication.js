
module.exports.checkAuth = (req, res, next) => {
    const jwt = require("jsonwebtoken");
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
//   console.log("token: ", token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("decoded: ", decoded.id);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};