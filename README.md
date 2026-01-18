# Software Loop

AI-assisted software development framework with phase-based execution and multi-agent handoff.

## Overview

Software Loop provides a structured approach to building software with AI assistance. It's based on the **PRP (Project Requirements & Plan) Seed Context** format, which enables:

- **Phase-based execution** - Break work into verifiable phases
- **Multi-agent handoff** - Seamlessly continue work across AI sessions
- **Verification matrices** - Track progress with confidence scores
- **Session continuity** - Never lose context between sessions

## Installation

```bash
npm install -g software-loop
```

## Quick Start

```bash
# Create a new project
software-loop init my-project
# or use the short alias
sloop init my-project

# Navigate to project
cd my-project

# Check project status
sloop status

# After completing work, run checkpoint
sloop checkpoint

# Before ending a session, create handoff
sloop handoff
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `sloop init <name>` | Initialize a new project with PRP structure |
| `sloop status` | Show PRP status, current phase, pending tasks |
| `sloop checkpoint` | Verify phase completion, update progress |
| `sloop handoff` | Generate session handoff note |

## Project Structure

When you run `sloop init`, it creates:

```
my-project/
├── .claude/commands/    # Workflow slash commands
│   ├── prp.md          # /prp - Show project status
│   ├── progress.md     # /progress - Log task completion
│   ├── checkpoint.md   # /checkpoint - Verify phase
│   └── handoff.md      # /handoff - Session handoff
├── docs/               # Documentation
├── src/                # Source code
├── PRP.md              # Project Requirements & Plan
├── PROGRESS.md         # Session logs
└── README.md           # Project overview
```

## PRP Seed Context Format

The PRP.md file is the heart of Software Loop. It contains:

1. **Seed Context (Section 0)** - Bootstrap snapshot for AI agents
2. **North Star Goal** - Long-term vision
3. **Architecture Summary** - System components and status
4. **Phase Plan** - Execution roadmap with tasks
5. **Verification Strategy** - How to verify completion
6. **Handoff Protocol** - Session continuity format

## Workflow

### Starting a Session

1. Run `/prp` in Claude Code to see current status
2. Review the handoff note from the previous session
3. Pick up the next pending task

### During Development

1. Work on tasks from the current phase
2. Commit changes with meaningful messages
3. Run `/progress` to log completed tasks

### Ending a Session

1. Run `/checkpoint` to verify phase completion
2. Run `/handoff` to generate context for the next session
3. Commit the updated PROGRESS.md

## Integration with Claude Code

Software Loop includes slash commands for Claude Code:

- `/prp` - View project status and pending tasks
- `/progress` - Log completed work
- `/checkpoint` - Verify phase completion
- `/handoff` - Generate handoff note

These commands teach Claude Code how to work with your PRP structure.

## Philosophy

Software Loop is built on the principle that **AI agents work better with structure**. By providing:

- Clear project context (Seed Context)
- Defined phases and tasks
- Verification mechanisms
- Handoff protocols

...we enable AI to work more autonomously and produce higher quality results.

## License

MIT
