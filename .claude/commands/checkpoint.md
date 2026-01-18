# /checkpoint - Phase Completion Verification

Run verification for a completed phase and update PROGRESS.md with a verification matrix.

## Usage

```
/checkpoint           # Verify current phase
/checkpoint phase 1   # Verify specific phase
```

## Instructions

When the user runs `/checkpoint`, perform a full phase verification.

**Steps:**

1. **Read PRP.md** - Get all tasks for the current/specified phase
2. **Read git log** - Get commits since phase started
3. **Build verification matrix** - Match tasks to commits
4. **Run build** - Execute build command to verify code compiles
5. **Update PROGRESS.md** - Append session log with verification matrix
6. **Commit checkpoint** - Create a checkpoint commit if all tasks pass

**Verification Matrix Format:**

```markdown
## Session Log: [Date]

**Agent:** [Current model]
**Phase Attempted:** Phase N ([Name])

### Verification Matrix

| PRP Task ID | Git Commit Hash | Status | Confidence Score |
| :--- | :--- | :--- | :--- |
| Task N.1 | a1b2c3d | ✅ Complete | 100% (Tests passed) |
| Task N.2 | e5f6g7h | ⚠️ Partial | 60% (Reason) |
| Task N.3 | - | ❌ Not Started | 0% |

### Build Verification
- Build: ✅ Passed / ❌ Failed
- Tests: ✅ Passed / ❌ Failed

### Context Handoff Note
*To the next Agent: [Summary of what was done, what issues remain, what to do next]*
```
