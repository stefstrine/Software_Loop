/**
 * Status Command
 *
 * Show PRP status, current phase, and pending tasks.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import chalk from "chalk";

interface StatusOptions {
  phase?: boolean;
  tasks?: boolean;
  tiers?: boolean;
}

export async function statusCommand(options: StatusOptions): Promise<void> {
  const prpPath = join(process.cwd(), "PRP.md");
  const progressPath = join(process.cwd(), "PROGRESS.md");

  // Check if PRP.md exists
  if (!existsSync(prpPath)) {
    console.log(chalk.red("\n❌ No PRP.md found in current directory."));
    console.log(chalk.gray("Run 'software-loop init' to create a new project.\n"));
    process.exit(1);
  }

  const prpContent = readFileSync(prpPath, "utf-8");
  const progressContent = existsSync(progressPath)
    ? readFileSync(progressPath, "utf-8")
    : null;

  // Parse PRP
  const projectName = extractProjectName(prpContent);
  const status = extractStatus(prpContent);
  const currentPhase = extractCurrentPhase(prpContent);
  const pendingTasks = extractPendingTasks(prpContent);
  const lastSession = progressContent ? extractLastSession(progressContent) : null;

  // Display based on options
  console.log(chalk.bold(`\n## PRP Status: ${projectName}\n`));

  if (!options.phase && !options.tasks && !options.tiers) {
    // Full status
    console.log(chalk.bold("### Bootstrap Snapshot"));
    console.log(`${chalk.gray("Status:")} ${status}`);
    console.log(`${chalk.gray("Current Phase:")} ${currentPhase}\n`);
  }

  if (options.phase || (!options.tasks && !options.tiers)) {
    console.log(chalk.bold("### Current Phase"));
    console.log(`${currentPhase}\n`);
  }

  if (options.tasks || (!options.phase && !options.tiers)) {
    console.log(chalk.bold("### Pending Tasks"));
    if (pendingTasks.length === 0) {
      console.log(chalk.gray("  No pending tasks found.\n"));
    } else {
      pendingTasks.forEach((task) => {
        console.log(`  ${chalk.yellow("○")} ${task}`);
      });
      console.log();
    }
  }

  if (lastSession && !options.phase && !options.tasks && !options.tiers) {
    console.log(chalk.bold("### Last Session"));
    console.log(chalk.gray(lastSession));
    console.log();
  }
}

function extractProjectName(content: string): string {
  const match = content.match(/^# PRP: (.+)$/m);
  return match ? match[1] : "Unknown Project";
}

function extractStatus(content: string): string {
  const match = content.match(/\*\*Status:\*\* (.+)$/m);
  return match ? match[1] : "Unknown";
}

function extractCurrentPhase(content: string): string {
  // Look for the active phase in the status table
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
  return tasks.slice(0, 10); // Limit to 10 tasks
}

function extractLastSession(content: string): string {
  // Find the last session log
  const sessionMatch = content.match(/## Session Log: .+?\n\n\*\*Agent:\*\* (.+?)\n/);
  if (sessionMatch) {
    return `Agent: ${sessionMatch[1]}`;
  }
  return "No session logs found.";
}
