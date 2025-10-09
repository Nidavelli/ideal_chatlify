import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";

import { log } from "../utils/logger.util.js";
import { pool } from "../../database/database.js";
import { generateToken } from "../utils/jwt.util.js";
import { sendWelcomeEmail } from "../emails/emailHandler.js";
import cloudinary from "../utils/cloudinary.util.js";

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

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    const userId = req.user.id;

    // Upload image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(profilePic, {
      transformation: [
        {
          width: 400, // Set desired width
          height: 400, // Set desired height
          crop: "fill", // Crop to fill the box
          gravity: "auto", // Automatically focus on the most important part (e.g. face)
        },
        {
          fetch_format: "auto", // Automatically optimize format (e.g. webp)
          quality: "auto", // Automatically optimize quality
        },
      ],
    });

    if (!uploadResponse.secure_url) {
      log.error(
        "Failed to upload image to Cloudinary",
        "Update Profile Controller"
      );
      return res
        .status(500)
        .json({ message: "Failed to upload image to Cloudinary" });
    }

    const newProfilePicUrl = uploadResponse.secure_url;

    // Update user in DB
    await pool.query(
      `
      UPDATE users 
      SET profile_pic = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
      `,
      [newProfilePicUrl, userId]
    );
    log.success("upload image to Cloudinary", "Update Profile Controller");

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePic: newProfilePicUrl,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      message: "Internal server error while updating profile picture",
    });
  }
};
