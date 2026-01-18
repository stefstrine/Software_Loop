/**
 * Checkpoint Command
 *
 * Verify phase completion and update progress.
 */

import { existsSync, readFileSync, appendFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import chalk from "chalk";
import ora from "ora";

interface CheckpointOptions {
  phase?: string;
  commit: boolean;
}

export async function checkpointCommand(options: CheckpointOptions): Promise<void> {
  const prpPath = join(process.cwd(), "PRP.md");
  const progressPath = join(process.cwd(), "PROGRESS.md");

  // Check if PRP.md exists
  if (!existsSync(prpPath)) {
    console.log(chalk.red("\n❌ No PRP.md found in current directory."));
    console.log(chalk.gray("Run 'software-loop init' to create a new project.\n"));
    process.exit(1);
  }

  console.log(chalk.bold("\n🔍 Running Phase Checkpoint...\n"));

  const spinner = ora("Analyzing project state...").start();

  try {
    // Get git info
    let gitLog = "";
    let gitStatus = "";
    try {
      gitLog = execSync("git log --oneline -5", { encoding: "utf-8" });
      gitStatus = execSync("git status --short", { encoding: "utf-8" });
    } catch {
      gitLog = "Git not available";
      gitStatus = "";
    }

    spinner.succeed("Project state analyzed");

    // Parse PRP for current phase tasks
    const prpContent = readFileSync(prpPath, "utf-8");
    const tasks = extractPhaseTasks(prpContent, options.phase);

    console.log(chalk.bold("\n### Verification Matrix\n"));
    console.log("| Task | Status | Notes |");
    console.log("| :--- | :--- | :--- |");

    tasks.forEach((task) => {
      const status = task.completed ? chalk.green("✅ Complete") : chalk.yellow("⚠️ Pending");
      console.log(`| ${task.id} | ${status} | ${task.notes || "-"} |`);
    });

    console.log(chalk.bold("\n### Git Status\n"));
    console.log(chalk.gray("Recent commits:"));
    console.log(gitLog || "  No commits");

    if (gitStatus) {
      console.log(chalk.gray("\nUncommitted changes:"));
      console.log(gitStatus);
    }

    // Generate checkpoint entry
    const date = new Date().toISOString().split("T")[0];
    const checkpointEntry = `
---

## Checkpoint: ${date}

### Verification Matrix
${tasks.map((t) => `- [${t.completed ? "x" : " "}] ${t.id}: ${t.notes || "Pending"}`).join("\n")}

### Git Log
\`\`\`
${gitLog}
\`\`\`

`;

    if (existsSync(progressPath)) {
      appendFileSync(progressPath, checkpointEntry);
      console.log(chalk.green("\n✅ Checkpoint logged to PROGRESS.md\n"));
    }

  } catch (err) {
    spinner.fail("Checkpoint failed");
    console.error(chalk.red(err));
    process.exit(1);
  }
}

interface TaskInfo {
  id: string;
  completed: boolean;
  notes: string;
}

function extractPhaseTasks(content: string, phase?: string): TaskInfo[] {
  const tasks: TaskInfo[] = [];

  // Find task lines
  const taskRegex = /^- \[([ x])\] (\d+\.\d+): (.+)$/gm;
  let match;

  while ((match = taskRegex.exec(content)) !== null) {
    const taskId = match[2];
    const completed = match[1] === "x";
    const description = match[3];

    // Filter by phase if specified
    if (phase && !taskId.startsWith(phase + ".")) {
      continue;
    }

    tasks.push({
      id: `Task ${taskId}`,
      completed,
      notes: description,
    });
  }

  return tasks;
}
