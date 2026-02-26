#!/usr/bin/env bash
set -euo pipefail

cd /data/.openclaw/workspace
mkdir -p operation-dashboard/.runtime
PID_FILE=operation-dashboard/.runtime/sync-loop.pid
LOG_FILE=operation-dashboard/.runtime/sync-loop.log

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "already running pid=$(cat "$PID_FILE")"
  exit 0
fi

nohup bash -lc '
  while true; do
    node /data/.openclaw/workspace/operation-dashboard/scripts/sync-state.mjs >> /data/.openclaw/workspace/operation-dashboard/.runtime/sync-loop.log 2>&1 || true
    sleep 30
  done
' >/dev/null 2>&1 &

echo $! > "$PID_FILE"
echo "started pid=$(cat "$PID_FILE") log=$LOG_FILE"