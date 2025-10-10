import express from "express";
import fs from 'fs';
import path from 'path';

const router = express.Router();

const LOG_FILE = path.resolve(process.cwd(), 'backend_message_log.json');

router.get('/logs', (req, res) => {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const raw = fs.readFileSync(LOG_FILE, 'utf8');
      return res.json(JSON.parse(raw || '[]'));
    }
    return res.json([]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
