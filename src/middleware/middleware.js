import jwt from "jsonwebtoken";

export default function authenticateToken(req, res, next) {
  const token = req.header("Authorization");

  if (!token) return res.status(401).json({ msg: "Access denied" });

  try {
    const verified = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ msg: "Invalid token" });
  }
}
