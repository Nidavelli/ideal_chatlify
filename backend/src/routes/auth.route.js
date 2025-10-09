import express from "express";
import { log } from "../utils/logger.util.js ";

import { protectRoute } from "../middleware/auth.middleware.js";
import {
  signup,
  login,
  logout,
  updateProfile,
} from "../controllers/auth.controller.js";

const router = express.Router();

try {
  router.post("/signup", signup);
  router.post("/login", login);
  router.post("/logout", logout);

  router.put("/update-profile", protectRoute, updateProfile);

  router.get("/check", protectRoute, (req, res) =>
    res.status(200).json(req.user)
  );

  log.success("Auth routes set up successfully", "auth.route.js");
} catch (error) {
  log.error("Error setting up auth routes", error);
}

export default router;
