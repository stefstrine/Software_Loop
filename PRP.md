# PRP: Software Loop

**Version:** 1.0 (Seed Context Format)
**Status:** Active - Phase 1 (Foundation)
**Branch:** main
**Last Updated:** 2026-01-18

---

## 0. Seed Context (Bootstrap Snapshot)

### Project Summary
Software Loop is an AI-assisted software development framework that enables phase-based execution with multi-agent handoff. It provides a CLI tool (`software-loop` / `sloop`) and a set of slash commands that help developers manage complex projects with AI assistance.

The framework is based on the PRP (Project Requirements & Plan) Seed Context format, which provides a structured way for AI agents to understand project state, continue work across sessions, and verify progress.

### Current Status
| Phase | Status | Notes |
|-------|--------|-------|
| Phase 0 - Planning | ✅ Complete | Architecture defined, CLI scaffold created |
| Phase 1 - Foundation | 🔄 Active | CLI commands, core parsing |
| Phase 2 - Features | 📋 Planned | Advanced parsing, templates, validation |
| Phase 3 - Polish | 📋 Planned | Testing, docs, npm publish |

### Repository Map
```
Software_Loop/
├── .claude/commands/       # Workflow slash commands (for Claude Code)
│   ├── prp.md
│   ├── progress.md
│   ├── checkpoint.md
│   └── handoff.md
├── src/
│   ├── cli.ts             # Main CLI entry point
│   ├── commands/          # CLI command implementations
│   │   ├── init.ts        # Initialize new project
│   │   ├── status.ts      # Show PRP status
│   │   ├── checkpoint.ts  # Verify phase completion
│   │   └── handoff.ts     # Generate handoff note
│   └── lib/               # Shared utilities (TODO)
├── templates/             # Project templates (TODO)
├── docs/                  # Documentation (TODO)
├── PRP.md                 # This file (meta: PRP for Software Loop itself)
├── PROGRESS.md            # Session logs for Software Loop development
├── package.json           # npm package config
├── tsconfig.json          # TypeScript config
└── README.md              # Project overview
```

### Critical Constraints
1. **Node 18+** - Required for ES modules and modern features
2. **No runtime dependencies on AI** - CLI must work offline (AI integration via slash commands)
3. **PRP format stability** - Seed Context format is the contract; don't break it
4. **Cross-platform** - Must work on Linux, macOS, Windows
5. **Minimal dependencies** - Keep the CLI lightweight

### Quickstart
```bash
# Install globally
npm install -g software-loop

# Create a new project
software-loop init my-project

# Or use short alias
sloop init my-project

# Check project status
cd my-project
sloop status
```

---

## 1. North Star Goal (Long-term Vision)

> Enable developers to build software on "autopilot" by providing a structured framework where AI agents can understand project state, execute phases autonomously, verify their work, and hand off context cleanly to the next agent - creating a continuous development loop that dramatically accelerates software creation.

---

## 2. Architecture Summary

| Component | Purpose | Status |
|-----------|---------|--------|
| CLI (`sloop`) | Command-line interface for project management | 🔄 Scaffold |
| Slash Commands | Claude Code integration for AI workflow | ✅ Complete |
| PRP Parser | Parse and validate PRP.md documents | 📋 Planned |
| Template Engine | Generate project scaffolds | 🔄 Basic |
| Verification Engine | Validate phase completion | 📋 Planned |

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                        Developer                             │
│                           │                                  │
│              ┌────────────┼────────────┐                     │
│              ▼            ▼            ▼                     │
│         ┌────────┐  ┌──────────┐  ┌──────────┐              │
│         │  CLI   │  │  Claude  │  │  Other   │              │
│         │ sloop  │  │   Code   │  │   IDEs   │              │
│         └───┬────┘  └────┬─────┘  └────┬─────┘              │
│             │            │             │                     │
│             └────────────┼─────────────┘                     │
│                          ▼                                   │
│              ┌───────────────────────┐                       │
│              │     Software Loop     │                       │
│              │       Framework       │                       │
│              ├───────────────────────┤                       │
│              │ • PRP Parser          │                       │
│              │ • Template Engine     │                       │
│              │ • Verification Engine │                       │
│              │ • Handoff Generator   │                       │
│              └───────────┬───────────┘                       │
│                          ▼                                   │
│              ┌───────────────────────┐                       │
│              │      Project Files    │                       │
│              │ • PRP.md              │                       │
│              │ • PROGRESS.md         │                       │
│              │ • .claude/commands/   │                       │
│              └───────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Interfaces (Stable Contracts)

