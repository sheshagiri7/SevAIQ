#!/usr/bin/env bash

# SevAIQ Auto-Push Watcher Daemon
# Automatically detects changes, commits them with timestamps, and pushes to origin/main.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$REPO_ROOT/.git/auto-push.pid"
LOG_FILE="$REPO_ROOT/.git/auto-push.log"
BRANCH="main"
POLL_INTERVAL=5
DEBOUNCE_DELAY=6

cd "$REPO_ROOT" || exit 1

run_watcher() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Auto-push daemon started for branch '$BRANCH' in $REPO_ROOT" >> "$LOG_FILE"
  
  while true; do
    # Do not auto-commit if a merge or rebase is in progress
    if [ -d "$REPO_ROOT/.git/rebase-merge" ] || [ -d "$REPO_ROOT/.git/rebase-apply" ] || [ -f "$REPO_ROOT/.git/MERGE_HEAD" ]; then
      sleep "$POLL_INTERVAL"
      continue
    fi

    # Check for untracked or modified files
    STATUS=$(git status --porcelain)
    if [ -n "$STATUS" ]; then
      # Debounce to let multi-file edits or saves settle
      sleep "$DEBOUNCE_DELAY"

      STATUS=$(git status --porcelain)
      if [ -n "$STATUS" ]; then
        FILE_COUNT=$(echo "$STATUS" | wc -l | tr -d ' ')
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
        SUMMARY_FIRST_FILE=$(echo "$STATUS" | head -n 1 | awk '{print $2}')
        
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Changes detected in $FILE_COUNT file(s). Staging and committing..." >> "$LOG_FILE"

        git add -A >> "$LOG_FILE" 2>&1
        
        COMMIT_MSG="chore(auto-sync): update $FILE_COUNT file(s) - $SUMMARY_FIRST_FILE [$TIMESTAMP]"
        git commit -m "$COMMIT_MSG" >> "$LOG_FILE" 2>&1
        
        if [ $? -eq 0 ]; then
          echo "[$(date '+%Y-%m-%d %H:%M:%S')] Pushing commit to origin $BRANCH..." >> "$LOG_FILE"
          PUSH_OUTPUT=$(git push origin "$BRANCH" 2>&1)
          PUSH_STATUS=$?
          echo "$PUSH_OUTPUT" >> "$LOG_FILE"
          
          if [ $PUSH_STATUS -eq 0 ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Push successful!" >> "$LOG_FILE"
          else
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Push failed with exit code $PUSH_STATUS. Will retry on next cycle." >> "$LOG_FILE"
          fi
        else
          echo "[$(date '+%Y-%m-%d %H:%M:%S')] Git commit failed or nothing to commit." >> "$LOG_FILE"
        fi
      fi
    fi

    sleep "$POLL_INTERVAL"
  done
}

start_daemon() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
      echo "Auto-push daemon is already running (PID: $PID)."
      return 0
    else
      rm -f "$PID_FILE"
    fi
  fi

  nohup bash "$0" --run-internal >> "$LOG_FILE" 2>&1 &
  DAEMON_PID=$!
  echo "$DAEMON_PID" > "$PID_FILE"
  echo "Auto-push daemon started (PID: $DAEMON_PID)."
  echo "Watching $REPO_ROOT for changes every $POLL_INTERVAL seconds..."
  echo "Log output available at: $LOG_FILE"
}

stop_daemon() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
      kill "$PID"
      rm -f "$PID_FILE"
      echo "Auto-push daemon stopped (PID: $PID)."
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] Auto-push daemon stopped by user" >> "$LOG_FILE"
      return 0
    else
      rm -f "$PID_FILE"
      echo "No active process found for PID $PID (cleaned stale pid file)."
      return 0
    fi
  else
    echo "Auto-push daemon is not running."
  fi
}

status_daemon() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
      echo "Auto-push daemon is RUNNING (PID: $PID)."
      echo ""
      echo "--- Recent Activity (Last 10 lines from $LOG_FILE) ---"
      tail -n 10 "$LOG_FILE" 2>/dev/null || echo "(no logs yet)"
      return 0
    fi
  fi
  echo "Auto-push daemon is NOT running."
}

case "$1" in
  --run-internal)
    run_watcher
    ;;
  start)
    start_daemon
    ;;
  stop)
    stop_daemon
    ;;
  restart)
    stop_daemon
    sleep 1
    start_daemon
    ;;
  status)
    status_daemon
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
