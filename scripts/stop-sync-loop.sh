#!/usr/bin/env bash
set -euo pipefail
PID_FILE=/data/.openclaw/workspace/operation-dashboard/.runtime/sync-loop.pid
if [[ ! -f "$PID_FILE" ]]; then
  echo "not running"
  exit 0
fi
PID=$(cat "$PID_FILE")
if kill -0 "$PID" 2>/dev/null; then
  kill "$PID" || true
  echo "stopped $PID"
else
  echo "stale pid $PID"
fi
rm -f "$PID_FILE"