### PRP Document Structure
```typescript
interface PRPDocument {
  version: string;
  status: "active" | "paused" | "complete";
  branch: string;
  lastUpdated: string;

  seedContext: {
    projectSummary: string;
    currentStatus: PhaseStatus[];
    repositoryMap: string;
    criticalConstraints: string[];
    quickstart: string;
  };

  northStar: string;

  architecture: {
    components: ComponentInfo[];
    diagram?: string;
  };

  phases: Phase[];

  handoffProtocol: HandoffTemplate;
}

interface Phase {
  id: number;
  name: string;
  status: "complete" | "active" | "planned";
  objective: string;
  tasks: Task[];
  verificationMatrix?: VerificationEntry[];
  deliverables: string[];
}

interface Task {
  id: string;        // e.g., "1.1", "2.3"
  description: string;
  completed: boolean;
  commitHash?: string;
  confidence?: number;
}
```

### PROGRESS Document Structure
```typescript
interface ProgressDocument {
  projectName: string;
  branch: string;
  started: string;

  sessions: SessionLog[];
}

interface SessionLog {
  date: string;
  sessionNumber: number;
  agent: string;
  phaseAttempted: string;
  verificationMatrix: VerificationEntry[];
  keyDecisions?: string[];
  filesModified?: string[];
  handoffNote: string;
}

interface VerificationEntry {
  taskId: string;
  commitHash: string | null;
  status: "complete" | "partial" | "not_started";
  confidence: number;
  reason: string;
}
```

---

## 4. Component Roadmap (Detailed)

### Component 1: CLI (`sloop`)
**Goal:** Provide command-line interface for project management.

**Commands:**
- `sloop init <name>` - Initialize new project with PRP structure
- `sloop status` / `sloop prp` - Show project status
- `sloop checkpoint` - Verify phase completion
- `sloop handoff` - Generate handoff note

**Dependencies:** commander, chalk, inquirer, ora

**Verification:** CLI commands execute without errors, produce expected output

---

### Component 2: PRP Parser
**Goal:** Parse and validate PRP.md documents, extract structured data.

**Artifacts:**
- `src/lib/parser.ts` - Markdown parser for PRP format
- `src/lib/validator.ts` - Schema validation

**Dependencies:** None (use regex/string parsing to stay lightweight)

**Verification:** Parser correctly extracts all sections from valid PRP.md

---

### Component 3: Template Engine
**Goal:** Generate project scaffolds from templates.

**Artifacts:**
- `templates/default/` - Full PRP template
- `templates/minimal/` - Minimal template
- `src/lib/template.ts` - Template processor

**Dependencies:** None (simple string interpolation)

**Verification:** Generated projects have valid PRP structure

---

### Component 4: Verification Engine
**Goal:** Validate phase completion by matching tasks to git commits.

**Artifacts:**
- `src/lib/verify.ts` - Verification logic
- Integration with git log

**Dependencies:** child_process (git commands)

**Verification:** Correctly identifies complete vs incomplete tasks

---

## 5. Phase Plan (Execution Roadmap)

### Phase 0: Planning (COMPLETE)
**Objective:** Define architecture and create initial scaffold.

**Tasks:**
- [x] 0.1: Define project scope and North Star goal
- [x] 0.2: Design CLI command structure
- [x] 0.3: Create folder structure
- [x] 0.4: Create package.json and tsconfig.json
- [x] 0.5: Create CLI entry point (src/cli.ts)
- [x] 0.6: Create slash commands (.claude/commands/)

**Deliverables:** Project scaffold, this PRP.md

---

### Phase 1: Foundation (ACTIVE)
**Objective:** Complete CLI commands with basic functionality.

