/**
 * Status Command
 *
 * Show PRP status, current phase, and pending tasks.
 * Supports --json for deterministic output.
 */

import { join } from "path";
import chalk from "chalk";
import {
  parsePRP,
  parseProgress,
  findPRPFile,
  findProgressFile,
  wrapOutput,
  wrapError,
  type PRPStatus,
  type CLIOutput,
} from "../lib/index.js";

interface StatusOptions {
  phase?: boolean;
  tasks?: boolean;
  tiers?: boolean;
  json?: boolean;
}

export async function statusCommand(options: StatusOptions): Promise<void> {
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

  // Parse PROGRESS.md for last session
  const progressPath = findProgressFile(prpPath);
  const lastSession = progressPath ? parseProgress(progressPath) : null;

  // JSON output mode
  if (options.json) {
    const output: CLIOutput<PRPStatus & { lastSession: typeof lastSession }> = wrapOutput({
      ...prpStatus,
      lastSession,
    });
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Human-readable output
  console.log(chalk.bold(`\n## PRP Status: ${prpStatus.projectName}\n`));

  // Full status (default)
  if (!options.phase && !options.tasks && !options.tiers) {
    // Bootstrap Snapshot
    console.log(chalk.bold("### Bootstrap Snapshot"));
    console.log(`${chalk.gray("Status:")} ${formatStatusBadge(prpStatus.status)}`);
    console.log(`${chalk.gray("Branch:")} ${prpStatus.branch}`);
    console.log(`${chalk.gray("Updated:")} ${prpStatus.lastUpdated}`);
    console.log(`${chalk.gray("Progress:")} ${prpStatus.stats.progressPercent}% (${prpStatus.stats.completedTasks}/${prpStatus.stats.totalTasks} tasks)\n`);
  }

  // Phase info
  if (options.phase || (!options.tasks && !options.tiers)) {
    console.log(chalk.bold("### Current Phase"));
    console.log(`Phase ${prpStatus.currentPhase.id} - ${prpStatus.currentPhase.name}`);
    console.log(`${chalk.gray("Status:")} ${formatStatusBadge(prpStatus.currentPhase.status)}\n`);
  }

  // Tiers/Components
  if (options.tiers || (!options.phase && !options.tasks)) {
    if (prpStatus.phases.length > 0) {
      console.log(chalk.bold("### Phases"));
      console.log("| Phase | Status | Progress |");
      console.log("| :---- | :----- | :------- |");
      prpStatus.phases.forEach((phase) => {
        const statusIcon = phase.status === "complete" ? "✅" : phase.status === "active" ? "🔄" : "📋";
        const progress = `${phase.tasksComplete}/${phase.tasksTotal}`;
        console.log(`| Phase ${phase.id} - ${phase.name} | ${statusIcon} ${phase.status} | ${progress} |`);
      });
      console.log();
    }
  }

  // Pending tasks
  if (options.tasks || (!options.phase && !options.tiers)) {
    console.log(chalk.bold("### Pending Tasks"));
    if (prpStatus.pendingTasks.length === 0) {
      console.log(chalk.gray("  No pending tasks.\n"));
    } else {
      prpStatus.pendingTasks.slice(0, 10).forEach((task) => {
        console.log(`  ${chalk.yellow("○")} ${task.id}: ${task.description}`);
      });
      if (prpStatus.pendingTasks.length > 10) {
        console.log(chalk.gray(`  ... and ${prpStatus.pendingTasks.length - 10} more`));
      }
      console.log();
    }
  }

  // Last session info
  if (lastSession && !options.phase && !options.tasks && !options.tiers) {
    console.log(chalk.bold("### Last Session"));
    console.log(`${chalk.gray("Date:")} ${lastSession.date}`);
    console.log(`${chalk.gray("Agent:")} ${lastSession.agent}`);
    if (lastSession.handoffNote) {
      console.log(`${chalk.gray("Handoff:")} ${truncate(lastSession.handoffNote, 100)}`);
    }
    console.log();
  }
}

function formatStatusBadge(status: string): string {
  switch (status) {
    case "complete":
      return chalk.green("✅ Complete");
    case "active":
      return chalk.blue("🔄 Active");
    case "planned":
      return chalk.gray("📋 Planned");
    case "paused":
      return chalk.yellow("⏸️ Paused");
    default:
      return status;
  }
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}
