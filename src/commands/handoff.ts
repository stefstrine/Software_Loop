/**
 * Handoff Command
 *
 * Generate session handoff note for next agent.
 */

import { existsSync, readFileSync, appendFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import chalk from "chalk";
import inquirer from "inquirer";

interface HandoffOptions {
  message?: string;
}

export async function handoffCommand(options: HandoffOptions): Promise<void> {
  const prpPath = join(process.cwd(), "PRP.md");
  const progressPath = join(process.cwd(), "PROGRESS.md");

  // Check if PRP.md exists
  if (!existsSync(prpPath)) {
    console.log(chalk.red("\n❌ No PRP.md found in current directory."));
    console.log(chalk.gray("Run 'software-loop init' to create a new project.\n"));
    process.exit(1);
  }

  console.log(chalk.bold("\n📋 Generating Session Handoff...\n"));

  // Get git info
  let gitBranch = "unknown";
  let gitStatus = "";
  let gitLog = "";

  try {
    gitBranch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
    gitStatus = execSync("git status --short", { encoding: "utf-8" });
    gitLog = execSync("git log --oneline -5", { encoding: "utf-8" });
  } catch {
    console.log(chalk.yellow("⚠️  Git not available, some info will be missing.\n"));
  }

  // Check for uncommitted changes
  if (gitStatus.trim()) {
    console.log(chalk.yellow("⚠️  Uncommitted changes detected:"));
    console.log(chalk.gray(gitStatus));

    const { shouldCommit } = await inquirer.prompt([
      {
        type: "confirm",
        name: "shouldCommit",
        message: "Commit changes before handoff?",
        default: false,
      },
    ]);

    if (shouldCommit) {
      const { commitMessage } = await inquirer.prompt([
        {
          type: "input",
          name: "commitMessage",
          message: "Commit message:",
          default: "WIP: Session checkpoint",
        },
      ]);

      try {
        execSync(`git add . && git commit -m "${commitMessage}"`, { stdio: "pipe" });
        console.log(chalk.green("✅ Changes committed.\n"));
      } catch (err) {
        console.log(chalk.red("❌ Commit failed.\n"));
      }
    }
  }

  // Parse PRP for current phase
  const prpContent = readFileSync(prpPath, "utf-8");
  const currentPhase = extractCurrentPhase(prpContent);
  const pendingTasks = extractPendingTasks(prpContent);

  // Get additional notes
  let additionalNotes = options.message || "";
  if (!additionalNotes) {
    const { notes } = await inquirer.prompt([
      {
        type: "input",
        name: "notes",
        message: "Any additional notes for the next agent?",
        default: "",
      },
    ]);
    additionalNotes = notes;
  }

  // Generate handoff note
  const date = new Date().toISOString().split("T")[0];
  const time = new Date().toTimeString().split(" ")[0];

  const handoffNote = `
---

## Session Handoff: ${date} ${time}

**Current Phase:** ${currentPhase}
**Agent:** [TODO: Your model name]
**Branch:** ${gitBranch}

### What was changed
- [TODO: List your changes]

### Recent Commits
\`\`\`
${gitLog || "No commits"}
\`\`\`

### What's next
${pendingTasks.slice(0, 5).map((t) => `- ${t}`).join("\n") || "- [No pending tasks found]"}

### Known risks
- ${additionalNotes || "[None noted]"}

### Questions for next agent
- [None]

---
`;

  // Append to PROGRESS.md
  if (existsSync(progressPath)) {
    appendFileSync(progressPath, handoffNote);
    console.log(chalk.green("\n✅ Handoff note added to PROGRESS.md\n"));
  } else {
    console.log(chalk.bold("\n### Handoff Note\n"));
    console.log(handoffNote);
  }

  console.log(chalk.gray("Edit PROGRESS.md to complete the handoff details.\n"));
}

function extractCurrentPhase(content: string): string {
  const activeMatch = content.match(/\| Phase \d+ - .+? \| 🔄 Active/);
  if (activeMatch) {
    const phaseMatch = activeMatch[0].match(/Phase \d+ - .+?(?= \|)/);
    return phaseMatch ? phaseMatch[0] : "Unknown";
  }
  return "Phase 0 - Planning";
}

function extractPendingTasks(content: string): string[] {
  const tasks: string[] = [];
  const taskRegex = /^- \[ \] (.+)$/gm;
  let match;
  while ((match = taskRegex.exec(content)) !== null) {
    tasks.push(match[1]);
  }
  return tasks;
}
