# /checkpoint - Phase Completion Verification

Verify phase completion with deterministic confidence scoring.

## Usage

```
/checkpoint           # Verify current phase
/checkpoint phase 1   # Verify specific phase
```

## Instructions

**IMPORTANT: This command uses the CLI for deterministic verification.**

When the user runs `/checkpoint`, execute the Software Loop CLI to get verification data, then format it.

### Step 1: Run CLI Command

```bash
sloop checkpoint --json
```

Or for a specific phase:
```bash
sloop checkpoint --phase 1 --json
```

Or if `sloop` is not in PATH:
```bash
npx software-loop checkpoint --json
# OR
node dist/cli.js checkpoint --json
```

### Step 2: Parse JSON Output

The CLI returns structured verification data:
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-01-18T...",
    "phase": { "id": 1, "name": "Foundation", "status": "active" },
    "verificationMatrix": [
      {
        "taskId": "1.1",
        "description": "Implement init command",
        "commitHash": "abc1234",
        "status": "complete",
        "confidence": 90,
        "reason": "Task complete with commit"
      },
      {
        "taskId": "1.2",
        "description": "Implement status command",
        "commitHash": null,
        "status": "not_started",
        "confidence": 0,
        "reason": "Not started"
      }
    ],
    "buildStatus": {
      "attempted": true,
      "passed": true,
      "command": "npm run build"
    },
    "overallConfidence": 45,
    "passed": false,
    "summary": "Phase 1 has 2 incomplete tasks"
  }
}
```

### Step 3: Format for Human Display

```markdown
### Checkpoint: Phase [phase.id] - [phase.name]

**Verification Matrix**
| Task | Status | Confidence | Commit |
| :--- | :----- | :--------- | :----- |
[for each entry in verificationMatrix]
| [taskId] | [status emoji] [status] | [confidence]% | [commitHash or "-"] |

**Build Status**
[buildStatus.command]: [passed ? "✅ Passed" : "❌ Failed"]

**Summary**
Overall Confidence: [overallConfidence]%
[passed ? "✅" : "⚠️"] [summary]
```

### Confidence Scoring Rules (Deterministic)

The CLI uses these rules to compute confidence:
- Task complete + has commit + tests pass: **100%**
- Task complete + has commit, no tests: **90%**
- Task marked complete, no commit found: **70%**
- Task partial (WIP commit exists): **50%**
- Task not started: **0%**

### After Checkpoint

The CLI automatically appends results to PROGRESS.md. Inform the user:
- If passed: "Checkpoint passed. Ready for next phase or PR."
- If failed: List incomplete tasks and suggest next steps.

### If CLI Not Available

Fall back to manual verification:
1. Read PRP.md for current phase tasks
2. Run `git log --oneline -10` for recent commits
3. Try `npm run build` (or equivalent) for build check
4. Compute confidence manually using the rules above
