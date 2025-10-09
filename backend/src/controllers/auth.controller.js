import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";

import { log } from "../utils/logger.util.js";
import { pool } from "../../database/database.js"; // remove 'sql'
import { generateToken } from "../utils/jwt.util.js";
import { sendWelcomeEmail } from "../emails/emailHandler.js";

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
    log.success("User registered successfully", "Signup Controller");

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: userId,
        fullName,
        email: email.toLowerCase(),
        profilePic: "",
      },
    });

    //todo: Send an email after success

    try {
      const clientURL = process.env.CLIENT_URL || "https://your-client-url.com";
      await sendWelcomeEmail(email.toLowerCase(), fullName, clientURL);
    } catch (error) {
      log.error("Error sending welcome email", error?.message || error);
    }
  } catch (error) {
    log.error(`Signup controller error: ${error}`, "Signup Function");
    return res
      .status(500)
      .json({ message: "Internal Server Error during signup" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Validate inputs
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // 2. Fetch user by email
    const userResult = await pool.query(
      "SELECT id, full_name, email, password, profile_pic FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const user = userResult.rows[0];

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    // 4. Generate JWT token and send it as cookie
    generateToken(user.id, res);

    // 5. Log success
    log.success(`User logged in successfully: ${email}`, "Login controller");

    // 6. Respond with user info (without password)
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        profilePic: user.profile_pic,
      },
    });
  } catch (error) {
    log.error(`Login controller error: ${error}`, "Login Controller");
    return res
      .status(500)
      .json({ message: "Internal Server Error during login" });
  }
};

export const logout = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie("jwt", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });

    // 2. Logout success
    log.success(`User logged out successfully:`, "Login controller");
  } catch (error) {
    log.error(`Logout error: ${error}`, "Logout Controller");
    res.status(500).json({ message: "Internal Server Error during logout" });
  }
};
