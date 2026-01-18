# /handoff - Session Context Handoff

Generate a context handoff note for the next agent/session using the PRP Section 7 protocol.

## Usage

```
/handoff              # Generate handoff note
/handoff "notes"      # Include specific notes in handoff
```

## Instructions

When the user runs `/handoff`, create a handoff note following PRP Section 7 (Handoff Protocol).

**Steps:**

1. **Read PRP.md Section 0** - Get current status and phase
2. **Read PRP.md Section 5** - Get active phase tasks
3. **Read PROGRESS.md** - Get latest session context
4. **Read git status** - Check for uncommitted changes
5. **Read git log -5** - Get recent commits
6. **Generate handoff note** - Use Section 7 template
7. **Append to PROGRESS.md** - Save as session log entry

**Handoff Note Format (from PRP Section 7):**

```markdown
## Session Handoff: [Date]

**Current Phase:** Phase N (Name)
**Agent:** [Model name]

### What was changed
- [Bullet list of changes]

### What's next
- [Bullet list of next tasks]

### Known risks
- [Any blockers or concerns]

### Questions for next agent
- [Clarifying questions if any]
```
