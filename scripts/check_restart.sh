#!/usr/bin/env bash
# Usage: scripts/check_restart.sh
# Stops all servers, restarts them, then checks health endpoints.
set -e
node scripts/manage_servers.js stop || true
sleep 1
node scripts/manage_servers.js start
sleep 1
for port in 3010 3011 3012; do
  echo "Checking http://localhost:${port}/internal/health"
  curl -sS "http://localhost:${port}/internal/health" || echo "port ${port} not responding"
done
echo "Done"
