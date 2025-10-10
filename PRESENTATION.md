# Project Presentation — ideal_chatlify

## NAMES AND ADM

1 PHINEAS NDUNGU PA106/G/17490/22
2 Bonface mamboleo ondieki  PA106/G/15339/21
3 Polycarp Sally PA106/G/17443/22
4 mark njogu PA106/G/17469/22
5 Eric mue.  Pa106/g/17479/22

---

## Slide 1 — Title

- ideal_chatlify — KIRINYAGA STUDENTS CHAT CENTER
- Tech: Node.js, Socket.IO, React, Vite

---

## Slide 2 — Motivation & Goals

- Demonstrate a simple distributed chat architecture.
- Show client failover, message persistence, and multi-node communication.
- Keep the design lightweight and educational for a class assignment.

---

## Slide 3 — System overview (architecture)

- Three independent backend nodes (Socket.IO servers).
- Clients connect to any node; messages are persisted locally and relayed to peers.
- Deduplication via message ids on relay; simple REST endpoints for health and users.

---

## Slide 4 — How it works (runtime flow)

1. Client connects to a randomly-selected node and emits `set_username`.
2. Client sends `chat_message` events that the node persists and broadcasts locally.
3. Node POSTs message to peers at `/internal/relay`.
4. Peers deduplicate by id, persist, and broadcast locally.

---

## Slide 5 — Demo steps (live demo)

1. Start backend nodes: `node scripts/manage_servers.js start`.
2. Start frontend: `cd frontend && npm run dev`.
3. Open 2–3 browser windows and join with different names.
4. Send messages and observe cross-node delivery.
5. Kill one node: `node scripts/manage_servers.js stop` (or kill PID) and show reconnect behavior.

---

## Slide 6 — Challenges & Solutions

- Message duplication: solved via unique message ids + deduplication.
- Process spawning / paths: use `process.execPath` and resolve script paths relative to the manager script.
- Persistence overhead: explained and flagged for improvement.

---

## Slide 7 — Performance & Observations

- Local latency: sub-100ms for local dev machine.
- Relay overhead proportional to peers; file I/O can be the bottleneck.

---

## Slide 8 — Future improvements

- Centralized datastore or message broker (Redis / PostgreSQL).
- Stronger ordering guarantees and authentication.
- Metrics and monitoring.

---

## Slide 9 — How to reproduce (quick)

- Clone repo, install, start manager, run frontend, open browser.
- If asked: show `backend/test/harness.js` for simulated clients.

---

## Slide 10 — Questions

- Invite feedback and questions from the audience.
