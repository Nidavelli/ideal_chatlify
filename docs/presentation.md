# Project Presentation — ideal_chatlify

Use this document as a step-by-step guide for presenting the project. Each section works like a slide: read the header, then expand on the bullet points.

---

## Slide 1 — Title

- ideal_chatlify — KIRINYAGA STUDENTS CHAT CENTER
- Team: (add member names in README)
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

---


Notes:
- If you want a slide deck (PPTX), I can convert this markdown into slides using Pandoc or reveal.js and export to PDF or PPTX if you want.
