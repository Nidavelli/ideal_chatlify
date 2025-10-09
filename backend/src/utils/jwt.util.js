import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "72h", // 3 days
  });

  res.cookie("jwt", token, {
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days in ms
    httpOnly: true, // Prevents XSS attacks
    sameSite: "strict", // CSRF protection
    secure: process.env.NODE_ENV === "development" ? false : true, // HTTPS in prod
  });

  return token;
};
