# SevAIQ Automatic Git Sync Daemon

SevAIQ includes an automated background synchronization daemon (`scripts/auto-push.sh`) that monitors the repository for changes and pushes them automatically to `origin/main`.

## Features
- **Polling interval**: Inspects the repository every 5 seconds for unstaged or modified files.
- **Smart Debounce (6s)**: Ensures multi-file edits settle before committing.
- **Rebase/Merge Safety**: Automatically skips committing during active git rebase or merge operations.
- **Zero Working-Directory Pollution**: Daemon PID and logs are stored in `.git/` (`.git/auto-push.pid`, `.git/auto-push.log`).

## Commands

### Via npm (from `frontend/` directory):
```bash
npm run auto-push        # Start background daemon
npm run auto-push:status # Check daemon status & view recent sync logs
npm run auto-push:stop   # Stop background daemon
```

### Via Shell Script (from repo root):
```bash
./scripts/auto-push.sh start   # Start daemon in background
./scripts/auto-push.sh status  # View status and last 10 lines of sync logs
./scripts/auto-push.sh stop    # Stop daemon
./scripts/auto-push.sh restart # Restart daemon
```
