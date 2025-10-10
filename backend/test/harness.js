#!/usr/bin/env node
// Simple test harness: spawn N clients that connect to a chosen server and exchange messages
// Usage: node backend/test/harness.js [serverUrl] [numClients]

import { io } from 'socket.io-client';

const server = process.argv[2] || 'http://localhost:3010';
const N = parseInt(process.argv[3] || '3', 10);

console.log('Connecting', N, 'clients to', server);

const clients = [];
let receivedCounts = Array(N).fill(0);

for (let i=0;i<N;i++) {
  const c = io(server, { reconnectionAttempts: 3 });
  clients.push(c);
  c.on('connect', () => {
    console.log('client', i, 'connected', c.id);
    c.emit('set_username', 'test' + i);
    if (i === N-1) {
      // last client sends a message after a short delay
      setTimeout(() => {
        console.log('sending test message from client', i);
        c.emit('chat_message', { from: 'test'+i, text: 'hello from ' + i });
      }, 500);
    }
  });
  c.on('chat_message', (msg) => {
    console.log('client', i, 'got message', msg.text, 'from', msg.from);
    receivedCounts[i] += 1;
    // If all clients have seen at least one message, finish
    if (receivedCounts.every(v => v>0)) {
      console.log('All clients received at least one message. PASS');
      clients.forEach(x=>x.disconnect());
      process.exit(0);
    }
  });
  c.on('connect_error', (err) => {
    console.error('client', i, 'connect_error', err.message);
  });
}

// Timeout
setTimeout(() => {
  console.error('Test timed out. Received counts:', receivedCounts);
  clients.forEach(x=>x.disconnect());
  process.exit(1);
}, 10000);
