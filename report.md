Distributed Chat Application — Report

1. Architecture

This project implements a simple distributed chat system consisting of three independent Node.js server nodes and a React frontend client. Each server:

- Accepts client connections using socket.io (WebSocket).
- Maintains a local in-memory message log persisted to `backend_message_log.json`.
- Broadcasts messages to locally connected clients.
- Relays received messages to peer servers via HTTP POST `/internal/relay` to ensure messages are propagated to other nodes.
- Exposes internal endpoints for health and connected users: `/internal/health` and `/internal/users`.

Clients:

- Connect to a randomly selected server from a configured list.
- Receive the recent message log and live messages.
- On disconnect, attempt to connect to another server (basic failover).
- Provide a simple UI to enter a username and send messages.

2. Implementation details

- Backend: `backend/src/server.js` uses Express + socket.io. Messages are deduplicated by a generated `id` to avoid loops. Peers are configured using the `PEERS` environment variable.
- Frontend: `frontend/src/App.jsx` uses `socket.io-client` and a simple UI. The client emits `set_username` to register a username on the server.
- Management: `scripts/manage_servers.js` can start/stop/restart all three servers and stores PIDs in `.server_pids.json`.
- Test harness: `backend/test/harness.js` simulates multiple clients connecting and verifying broadcast.

3. Fault tolerance and message persistence

- Message persistence: messages are appended to `backend_message_log.json`. On restart, servers load the log and can serve the recent messages to new clients.
- Failover: clients detect disconnects and attempt to connect to other servers. Servers continue to operate independently when peers fail. Relayed messages provide eventual propagation when peers are available.
- Further improvements: implement a gossip protocol for stronger consistency, or use a shared backend (Redis, Kafka) for reliable delivery and persistence.

4. Testing and verification

- Manual test: Start the 3 servers and frontend. Open multiple browser windows to connect multiple clients. Send messages and verify they appear across windows even if connected to different servers.
- Automated harness: run `node backend/test/harness.js http://localhost:3010 3` after servers are up to simulate 3 clients and validate basic broadcast.

5. Challenges and solutions

- Deduplication: relayed messages can create loops; solved by attaching unique IDs and dropping duplicates.
- Peer discovery: a static `PEERS` env variable is used for simplicity. A production system would use service discovery.

6. How to run (recap)

- Install deps: `cd backend && npm install`, `cd frontend && npm install`.
- Start servers: `node scripts/manage_servers.js start` (or individually via `npm run start:3010` etc).
- Start frontend: `cd frontend && npm run dev`.

Screenshots (placeholders)

- Screenshot 1: Frontend UI connected with three clients
  ![screenshot-frontend-1](screenshots/frontend-1.png)

- Screenshot 2: Backend logs showing relay between servers
  ![screenshot-backend-1](screenshots/backend-1.png)

- Screenshot 3: Message log file content preview
  ![screenshot-log-1](screenshots/log-1.png)

Appendix: Files changed and locations

- `backend/src/server.js` — main server logic
- `backend/src/routes/message.route.js` — logs endpoint
- `backend/test/harness.js` — test harness
- `scripts/manage_servers.js` — start/stop/restart manager
- `frontend/src/App.jsx`, `frontend/src/App.css` — updated client UI
- `README_ASSIGNMENT.md` — run & test instructions

