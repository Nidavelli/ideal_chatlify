// db.js
import { Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config();

import { log } from "../src/utils/logger.util.js";

const { PGUSER, PGPASSWORD, PGHOST, PGDATABASE } = process.env;

// Build connection string
const connectionString = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require&channel_binding=require&timezone=Africa/Nairobi`;

// Initialize pool
export const pool = new Pool({ connectionString });

// Export SQL query interface
// export const sql = pool;

// ✅ Optional: Initialize the messages table
export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        profile_pic TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id VARCHAR(255) NOT NULL,
        receiver_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    log.success(
      "Initialized. Tables created/loaded successfully",
      "database.js"
    );
  } catch (error) {
    log.error("Failed to initialize the database", error);
  }
};
