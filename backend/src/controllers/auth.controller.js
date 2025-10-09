import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

import { log } from "../utils/logger.util.js";
import { pool } from "../../database/database.js"; // remove 'sql'
import { generateToken } from "../utils/jwt.util.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // 1. Validate inputs
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    // Check if email is valid using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    // 2. Check if email already exists
    const existingUserResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUserResult.rowCount > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert new user
    const userId = uuidv4();
    await pool.query(
      `INSERT INTO users (id, email, full_name, password) 
       VALUES ($1, $2, $3, $4)`,
      [userId, email.toLowerCase(), fullName, hashedPassword]
    );

    // 🔐 Generate JWT and send it in cookie
    generateToken(userId, res);

    // 5. Respond with success
    log.success("User registered successfully", "Signup controller");

    //todo: Send a
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: userId,
        fullName,
        email: email.toLowerCase(),
        profilePic: "",
      },
    });
  } catch (error) {
    log.error(`Signup controller error: ${error}`, "Signup Function");
    return res
      .status(500)
      .json({ message: "Internal Server Error during signup" });
  }
};
