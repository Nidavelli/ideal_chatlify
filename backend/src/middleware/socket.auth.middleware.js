import jwt from "jsonwebtoken";
import { pool } from "../../database/database.js";
import "dotenv/config";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    // Extract token from http-only cookies in handshake headers
    const token = socket.handshake.headers.cookie
      ?.split("; ")
      .find((row) => row.startsWith("jwt="))
      ?.split("=")[1];

    if (!token) {
      console.log("Socket connection rejected: No token provided");
      return next(new Error("Unauthorized - No Token Provided"));
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      console.log("Socket connection rejected: Invalid token");
      return next(new Error("Unauthorized - Invalid Token"));
    }

    // Query user from SQL database
    const result = await pool.query(
      `SELECT id, email, full_name, profile_pic, created_at, updated_at
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rowCount === 0) {
      console.log("Socket connection rejected: User not found");
      return next(new Error("User not found"));
    }

    const user = result.rows[0];

    // Attach user info to socket object
    socket.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      profilePic: user.profile_pic,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
    socket.userId = user.id;

    console.log(
      `Socket authenticated for user: ${user.full_name} (${user.id})`
    );

    next();
  } catch (error) {
    console.log("Error in socket authentication:", error.message);
    next(new Error("Unauthorized - Authentication failed"));
  }
};
