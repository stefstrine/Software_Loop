# /prp - Project Requirements & Plan Status

Show current PRP status, active phase, and pending tasks.

## Usage

```
/prp              # Show full status
/prp phase        # Show current phase details only
/prp tasks        # Show pending tasks only
/prp tiers        # Show phases/architecture status
```

## Instructions

**IMPORTANT: This command uses the CLI for deterministic parsing.**

When the user runs `/prp`, execute the Software Loop CLI to get structured data, then format it for human readability.

### Step 1: Run CLI Command

```bash
sloop status --json
```

Or if `sloop` is not in PATH:
```bash
npx software-loop status --json
# OR
node dist/cli.js status --json
```

### Step 2: Parse JSON Output

The CLI returns structured JSON:
```json
{
  "success": true,
  "data": {
    "projectName": "My Project",
    "status": "active",
    "branch": "main",
    "lastUpdated": "2026-01-18",
    "currentPhase": { "id": 1, "name": "Foundation", "status": "active" },
    "phases": [...],
    "pendingTasks": [...],
    "completedTasks": [...],
    "stats": { "totalTasks": 10, "completedTasks": 3, "progressPercent": 30 },
    "lastSession": { "date": "2026-01-17", "agent": "Claude Opus 4.5", "handoffNote": "..." }
  },
  "timestamp": "2026-01-18T...",
  "version": "0.1.0"
}
```

### Step 3: Format for Human Display

Use the JSON data to create a readable summary:

```markdown
## PRP Status: [projectName]

### Bootstrap Snapshot
**Status:** [status] [emoji based on status]
**Branch:** [branch]
**Updated:** [lastUpdated]
**Progress:** [stats.progressPercent]% ([stats.completedTasks]/[stats.totalTasks] tasks)

### Current Phase
Phase [currentPhase.id] - [currentPhase.name]
Status: [currentPhase.status]

### Phases
| Phase | Status | Progress |
| :---- | :----- | :------- |
[for each phase in phases]

### Pending Tasks
[for each task in pendingTasks, limit 10]
○ [task.id]: [task.description]

### Last Session
Date: [lastSession.date]
Agent: [lastSession.agent]
Handoff: [lastSession.handoffNote, truncated]
```

### Subcommands

- `/prp phase` - Run `sloop status --json`, show only currentPhase section
- `/prp tasks` - Run `sloop status --json`, show only pendingTasks section
- `/prp tiers` - Run `sloop status --json`, show only phases table

### If CLI Not Available

If the CLI fails or isn't installed, fall back to reading PRP.md directly:
1. Read `PRP.md` from project root
2. Parse Section 0 (Seed Context) for bootstrap snapshot
3. Parse Section 5 for active phase and tasks
4. Read `PROGRESS.md` for last session
