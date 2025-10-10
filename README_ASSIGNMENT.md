# Distributed Chat Assignment - Run & Test

## NAMES AND ADM

1 PHINEAS NDUNGU PA106/G/17490/22
2 Bonface mamboleo ondieki  PA106/G/15339/21
3 Polycarp Sally PA106/G/17443/22
4 mark njogu PA106/G/17469/22
5 Eric mue.  Pa106/g/17479/22

Quick start (from repo root):

1) Install dependencies

```bash
# backend
cd backend
npm install

# frontend (in new terminal)
cd ../frontend
npm install
```

2;Start three backend nodes (three terminals)

```bash
# terminal 1
cd backend
npm run start:3000

# terminal 2
cd backend
npm run start:3001

# terminal 3
cd backend
npm run start:3002
```

3; Start frontend (new terminal)

```bash
cd frontend
npm run dev
```

4; Open the frontend (Vite will print the URL, default <http://localhost:5173>). The client will randomly pick one of the three servers to connect to. Open multiple browser windows to simulate multiple clients.
4; Open the frontend (Vite will print the URL, default <http://localhost:5173>). The client will randomly pick one of the three servers (ports 3010, 3011, 3012) to connect to. Open multiple browser windows to simulate multiple clients.

Demonstrations to run for the assignment:

- Multiple clients connect and exchange messages: open multiple browser windows, enter a name, and send messages. Messages should appear in all connected clients.
- Server failover: stop (Ctrl+C) one backend server (e.g., port 3001). Clients connected to that server will attempt reconnection and pick another server; messages should continue to flow.
- Message persistence: each server keeps a local message log (`backend_message_log.json`) and exposes `/api/message/logs`.

How it meets the assignment requirements:

- Multiple server nodes: three servers (3000,3001,3002) act as independent nodes.
- Inter-node communication: servers relay messages to peers via HTTP POST `/internal/relay` and broadcast to their local clients.
- Client-side failover: the client picks a random server and will attempt to reconnect to another if disconnected.
- Message persistence: messages are appended to `backend_message_log.json` and served via `/api/message/logs`.

Checking logs and errors:

- Backend terminal outputs connection logs and relay errors.
- Frontend dev server outputs runtime errors in the terminal and browser console.
- You can view `backend_message_log.json` to inspect persisted messages.
