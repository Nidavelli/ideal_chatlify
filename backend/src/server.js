import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import axios from "axios";

dotenv.config();

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);

const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: '*' }
});

// Simple in-memory message log with optional file persistence
const LOG_FILE = path.resolve(process.cwd(), 'backend_message_log.json');
let messageLog = [];
try {
  if (fs.existsSync(LOG_FILE)) {
    const raw = fs.readFileSync(LOG_FILE, 'utf8');
    messageLog = JSON.parse(raw || '[]');
  }
} catch (e) {
  console.warn('Could not read log file:', e.message);
}

function persistLog() {
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(messageLog, null, 2));
  } catch (e) {
    console.warn('Could not persist log:', e.message);
  }
}

// Peers are provided via env var PEERS as comma-separated URLs (e.g. http://localhost:3001)
const PEER_LIST = (process.env.PEERS || '').split(',').map(s => s.trim()).filter(Boolean);

io.on('connection', (socket) => {
  console.log('client connected', socket.id);

  // default username until client sets it
  socket.data.username = null;

  // send recent log to new client
  socket.emit('message_log', messageLog.slice(-200));

  // send current users list
  socket.emit('users', getConnectedUsers());

  socket.on('chat_message', (msg) => {
    const envelope = { id: Date.now() + '-' + Math.random().toString(36).slice(2,8), receivedAt: new Date().toISOString(), ...msg };
    // add to local log
    messageLog.push(envelope);
    if (messageLog.length > 1000) messageLog.shift();
    persistLog();

    // broadcast to local clients
    socket.broadcast.emit('chat_message', envelope);

    // relay to peers via HTTP POST /internal/relay
    for (const peer of PEER_LIST) {
      // avoid posting to self
      const thisUrl = `http://localhost:${process.env.PORT || 3000}`;
      if (peer === thisUrl) continue;
      axios.post(`${peer}/internal/relay`, envelope).catch(err => {
        console.warn('relay to', peer, 'failed:', err.message);
      });
    }

    // if the message includes a from field and the socket has no username yet,
    // set it and broadcast users list so the UI updates immediately
    if (msg && msg.from && (!socket.data.username || socket.data.username === 'Anonymous')) {
      socket.data.username = msg.from;
      io.emit('users', getConnectedUsers());
    }
  });

  // allow clients to explicitly set their username
  socket.on('set_username', (name) => {
    console.log('set_username from', socket.id, '=>', name);
    socket.data.username = name;
    // broadcast updated users list
    io.emit('users', getConnectedUsers());
  });

  // broadcast users list on connect/disconnect
  socket.on('disconnect', () => {
    console.log('client disconnected', socket.id, socket.data.username);
    io.emit('users', getConnectedUsers());
  });
});

// internal relay endpoint to accept peer messages
app.post('/internal/relay', (req, res) => {
  const envelope = req.body;
  if (!envelope || !envelope.id) return res.status(400).send({ error: 'invalid' });
  // deduplicate
  if (!messageLog.find(m => m.id === envelope.id)) {
    messageLog.push(envelope);
    if (messageLog.length > 1000) messageLog.shift();
    persistLog();
    // broadcast to local clients
    io.emit('chat_message', envelope);
  }
  return res.send({ ok: true });
});

// health endpoint
app.get('/internal/health', (req, res) => {
  res.json({ ok: true, port: process.env.PORT || PORT, peers: PEER_LIST });
});

// return connected users
function getConnectedUsers() {
  const sockets = Array.from(io.sockets.sockets.values());
  return sockets.map(s => ({ id: s.id, username: s.data.username || 'Anonymous' }));
}

app.get('/internal/users', (req, res) => {
  res.json(getConnectedUsers());
});

// Simple status dashboard at root
app.get('/', (req, res) => {
  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Server Status</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      body{font-family:system-ui,Arial;background:#0b1220;color:#e6eef8;padding:20px}
      .box{background:#071022;padding:16px;border-radius:8px;margin-bottom:12px}
      h1{margin:0 0 12px 0}
      pre{white-space:pre-wrap}
      ul{margin:0;padding-left:18px}
      .user{display:flex;gap:8px;align-items:center}
      .dot{width:10px;height:10px;border-radius:50%;background:#22c55e;display:inline-block}
    </style>
  </head>
  <body>
    <h1>Server Status</h1>
    <div class="box">
      <div><strong>Port:</strong> <span id="port">-</span></div>
      <div><strong>Peers:</strong></div>
      <ul id="peers"></ul>
    </div>
    <div class="box">
      <div><strong>Health:</strong> <span id="health">-</span></div>
      <div><strong>Users:</strong> <span id="usercount">0</span></div>
      <div id="users"></div>
    </div>
    <div>
      <button id="refresh">Refresh now</button>
      <small style="margin-left:8px;opacity:0.8">Auto-refresh every 3s</small>
    </div>
    <script>
      async function fetchJson(path){ try{ const r=await fetch(path); return await r.json(); } catch(e){ return {error:e.message} } }
      async function update(){
        const h = await fetchJson('/internal/health');
        if (h && h.port) document.getElementById('port').textContent = h.port;
        const peers = h.peers || [];
        const peersEl = document.getElementById('peers'); peersEl.innerHTML = '';
        peers.forEach(p=>{ const li=document.createElement('li'); li.textContent = p; peersEl.appendChild(li); });
        document.getElementById('health').textContent = h.ok ? 'OK' : JSON.stringify(h);
        const users = await fetchJson('/internal/users');
        document.getElementById('usercount').textContent = Array.isArray(users)?users.length:0;
        const usersDiv = document.getElementById('users'); usersDiv.innerHTML='';
        if (Array.isArray(users)){
          users.forEach(u=>{
            const d=document.createElement('div'); d.className='user';
            const dot=document.createElement('span'); dot.className='dot';
            const name=document.createElement('span'); name.textContent = u.username || 'Anonymous';
            d.appendChild(dot); d.appendChild(name); usersDiv.appendChild(d);
          })
        }
      }
      document.getElementById('refresh').addEventListener('click', update);
      update(); setInterval(update, 3000);
    </script>
  </body>
  </html>`;
  res.setHeader('Content-Type','text/html');
  res.send(html);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
  console.log('Peers:', PEER_LIST);
});
