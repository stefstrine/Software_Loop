# /prp - Project Requirements & Plan Status

Show current PRP status, active phase, and pending tasks using the Seed Context format.

## Usage

```
/prp              # Show full status with Seed Context bootstrap
/prp phase        # Show current phase details only
/prp tasks        # Show pending tasks only
/prp tiers        # Show architecture component status
```

## Instructions

When the user runs `/prp`, read and analyze the project's PRP.md (Seed Context) and PROGRESS.md files.

**Steps:**

1. Read `PRP.md` from the project root
2. Parse **Section 0 (Seed Context)** for bootstrap snapshot
3. Parse **Section 2** for architecture status
4. Parse **Section 5** for active phase and tasks
5. Read `PROGRESS.md` for latest session log
6. Display a summary

**Output Format:**

```
## PRP Status: [Project Name]

### Bootstrap Snapshot (Section 0)
**Status:** [Active/Paused/Complete]
**Branch:** [git branch]
**Last Updated:** [date]

### Current Phase (Section 5)
**Phase:** Phase N - [Name]
**Progress:** X/Y tasks complete

### Pending Tasks
- [ ] Task N.1: [Description]
- [ ] Task N.2: [Description]

### Last Session (from PROGRESS.md)
Agent: [Model]
Date: [Session date]
Handoff Note: [Excerpt from handoff note]
```
