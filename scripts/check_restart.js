#!/usr/bin/env node
// Cross-platform check/restart script — stops servers, starts them, and polls health endpoints.
import { spawnSync } from 'child_process';
import http from 'http';

function run(cmd, args=[]) {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.error) throw r.error;
  return r.status;
}

console.log('Stopping servers...');
try { run('node', ['scripts/manage_servers.js', 'stop']); } catch (e) { console.warn('stop failed', e && e.message); }
console.log('Starting servers...');
run('node', ['scripts/manage_servers.js', 'start']);

const ports = [3010,3011,3012];
for (const port of ports) {
  const url = `http://localhost:${port}/internal/health`;
  console.log('Checking', url);
  const req = http.get(url, (res) => {
    let body = '';
    res.on('data', c=>body+=c);
    res.on('end', ()=>{
      console.log(`port ${port} -> ${res.statusCode} ${body}`);
    });
  });
  req.on('error', (err)=>{
    console.warn(`port ${port} not responding:`, err.message);
  });
}

console.log('Done.');
