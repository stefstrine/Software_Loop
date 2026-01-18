# /progress - Log Task Progress

Log completed work to PROGRESS.md with verification details.

## Usage

```
/progress                    # Interactive: ask what was completed
/progress "Task 1.1 done"    # Quick log with message
```

## Instructions

When the user runs `/progress`, update PROGRESS.md with the current session's work.

**Steps:**

1. Read `PRP.md` to understand the task structure
2. Run `git log --oneline -5` to see recent commits
3. Run `git diff --stat HEAD~1` to see what changed
4. Ask the user (if not provided) what task was completed
5. Append a progress entry to `PROGRESS.md`

**Entry Format to Append:**

```markdown
### Progress Update: [Timestamp]
**Task:** [Task ID from PRP]
**Commit:** [Git hash]
**Status:** [Complete/Partial]
**Confidence:** [100%/80%/60%/etc] - [Brief reason]

**Changes:**
- [File1]: [What changed]
- [File2]: [What changed]

**Notes:** [Any relevant context for next session]
```
