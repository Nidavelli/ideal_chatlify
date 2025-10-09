import express from "express";

import { log } from "../utils/logger.util.js";
import {
  getAllContacts,
  getMessagesByUserId,
  sendMessage,
  getChatPartners,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

try {
  router.get("/contacts", protectRoute, getAllContacts);
  router.get("/chats", protectRoute, getChatPartners);
  router.get("/:id", protectRoute, getMessagesByUserId);
  router.post("/send/:id", protectRoute, sendMessage);

  log.success("Message routes set up successfully", "message.route.js");
} catch (error) {
  log.error("Error setting up message routes", error);
}

export default router;
