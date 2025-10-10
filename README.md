# ideal_chatlify

KIRINYAGA STUDENTS CHAT CENTER — a lightweight distributed chat prototype built using Node.js, Socket.IO, and a React + Vite frontend. This repository contains a multi-node backend (3 server nodes by default), a React frontend client that connects to any node, simple message persistence, and utilities to start/stop/manage the nodes.

---

## Quick overview

- Backend: Express + Socket.IO servers (three nodes, default ports 3010, 3011, 3012). Each node accepts client socket connections, persists messages locally, and relays messages to configured peers.
- Frontend: React + Vite app using `socket.io-client`. The client randomly selects a backend node and reconnects on failure.
- Persistence: File-based message log per node (`backend_message_log.json`).
- Management: `scripts/manage_servers.js` to start/stop/restart node processes and `scripts/check_restart.sh` to validate health endpoints.

---

## What changed from upstream

This project was adapted and extended for a distributed chat assignment. Any direct external references were removed. YouTube links and upstream references have been intentionally left out of this README.

---

## Setup — prerequisites

- Node.js (>= 18 recommended). Verify with:

```bash
node -v
npm -v
```

- Git (optional) if cloning the repo.

- A POSIX-compatible shell (bash/zsh) for the management scripts.

**Windows users:** the project works on Windows (WSL or native) but the bundled `scripts/check_restart.sh` is a bash script. A cross-platform Node replacement (`scripts/check_restart.js`) is provided and should be used on Windows or where bash is unavailable.

---

## Install dependencies

From the project root run two installs (backend and frontend):

```bash
# from project root
cd backend && npm install
cd ../frontend && npm install
cd ..
```

Note: if you prefer a single command from root you can run both installs in parallel (your shell may differ):

```bash
(cd backend && npm install) & (cd frontend && npm install) & wait
```

---

## Configuration

- Servers accept a `PEERS` environment variable (comma-separated list of peer base URLs) and `PORT` for binding. The provided `scripts/manage_servers.js` sets these automatically when starting default nodes on ports 3010/3011/3012.
- If you need to change ports or peers, edit the `scripts/manage_servers.js` or set `PORT`/`PEERS` when starting a node manually.

---

## Run the system (development)

From the project root you can start the three backend nodes using the manager script and then run the frontend:

```bash
# start backend nodes (creates .server_pids.json)
node ./scripts/manage_servers.js start

# open a new terminal and start the frontend dev server
cd frontend
npm run dev
```

