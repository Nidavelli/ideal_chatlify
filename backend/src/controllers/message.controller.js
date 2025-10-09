import { pool } from "../../database/database.js";
import { log } from "../utils/logger.util.js";
import cloudinary from "../utils/cloudinary.util.js";
import { getReceiverSocketId, io } from "../utils/socket.util.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    const result = await pool.query(
      `
      SELECT id, full_name, email, profile_pic, created_at, updated_at
      FROM users
      WHERE id != $1;
      `,
      [loggedInUserId]
    );

    res.status(200).json(result.rows);
    log.success("Fetched all users except current user", "getAllContacts");
  } catch (error) {
    log.error("Error in getAllContacts:", error.message || error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user.id;
    const { id: userToChatId } = req.params;

    //me and you
    //i send you the message
    //you send me the message
    const result = await pool.query(
      `
      SELECT *
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC;
      `,
      [myId, userToChatId]
    );

    res.status(200).json(result.rows);
    log.success("Messages fetched successfully", "getMessagesByUserId");
  } catch (error) {
    log.error("Error in getMessagesByUserId:", error.message || error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user.id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: "Cannot send messages to yourself." });
    }

    // Check if receiver exists
    const receiverResult = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [receiverId]
    );

    if (receiverResult.rowCount === 0) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl = null;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image, {
        transformation: [
          { width: 500, height: 500, crop: "fill", gravity: "face" },
        ],
      });
      imageUrl = uploadResponse.secure_url;
    }

    // Insert message into DB
    const insertResult = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, text, image)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [senderId, receiverId, text || null, imageUrl]
    );

    const newMessage = insertResult.rows[0];

    // Emit new message via sockets (if socket setup exists)
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    log.error("Error in sendMessage controller", error.message || error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user.id; // UUID string

    // Get all distinct user IDs who have chatted with the logged-in user
    const { rows } = await pool.query(
      `
      SELECT DISTINCT
        CASE
          WHEN sender_id = $1 THEN receiver_id
          ELSE sender_id
        END AS chat_partner_id
      FROM messages
      WHERE sender_id = $1 OR receiver_id = $1;
      `,
      [loggedInUserId]
    );

    const chatPartnerIds = rows.map((row) => row.chat_partner_id);

    if (chatPartnerIds.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch chat partner details excluding password
    // Assuming your users table doesn't store password field as 'password' or you can exclude it in query
    const { rows: chatPartners } = await pool.query(
      `
      SELECT id, email, full_name, profile_pic, created_at, updated_at
      FROM users
      WHERE id = ANY($1::uuid[]);
      `,
      [chatPartnerIds]
    );

    res.status(200).json(chatPartners);
  } catch (error) {
    log.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
