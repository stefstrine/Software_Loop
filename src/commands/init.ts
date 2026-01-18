/**
 * Init Command
 *
 * Initialize a new project with PRP structure.
 */

import { existsSync, mkdirSync, writeFileSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface InitOptions {
  name?: string;
  template: string;
  git: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  console.log(chalk.bold("\n🔄 Software Loop - Project Initialization\n"));

  // Get project name
  let projectName: string = options.name || "";
  if (!projectName) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "projectName",
        message: "Project name:",
        default: "my-project",
        validate: (input: string) => {
          if (!input.trim()) return "Project name is required";
          if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
            return "Project name can only contain letters, numbers, hyphens, and underscores";
          }
          return true;
        },
      },
    ]);
    projectName = answers.projectName as string;
  }

  const projectPath = join(process.cwd(), projectName);

  // Check if directory exists
  if (existsSync(projectPath)) {
    console.log(chalk.red(`\n❌ Directory "${projectName}" already exists.\n`));
    process.exit(1);
  }

  const spinner = ora("Creating project structure...").start();

  try {
    // Create directories
    mkdirSync(projectPath, { recursive: true });
    mkdirSync(join(projectPath, ".claude", "commands"), { recursive: true });
    mkdirSync(join(projectPath, "docs"), { recursive: true });
    mkdirSync(join(projectPath, "src"), { recursive: true });

    // Create PRP.md
    writeFileSync(
      join(projectPath, "PRP.md"),
      generatePRP(projectName)
    );

    // Create PROGRESS.md
    writeFileSync(
      join(projectPath, "PROGRESS.md"),
      generateProgress(projectName)
    );

    // Create workflow commands
    writeFileSync(
      join(projectPath, ".claude", "commands", "prp.md"),
      getPrpCommand()
    );
    writeFileSync(
      join(projectPath, ".claude", "commands", "progress.md"),
      getProgressCommand()
    );
    writeFileSync(
      join(projectPath, ".claude", "commands", "checkpoint.md"),
      getCheckpointCommand()
    );
    writeFileSync(
      join(projectPath, ".claude", "commands", "handoff.md"),
      getHandoffCommand()
    );

    // Create README
    writeFileSync(
      join(projectPath, "README.md"),
      generateReadme(projectName)
    );

    spinner.succeed("Project structure created");

    // Initialize git
    if (options.git) {
      const gitSpinner = ora("Initializing git repository...").start();
      try {
        execSync("git init", { cwd: projectPath, stdio: "pipe" });
        execSync("git add .", { cwd: projectPath, stdio: "pipe" });
        execSync('git commit -m "Initial commit: Software Loop project structure"', {
          cwd: projectPath,
          stdio: "pipe",
        });
        gitSpinner.succeed("Git repository initialized");
      } catch (err) {
        gitSpinner.warn("Git initialization skipped (git not available)");
      }
    }

    // Success message
    console.log(chalk.green("\n✅ Project initialized successfully!\n"));
    console.log(chalk.bold("Next steps:"));
    console.log(chalk.gray(`  1. cd ${projectName}`));
    console.log(chalk.gray("  2. Open PRP.md and fill in your project details"));
    console.log(chalk.gray("  3. Use /prp in Claude Code to see status"));
    console.log(chalk.gray("  4. Start building with phase-based execution\n"));

  } catch (err) {
    spinner.fail("Failed to create project");
    console.error(chalk.red(err));
    process.exit(1);
  }
}

