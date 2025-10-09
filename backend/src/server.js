import express from "express";
import path from "path";

import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";

import { log } from "./utils/logger.util.js";

import { initDB } from "../database/database.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

const app = express();
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);

app.get("/database", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.send(`Database time: ${result.rows[0].now}`);
    log.success("Database successfully connected", "DATABASE");
  } catch (err) {
    log.error(err, "DATABASE");
    res.status(500).send("Error connecting to the database");
  }
});

// Make ready for deployment
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

const PORT = process.env.PORT || 3000;

initDB().then(() => {
  try {
    app.listen(PORT, () => {
      log.success(`Server running on port ${PORT}`, "SERVER");
    });
  } catch (error) {
    log.error("Server failed to start", error);
  }
});
