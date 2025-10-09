import express from "express";
import { log } from "../utils/logger.util.js ";

const router = express.Router();

import { signup } from "../controllers/auth.controller.js";

try {
  router.post("/signup", signup);
  router.get("/login", (req, res) => {
    res.send("Login endpoint");
  });
  router.get("/logout", (req, res) => {
    res.send("Logout endpoint");
  });

  log.success("Auth routes set up successfully", "auth.route.js");
} catch (error) {
  log.error("Error setting up auth routes", error);
}

export default router;