function generatePRP(projectName: string): string {
  const date = new Date().toISOString().split("T")[0];
  return `# PRP: ${projectName}

**Version:** 1.0 (Seed Context Format)
**Status:** Active - Phase 0 (Planning)
**Branch:** main
**Last Updated:** ${date}

---

## 0. Seed Context (Bootstrap Snapshot)

### Project Summary
<!-- 3-5 sentences describing what this project does and its current state -->
[TODO: Describe your project here]

### Current Status
| Phase | Status | Notes |
|-------|--------|-------|
| Phase 0 - Planning | 🔄 Active | Define requirements and architecture |
| Phase 1 - Foundation | 📋 Planned | Core infrastructure |
| Phase 2 - Features | 📋 Planned | Main functionality |
| Phase 3 - Polish | 📋 Planned | Testing, docs, refinement |

### Repository Map
\`\`\`
${projectName}/
├── .claude/commands/    # Workflow slash commands
├── docs/                # Documentation
├── src/                 # Source code
├── PRP.md              # This file (Seed Context)
├── PROGRESS.md         # Session logs
└── README.md           # Project overview
\`\`\`

### Critical Constraints
<!-- List your project's hard rules and constraints -->
1. [TODO: Add constraint]
2. [TODO: Add constraint]

### Quickstart
\`\`\`bash
# [TODO: Add quickstart commands]
\`\`\`

---

## 1. North Star Goal (Long-term Vision)

> [TODO: Single paragraph describing the ultimate goal of this project]

---

## 2. Architecture Summary

<!-- Define your architecture tiers or components -->

| Component | Purpose | Status |
|-----------|---------|--------|
| [TODO] | [TODO] | 📋 Planned |

---

## 3. Core Interfaces (Stable Contracts)

<!-- Define your key interfaces, APIs, or contracts here -->

\`\`\`typescript
// [TODO: Add your interfaces]
\`\`\`

---

## 4. Component Roadmap (Detailed)

### Component 1: [Name]
**Goal:** [What "done" means]

**Artifacts:**
- [TODO]

**Dependencies:**
- [TODO]

**Verification:** [How to verify it works]

---

## 5. Phase Plan (Execution Roadmap)

### Phase 0: Planning (ACTIVE)
**Objective:** Define requirements, architecture, and constraints.

**Tasks:**
- [ ] 0.1: Define project scope and North Star goal
- [ ] 0.2: Design architecture and components
- [ ] 0.3: Identify critical constraints
- [ ] 0.4: Create initial task breakdown for Phase 1

**Deliverables:** Complete PRP.md

---

### Phase 1: Foundation
**Objective:** [TODO]

**Tasks:**
- [ ] 1.1: [TODO]
- [ ] 1.2: [TODO]

**Verification Matrix:**
| Task | Test Type | Pass Criteria |
|------|-----------|---------------|
| 1.1 | [Type] | [Criteria] |

---

## 6. Verification Strategy

### Deterministic Components
- **Unit tests** - [TODO]
- **Build verification** - [TODO]

### Quality Gates
- [TODO: Define your quality gates]

---

## 7. Handoff Protocol

### Template for Session Handoff
\`\`\`markdown
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
\`\`\`

---

## 8. External Reviews

<!-- Log any external model reviews or consultations here -->
`;
}

function generateProgress(projectName: string): string {
  const date = new Date().toISOString().split("T")[0];
  return `# PROGRESS.md - ${projectName}

## Project Overview
**PRP:** ${projectName}
**Branch:** main
**Started:** ${date}

---

## Session Log: ${date} (Session 1)

**Agent:** [Your AI model]
**Phase Attempted:** Phase 0 (Planning)

### Verification Matrix

| PRP Task ID | Git Commit Hash | Status | Confidence Score |
| :--- | :--- | :--- | :--- |
| Project Init | initial | ✅ Complete | 100% (Software Loop scaffold) |

### Context Handoff Note

*To the next Agent: Project initialized with Software Loop structure. Start by filling in PRP.md Section 0 (Seed Context) with project details, then proceed to define Phase 1 tasks.*

---

## Session Log Template (Copy for next session)

\`\`\`
## Session Log: [Date]

**Agent:** [Model name]
**Phase Attempted:** Phase N (Name)

### Verification Matrix

| PRP Task ID | Git Commit Hash | Status | Confidence Score |
| :--- | :--- | :--- | :--- |
| Task N.1 | xxxxxxx | ✅/⚠️/❌ | X% (reason) |

### Context Handoff Note

*To the next Agent: [What was done, what failed, what to do next]*
\`\`\`
`;
}