The frontend will open on a Vite dev server (usually <http://localhost:5173>). The client chooses a backend node at random from the default list and connects.

To stop the backend nodes:

```bash
node ./scripts/manage_servers.js stop
```

To restart:

```bash
node ./scripts/manage_servers.js restart

### Windows (PowerShell or cmd) notes

You can run the same Node manager script on Windows (PowerShell/cmd) as long as Node is installed and on PATH. From a PowerShell prompt (run as the project root):

```powershell
# start
node .\scripts\manage_servers.js start

# stop
node .\scripts\manage_servers.js stop

# restart
node .\scripts\manage_servers.js restart
```

To run the cross-platform health check script (Node):

```powershell
node .\scripts\check_restart.js
```
```

---

## Run the system (manual single node)

If you want to run a single backend node manually (useful for debugging):

```bash
# from project root
cd backend
# set port and peers as needed; example for a single node:
PORT=3010 PEERS="" node src/server.js
```

Open the frontend and configure it to connect to the matching server (the default client will try 3010/3011/3012).

---

## How to use the chat (end-user)

1. Open the frontend in a browser (Vite dev server URL). You will be prompted to enter a display name before joining the chat.
2. Type messages in the composer and press Enter or click send.
3. The sidebar shows currently connected users (this is fetched from the server and updated in real time).
4. If the server you are connected to fails, the client will attempt to reconnect. It also randomly selects a node on page load for initial connection.

Notes:

1. Messages are persisted on each node locally. Messages you see are the union of ones relayed by the node you connected to.
2. To test failover: start multiple browser clients, stop one backend node using the manager script, and observe clients reconnecting to other nodes.

---

## Endpoints (for debugging & testing)

- `GET /internal/health` — returns basic health info and configured peers.
- `GET /internal/users` — returns connected sockets and usernames for that node.
- `POST /internal/relay` — internal endpoint used by peers to relay messages.
- `GET /api/message/logs` — returns the persisted message log for that node.
- Root `/` serves a small server status dashboard (HTML) for convenience.

---

## Architecture, challenges, and solutions (2–3 page summary)

### Architecture summary

The system follows a multi-node, peer-relay architecture:

- Each backend node is a standalone Socket.IO server. Clients connect to any node.
- When a message arrives at a node it is appended to the local message log and broadcast to connected clients.
- The node then POSTs the message to configured peers at `/internal/relay`. Each peer deduplicates messages by id and persists/broadcasts them locally.
- Clients are responsible for selecting a server and re-establishing connections when a node fails. The client emits a `set_username` event on join to register a display name with the server.

This design keeps backend nodes loosely-coupled and avoids a single point of failure while keeping implementation simple for an assignment context.

### Key challenges faced

1. Distributed message consistency and duplication

  - Problem: With multiple independent nodes, relaying messages between peers can cause duplicates or out-of-order messages.
  - Solution: Add a unique `id` to each message envelope (timestamp + random suffix). Peers deduplicate incoming messages by id before persisting or re-broadcasting. Messages also carry a `receivedAt` timestamp for best-effort ordering. For a full production system, a central store or vector clocks would be needed; here deduplication and timestamps are sufficient for the assignment.

2. Client failover and reconnection behavior

  - Problem: Clients should be able to connect to any node and recover if the node disappears.
  - Solution: The client randomly selects a node on page load and uses Socket.IO's reconnection features. After reconnect, the client re-emits `set_username` so the server has the display name. The client also fetches `/internal/users` as a REST fallback in case realtime events are delayed.

3. Process management and environment differences

  - Problem: Starting multiple node processes reliably across environments (spaces in paths, nvm-managed node binaries) caused spawn / ENOENT issues when using a literal `node` in the manager script.
  - Solution: Use `process.execPath` (the absolute Node path used to run the manager script) when spawning child processes. Also resolve child script paths relative to the script file (using `import.meta.url`) and decode URL-encoded paths to avoid broken paths when the workspace path contains spaces.

4. Persistence, durability and performance

  - Problem: File-based persistence is simple but can be I/O bound and inconsistent across nodes.
  - Solution: Keep logs append-only in memory and flush to disk periodically on change. Implement a capped list to prevent unbounded memory growth (e.g., keep the latest 1000 messages). For better performance and reliability, a persistent datastore (Redis, SQLite, or a centralized DB) is recommended for future improvements.

5. User identity propagation

  - Problem: Some clients were initially showing as "Anonymous" because the client did not always emit `set_username` before sending messages or due to reconnection timing.
  - Solution: Server accepts an explicit `set_username` event and as a fallback sets username from the first message `from` field when present; it then broadcasts an updated users list. The client is updated to call `set_username` on join and after reconnect.

### Performance evaluation (informal)

- Environment used: Development machine (Linux), Node.js 20.x, browser clients (Chrome/Firefox). No dedicated benchmarking infra.

- Observations:
  - Single-node throughput: For small messages (<1KB) the single node sustained dozens of messages per second with negligible latency on a dev laptop. Latency was dominated by network and socket round-trip time (sub-100ms locally).
  - Multi-node relay overhead: Relaying messages to peers introduced additional latency proportional to number of peers. For three-node setup, the relay added a few tens of milliseconds per peer on the same machine. The overhead is acceptable for chat workloads but would increase with many peers or large messages.
  - Persistence overhead: File writes synchronous on each message can be expensive. The current implementation writes the full JSON log on each change which is simple but not optimal. For the assignment scope it is acceptable, but for higher throughput, an append-only log, batching, or a DB is recommended.

### Potential improvements

- Replace file-based persistence with a transactional datastore (SQLite, Redis, or PostgreSQL) to ensure durability and make cross-node reads easier.
- Implement a lightweight gossip protocol or use a message broker (e.g., Redis pub/sub) to reduce relay overhead and avoid O(N^2) traffic when more peers are added.
- Add message ordering guarantees using sequence numbers or vector clocks if strict ordering is required.
- Add authentication and access control so usernames are validated and sessions are protected.
- Add metrics (Prometheus) and tracing for observability under load.
- Improve persistence to use append-only writes and batching to reduce I/O.

---

## Files of interest

- `backend/src/server.js` — main server logic, socket io handlers, internal endpoints.
- `backend/src/routes/message.route.js` — message logs route.
- `frontend/src/App.jsx` — React chat UI and socket.io-client integration.
- `frontend/src/App.css` — styling (Twilight theme).
- `scripts/manage_servers.js` — helper to start/stop/restart backend nodes.
- `backend/test/harness.js` — small harness to simulate multiple clients.

---

## How we verified correctness

- Manual testing: Open multiple browser clients, join with different display names, and verify messages appear across clients connected to different nodes.
- Harness testing: A Node script (`backend/test/harness.js`) simulates multiple socket clients and asserts messages are received.
- Health checks: Each node exposes `/internal/health` and `/internal/users` for manual inspection.

---

## Team members

Please add up to 5 member names here (replace placeholders):

1. mark
2. phineas
3. sally
4. bonne
5. caleb

---

## Where to look next

- To harden this prototype for production, focus on persistent storage, a proper message broker for inter-node communication, authentication, and operational tooling (logging/metrics/alerts).

---

## License

This project is provided as-is for educational purposes. Add a license file if you plan to publish.
