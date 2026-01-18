# /handoff - Session Context Handoff

Generate session handoff note for the next agent.

## Usage

```
/handoff              # Generate handoff (interactive)
/handoff "notes"      # Include specific notes
```

## Instructions

**IMPORTANT: This command uses the CLI for deterministic data gathering.**

When the user runs `/handoff`, execute the Software Loop CLI to get handoff data, then help format it.

### Step 1: Run CLI Command

```bash
sloop handoff --json
```

Or with notes:
```bash
sloop handoff --json --message "Need to fix the parser bug"
```

Or if `sloop` is not in PATH:
```bash
npx software-loop handoff --json
# OR
node dist/cli.js handoff --json
```

### Step 2: Parse JSON Output

The CLI returns structured handoff data:
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-01-18T10:30:00Z",
    "branch": "feature/auto-context",
    "currentPhase": { "id": 1, "name": "Foundation", "status": "active" },
    "recentCommits": [
      { "hash": "abc1234", "message": "feat: add init command" },
      { "hash": "def5678", "message": "feat: add status command" }
    ],
    "uncommittedChanges": ["M src/cli.ts", "?? src/lib/parser.ts"],
    "completedThisSession": [...],
    "nextTasks": [
      { "id": "1.5", "description": "Build and test CLI", "completed": false, "phase": 1 },
      { "id": "1.6", "description": "Test sloop init", "completed": false, "phase": 1 }
    ],
    "risks": ["Parser may have edge cases"]
  }
}
```

### Step 3: Format Handoff Note

Generate a human-readable handoff:

```markdown
## Session Handoff: [timestamp date]

**Current Phase:** Phase [currentPhase.id] - [currentPhase.name]
**Agent:** [Ask user or use "Claude Opus 4.5"]
**Branch:** [branch]

### What was changed
[AI should help user list their changes based on recentCommits]

### Recent Commits
[for each commit in recentCommits]
- [hash]: [message]

### What's next
[for each task in nextTasks]
- [task.id]: [task.description]

### Known risks
[for each risk in risks]
- [risk]
[OR if uncommittedChanges]
- ⚠️ Uncommitted changes: [list files]

### Questions for next agent
- [Ask user if they have any]
```

### Step 4: AI Assistance

After getting CLI data, help the user by:
1. Summarizing what commits suggest was done
2. Highlighting uncommitted changes that need attention
3. Asking if they want to add any context the CLI didn't capture

### After Handoff

The CLI automatically appends the handoff to PROGRESS.md when run interactively.

If user ran with `--json`, you should:
1. Format the data as shown above
2. Offer to append it to PROGRESS.md

### If CLI Not Available

Fall back to manual handoff:
1. Read PRP.md Section 0 for current status
2. Read PRP.md Section 5 for pending tasks
3. Run `git status` for uncommitted changes
4. Run `git log --oneline -5` for recent commits
5. Read PROGRESS.md for previous session context
6. Generate handoff note using Section 7 template
