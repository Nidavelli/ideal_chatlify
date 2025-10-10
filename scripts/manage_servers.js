#!/usr/bin/env node
// Simple server manager to start/stop/restart three backend instances (3010-3012)
// Usage: node scripts/manage_servers.js start|stop|restart|status

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// derive script directory (works with ESM import.meta.url)
const SCRIPT_DIR = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname));
// project root is one level up from scripts dir
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');

const ACTION = process.argv[2] || 'status';
const PID_FILE = path.resolve(process.cwd(), '.server_pids.json');

const SERVERS = [3010,3011,3012];

function savePids(pids) {
  fs.writeFileSync(PID_FILE, JSON.stringify(pids, null, 2));
}

function loadPids() {
  try { return JSON.parse(fs.readFileSync(PID_FILE, 'utf8') || '{}'); } catch (e) { return {}; }
}

if (ACTION === 'start') {
  const pids = loadPids();
  SERVERS.forEach(port => {
    if (pids[port]) {
      console.log(`server on ${port} already started (pid=${pids[port]})`);
      return;
    }
    const env = Object.assign({}, process.env, { PORT: String(port), PEERS: SERVERS.filter(p=>p!==port).map(p=>`http://localhost:${p}`).join(',') });
    const nodeExe = process.execPath || 'node';
  const serverScript = path.resolve(PROJECT_ROOT, 'backend', 'src', 'server.js');
    try {
      // spawn without detached/unref and use absolute script path to avoid path/space issues
      const child = spawn(nodeExe, [serverScript], { env, stdio: ['ignore','inherit','inherit'] });
      console.log(`started server ${port} pid=${child.pid}`);
      pids[port] = child.pid;
    } catch (err) {
      console.warn(`failed to start server ${port}:`, err && err.message);
    }
  });
  savePids(pids);
} else if (ACTION === 'stop') {
  const pids = loadPids();
  Object.keys(pids).forEach(port => {
    try {
      process.kill(pids[port], 'SIGTERM');
      console.log(`stopped server ${port} pid=${pids[port]}`);
      delete pids[port];
    } catch (e) {
      console.warn(`could not stop ${port}:`, e.message);
    }
  });
  savePids(pids);
} else if (ACTION === 'restart') {
  // stop then start
  const pids = loadPids();
  Object.keys(pids).forEach(port => {
    try { process.kill(pids[port], 'SIGTERM'); } catch (e) {}
    delete pids[port];
  });
  savePids(pids);
  // start fresh
  const newPids = {};
  SERVERS.forEach(port => {
    const env = Object.assign({}, process.env, { PORT: String(port), PEERS: SERVERS.filter(p=>p!==port).map(p=>`http://localhost:${p}`).join(',') });
    const nodeExe = process.execPath || 'node';
  const serverScript = path.resolve(PROJECT_ROOT, 'backend', 'src', 'server.js');
    try {
      const child = spawn(nodeExe, [serverScript], { env, stdio: ['ignore','inherit','inherit'] });
      console.log(`started server ${port} pid=${child.pid}`);
      newPids[port] = child.pid;
    } catch (err) {
      console.warn(`failed to start server ${port}:`, err && err.message);
    }
  });
  savePids(newPids);
} else if (ACTION === 'status') {
  const pids = loadPids();
  for (const port of SERVERS) {
    const pid = pids[port];
    if (!pid) {
      console.log(`${port}: not running`);
    } else {
      try { process.kill(pid, 0); console.log(`${port}: running pid=${pid}`); } catch (e) { console.log(`${port}: pid=${pid} not alive`); }
    }
  }
} else {
  console.log('usage: manage_servers.js start|stop|restart|status');
}
