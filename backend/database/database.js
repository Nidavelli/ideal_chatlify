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
    // await pool.query(`DROP TABLE IF EXISTS messages;`);
    // await pool.query(`DROP TABLE IF EXISTS users;`); // Optional: if you want a clean reset

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
        sender_id UUID NOT NULL,
        receiver_id UUID NOT NULL,
        text TEXT CHECK (char_length(text) <= 2000),
        image TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    log.success(
      "Initialized. Tables created/loaded successfully",
      "database.js"
    );
  } catch (error) {
    log.error("Failed to initialize the database", error?.message || error);
    console.error(error);
  }
};
