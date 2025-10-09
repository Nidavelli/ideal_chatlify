import express from "express";
import { log } from "../utils/logger.util.js ";

const router = express.Router();

import { signup, login, logout } from "../controllers/auth.controller.js";

try {
  router.post("/signup", signup);
  router.post("/login", login);
  router.post("/logout", logout);

  log.success("Auth routes set up successfully", "auth.route.js");
} catch (error) {
  log.error("Error setting up auth routes", error);
}

export default router;
