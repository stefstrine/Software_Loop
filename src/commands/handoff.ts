/**
 * Handoff Command
 *
 * Generate session handoff note for next agent.
 * Supports --json for deterministic output.
 */

import { existsSync, appendFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import chalk from "chalk";
import inquirer from "inquirer";
import {
  parsePRP,
  findPRPFile,
  findProgressFile,
  wrapOutput,
  wrapError,
  type HandoffData,
  type CommitInfo,
} from "../lib/index.js";

interface HandoffOptions {
  message?: string;
  json?: boolean;
}

export async function handoffCommand(options: HandoffOptions): Promise<void> {
  const prpPath = findPRPFile(process.cwd()) || join(process.cwd(), "PRP.md");

  // Parse PRP
  const prpStatus = parsePRP(prpPath);

  if (!prpStatus) {
    if (options.json) {
      console.log(JSON.stringify(wrapError("No PRP.md found in current directory"), null, 2));
    } else {
      console.log(chalk.red("\n❌ No PRP.md found in current directory."));
      console.log(chalk.gray("Run 'software-loop init' to create a new project.\n"));
    }
    process.exit(1);
  }

  // Get git info
  const gitInfo = getGitInfo();

  // Build handoff data
  const handoffData: HandoffData = {
    timestamp: new Date().toISOString(),
    branch: gitInfo.branch,
    currentPhase: prpStatus.currentPhase,
    recentCommits: gitInfo.commits,
    uncommittedChanges: gitInfo.uncommittedChanges,
    completedThisSession: prpStatus.completedTasks.slice(0, 5), // Last 5 completed
    nextTasks: prpStatus.pendingTasks.slice(0, 5), // Next 5 pending
    risks: [],
  };

  // JSON output mode - no prompts
  if (options.json) {
    if (options.message) {
      handoffData.risks.push(options.message);
    }
    console.log(JSON.stringify(wrapOutput(handoffData), null, 2));
    return;
  }

  // Interactive mode
  console.log(chalk.bold("\n📋 Generating Session Handoff...\n"));

  // Check for uncommitted changes
  if (handoffData.uncommittedChanges.length > 0) {
    console.log(chalk.yellow("⚠️  Uncommitted changes detected:"));
    handoffData.uncommittedChanges.forEach((file) => {
      console.log(chalk.gray(`   ${file}`));
    });
    console.log();

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
        // Refresh git info
        const newGitInfo = getGitInfo();
        handoffData.recentCommits = newGitInfo.commits;
        handoffData.uncommittedChanges = [];
      } catch {
        console.log(chalk.red("❌ Commit failed.\n"));
      }
    }
  }

  // Get additional notes
  let additionalNotes = options.message || "";
  if (!additionalNotes) {
    const { notes } = await inquirer.prompt([
      {
        type: "input",
        name: "notes",
        message: "Any risks or notes for the next agent?",
        default: "",
      },
    ]);
    additionalNotes = notes;
  }

  if (additionalNotes) {
    handoffData.risks.push(additionalNotes);
  }

  // Display handoff
  console.log(chalk.bold("\n### Session Handoff\n"));
  console.log(`${chalk.gray("Timestamp:")} ${handoffData.timestamp}`);
  console.log(`${chalk.gray("Branch:")} ${handoffData.branch}`);
  console.log(`${chalk.gray("Phase:")} ${handoffData.currentPhase.id} - ${handoffData.currentPhase.name}\n`);

  if (handoffData.recentCommits.length > 0) {
    console.log(chalk.bold("Recent Commits"));
    handoffData.recentCommits.slice(0, 5).forEach((c) => {
      console.log(`  ${chalk.gray(c.hash.slice(0, 7))} ${c.message}`);
    });
    console.log();
  }

  if (handoffData.nextTasks.length > 0) {
    console.log(chalk.bold("Next Tasks"));
    handoffData.nextTasks.forEach((t) => {
      console.log(`  ${chalk.yellow("○")} ${t.id}: ${t.description}`);
    });
    console.log();
  }

  if (handoffData.risks.length > 0) {
    console.log(chalk.bold("Risks/Notes"));
    handoffData.risks.forEach((r) => {
      console.log(`  ${chalk.yellow("⚠")} ${r}`);
    });
    console.log();
  }

  // Append to PROGRESS.md
  const progressPath = findProgressFile(prpPath);
  if (progressPath) {
    const entry = generateHandoffEntry(handoffData);
    appendFileSync(progressPath, entry);
    console.log(chalk.green("✅ Handoff logged to PROGRESS.md\n"));
  }

  console.log(chalk.gray("Edit PROGRESS.md to add details about what was changed.\n"));
}

interface GitInfo {
  branch: string;
  commits: CommitInfo[];
  uncommittedChanges: string[];
}

function getGitInfo(): GitInfo {
  let branch = "unknown";
  let commits: CommitInfo[] = [];
  let uncommittedChanges: string[] = [];

  try {
    branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
  } catch {
    // ignore
  }

  try {
    const log = execSync("git log --oneline -5", { encoding: "utf-8" });
    commits = log.trim().split("\n").filter(Boolean).map((line) => {
      const [hash, ...messageParts] = line.split(" ");
      return { hash, message: messageParts.join(" ") };
    });
  } catch {
    // ignore
  }

  try {
    const status = execSync("git status --short", { encoding: "utf-8" });
    uncommittedChanges = status.trim().split("\n").filter(Boolean);
  } catch {
    // ignore
  }

  return { branch, commits, uncommittedChanges };
}

function generateHandoffEntry(data: HandoffData): string {
  const date = new Date().toISOString().split("T")[0];
  const time = new Date().toTimeString().split(" ")[0];

  const commits = data.recentCommits
    .slice(0, 5)
    .map((c) => `- ${c.hash.slice(0, 7)}: ${c.message}`)
    .join("\n") || "- No recent commits";

  const nextTasks = data.nextTasks
    .map((t) => `- ${t.id}: ${t.description}`)
    .join("\n") || "- No pending tasks";

  const risks = data.risks.length > 0
    ? data.risks.map((r) => `- ${r}`).join("\n")
    : "- None noted";

  return `
---

## Session Handoff: ${date} ${time}

**Current Phase:** Phase ${data.currentPhase.id} - ${data.currentPhase.name}
**Agent:** [TODO: Your model name]
**Branch:** ${data.branch}

### What was changed
[TODO: List your changes]

### Recent Commits
${commits}

### What's next
${nextTasks}

### Known risks
${risks}

### Questions for next agent
- [None]

`;
}