function generateReadme(projectName: string): string {
  return `# ${projectName}

> Built with [Software Loop](https://github.com/stefstrine/Software_Loop) - AI-assisted development framework

## Overview

[TODO: Describe your project]

## Getting Started

[TODO: Add getting started instructions]

## Development Workflow

This project uses the Software Loop framework for AI-assisted development:

- \`/prp\` - View project status and pending tasks
- \`/progress\` - Log completed work
- \`/checkpoint\` - Verify phase completion
- \`/handoff\` - Generate handoff note for next session

See [PRP.md](./PRP.md) for the full project plan.

## License

[TODO: Add license]
`;
}

function getPrpCommand(): string {
  return `# /prp - Project Requirements & Plan Status

Show current PRP status, active phase, and pending tasks using the Seed Context format.

## Usage

\`\`\`
/prp              # Show full status with Seed Context bootstrap
/prp phase        # Show current phase details only
/prp tasks        # Show pending tasks only
/prp tiers        # Show architecture component status
\`\`\`

## Instructions

When the user runs \`/prp\`, read and analyze the project's PRP.md (Seed Context) and PROGRESS.md files.

**Steps:**

1. Read \`PRP.md\` from the project root
2. Parse **Section 0 (Seed Context)** for bootstrap snapshot
3. Parse **Section 2** for architecture status
4. Parse **Section 5** for active phase and tasks
5. Read \`PROGRESS.md\` for latest session log
6. Display a summary

**Output Format:**

\`\`\`
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
\`\`\`
`;
}

function getProgressCommand(): string {
  return `# /progress - Log Task Progress

Log completed work to PROGRESS.md with verification details.

## Usage

\`\`\`
/progress                    # Interactive: ask what was completed
/progress "Task 1.1 done"    # Quick log with message
\`\`\`

## Instructions

When the user runs \`/progress\`, update PROGRESS.md with the current session's work.

**Steps:**

1. Read \`PRP.md\` to understand the task structure
2. Run \`git log --oneline -5\` to see recent commits
3. Run \`git diff --stat HEAD~1\` to see what changed
4. Ask the user (if not provided) what task was completed
5. Append a progress entry to \`PROGRESS.md\`

**Entry Format to Append:**

\`\`\`markdown
### Progress Update: [Timestamp]
**Task:** [Task ID from PRP]
**Commit:** [Git hash]
**Status:** [Complete/Partial]
**Confidence:** [100%/80%/60%/etc] - [Brief reason]

**Changes:**
- [File1]: [What changed]
- [File2]: [What changed]

**Notes:** [Any relevant context for next session]
\`\`\`
`;
}

function getCheckpointCommand(): string {
  return `# /checkpoint - Phase Completion Verification

Run verification for a completed phase and update PROGRESS.md with a verification matrix.

## Usage

\`\`\`
/checkpoint           # Verify current phase
/checkpoint phase 1   # Verify specific phase
\`\`\`

## Instructions

When the user runs \`/checkpoint\`, perform a full phase verification.

**Steps:**

1. **Read PRP.md** - Get all tasks for the current/specified phase
2. **Read git log** - Get commits since phase started
3. **Build verification matrix** - Match tasks to commits
4. **Run build** - Execute build command to verify code compiles
5. **Update PROGRESS.md** - Append session log with verification matrix
6. **Commit checkpoint** - Create a checkpoint commit if all tasks pass

**Verification Matrix Format:**

\`\`\`markdown
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
\`\`\`
`;
}

function getHandoffCommand(): string {
  return `# /handoff - Session Context Handoff

Generate a context handoff note for the next agent/session using the PRP Section 7 protocol.

## Usage

\`\`\`
/handoff              # Generate handoff note
/handoff "notes"      # Include specific notes in handoff
\`\`\`

## Instructions

When the user runs \`/handoff\`, create a handoff note following PRP Section 7 (Handoff Protocol).

**Steps:**

1. **Read PRP.md Section 0** - Get current status and phase
2. **Read PRP.md Section 5** - Get active phase tasks
3. **Read PROGRESS.md** - Get latest session context
4. **Read git status** - Check for uncommitted changes
5. **Read git log -5** - Get recent commits
6. **Generate handoff note** - Use Section 7 template
7. **Append to PROGRESS.md** - Save as session log entry

**Handoff Note Format (from PRP Section 7):**

\`\`\`markdown
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
\`\`\`
`;
}
