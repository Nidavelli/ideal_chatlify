import jwt from "jsonwebtoken";
import { pool } from "../../database/database.js"; // your DB pool
import { log } from "../utils/logger.util.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token: no user ID" });
    }

    // Query the user from DB by id
    const result = await pool.query(
      "SELECT id, email, full_name, profile_pic FROM users WHERE id = $1",
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user info to req.user
    req.user = result.rows[0];

    next();
  } catch (error) {
    log.error(`Auth middleware error: ${error}`, "protectRoute");
    return res.status(401).json({ message: "Token is not valid" });
  }
};