**Tasks:**
- [x] 1.1: Implement `init` command with template generation
- [x] 1.2: Implement `status` command with basic parsing
- [x] 1.3: Implement `checkpoint` command with git integration
- [x] 1.4: Implement `handoff` command with note generation
- [ ] 1.5: Build and test CLI locally (`npm run build`)
- [ ] 1.6: Test `sloop init` creates valid project
- [ ] 1.7: Test full workflow (init → status → checkpoint → handoff)
- [ ] 1.8: Fix any bugs found during testing

**Verification Matrix:**
| Task | Test Type | Pass Criteria |
|------|-----------|---------------|
| 1.1-1.4 | Manual | Commands run without errors |
| 1.5 | Build | TypeScript compiles |
| 1.6 | Integration | Generated project has valid structure |
| 1.7 | E2E | Full workflow completes |

**Deliverables:** Working CLI with all 4 commands

---

### Phase 2: Features
**Objective:** Add advanced parsing, templates, and validation.

**Tasks:**
- [ ] 2.1: Create PRP parser library (`src/lib/parser.ts`)
- [ ] 2.2: Create PRP validator (`src/lib/validator.ts`)
- [ ] 2.3: Add `minimal` template option
- [ ] 2.4: Improve status command with full PRP parsing
- [ ] 2.5: Add verification engine for checkpoint
- [ ] 2.6: Add `--json` output option for all commands

**Verification Matrix:**
| Task | Test Type | Pass Criteria |
|------|-----------|---------------|
| 2.1-2.2 | Unit | Parser extracts all sections |
| 2.3 | Integration | Minimal template creates valid project |
| 2.4-2.5 | Integration | Commands use parser correctly |

**Deliverables:** Robust parsing, multiple templates

---

### Phase 3: Polish
**Objective:** Testing, documentation, npm publish.

**Tasks:**
- [ ] 3.1: Write unit tests for parser
- [ ] 3.2: Write integration tests for CLI
- [ ] 3.3: Create docs/WORKFLOW.md guide
- [ ] 3.4: Create comprehensive README
- [ ] 3.5: Set up GitHub Actions CI
- [ ] 3.6: Publish to npm as `software-loop`
- [ ] 3.7: Create GitHub releases

**Verification Matrix:**
| Task | Test Type | Pass Criteria |
|------|-----------|---------------|
| 3.1-3.2 | Automated | Tests pass in CI |
| 3.3-3.4 | Manual | Docs are clear and complete |
| 3.6 | Integration | Package installs from npm |

**Deliverables:** Published npm package, documentation

---

## 6. Verification Strategy

### Build Verification
- `npm run build` - TypeScript compiles without errors
- `npm run lint` - No linting errors

### Manual Testing
- `sloop init test-project` - Creates valid project
- `cd test-project && sloop status` - Shows correct status
- `sloop checkpoint` - Generates verification matrix
- `sloop handoff` - Creates handoff note

### Integration Testing (Phase 3)
- Full workflow automation
- Cross-platform testing

---

## 7. Handoff Protocol

### Template for Session Handoff
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

### Current Handoff (Session 1)
**Current Phase:** Phase 1 (Foundation)
**Agent:** Claude Opus 4.5

**What was changed:**
- Created project structure at /workspaces/Software_Loop
- Implemented all 4 CLI commands (init, status, checkpoint, handoff)
- Created slash commands for Claude Code integration
- Created this PRP.md

**What's next:**
- Task 1.5: Build and test CLI locally
- Task 1.6: Test `sloop init` creates valid project
- Task 1.7: Test full workflow

**Known risks:**
- TypeScript may have compilation errors (not yet tested)
- Templates are embedded in code (consider externalizing)

**Questions for next agent:**
- Should we add a `sloop validate` command to validate PRP.md syntax?

---

## 8. External Reviews

### Origin
This framework was extracted from the Claude_GPT_MCP_V2 project's auto-context feature development, where the PRP Seed Context format proved effective for multi-session AI development.

### GPT-5.2-Codex Recommendations (from origin project)
- Seed Context format with bootstrap snapshot
- Verification matrices for phase completion
- Separate strategies for deterministic vs probabilistic verification
- Handoff protocol for session continuity
