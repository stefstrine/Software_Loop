/**
 * Checkpoint Command
 *
 * Verify phase completion and update progress.
 * Supports --json for deterministic output.
 */

import { existsSync, appendFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import chalk from "chalk";
import ora from "ora";
import {
  parsePRP,
  findPRPFile,
  findProgressFile,
  wrapOutput,
  wrapError,
  computeTaskConfidence,
  computePhaseConfidence,
  type CheckpointResult,
  type VerificationEntry,
  type BuildStatus,
} from "../lib/index.js";

interface CheckpointOptions {
  phase?: string;
  commit: boolean;
  json?: boolean;
}

export async function checkpointCommand(options: CheckpointOptions): Promise<void> {
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

  const spinner = options.json ? null : ora("Analyzing project state...").start();

  // Get git info
  const gitInfo = getGitInfo();

  // Get tasks for current/specified phase
  const targetPhaseId = options.phase
    ? parseInt(options.phase)
    : prpStatus.currentPhase.id;

  const phaseTasks = [
    ...prpStatus.pendingTasks.filter((t) => t.phase === targetPhaseId),
    ...prpStatus.completedTasks.filter((t) => t.phase === targetPhaseId),
  ];

  // Build verification matrix with deterministic confidence scoring
  const verificationMatrix: VerificationEntry[] = phaseTasks.map((task) => {
    const hasCommit = task.commitHash !== undefined ||
      gitInfo.commits.some((c) => c.message.toLowerCase().includes(task.id));

    const commitHash = task.commitHash ||
      gitInfo.commits.find((c) => c.message.toLowerCase().includes(task.id))?.hash || null;

    const confidence = computeTaskConfidence({
      completed: task.completed,
      hasCommit,
      hasTests: false, // TODO: detect test files
      testsPass: false,
      isPartial: !task.completed && hasCommit,
    });

    let status: "complete" | "partial" | "not_started";
    if (task.completed) {
      status = "complete";
    } else if (hasCommit) {
      status = "partial";
    } else {
      status = "not_started";
    }

    return {
      taskId: task.id,
      description: task.description,
      commitHash,
      status,
      confidence,
      reason: getConfidenceReason(status, hasCommit),
    };
  });

  // Attempt build
  const buildStatus = attemptBuild();

  // Calculate overall confidence
  const overallConfidence = computePhaseConfidence(verificationMatrix);

  // Determine if checkpoint passed
  const passed = verificationMatrix.every((v) => v.status === "complete") &&
    (buildStatus.passed || !buildStatus.attempted);

  spinner?.succeed("Analysis complete");

  // Build result
  const result: CheckpointResult = {
    timestamp: new Date().toISOString(),
    phase: {
      id: targetPhaseId,
      name: prpStatus.phases.find((p) => p.id === targetPhaseId)?.name || `Phase ${targetPhaseId}`,
      status: passed ? "complete" : "active",
    },
    verificationMatrix,
    buildStatus,
    overallConfidence,
    passed,
    summary: passed
      ? `Phase ${targetPhaseId} checkpoint passed with ${overallConfidence}% confidence`
      : `Phase ${targetPhaseId} has ${verificationMatrix.filter((v) => v.status !== "complete").length} incomplete tasks`,
  };

  // JSON output mode
  if (options.json) {
    console.log(JSON.stringify(wrapOutput(result), null, 2));
    return;
  }

  // Human-readable output
  console.log(chalk.bold(`\n### Checkpoint: Phase ${result.phase.id} - ${result.phase.name}\n`));

  // Verification matrix
  console.log(chalk.bold("Verification Matrix"));
  console.log("| Task | Status | Confidence | Commit |");
  console.log("| :--- | :----- | :--------- | :----- |");

  verificationMatrix.forEach((entry) => {
    const statusIcon = entry.status === "complete" ? "✅" : entry.status === "partial" ? "⚠️" : "❌";
    const commit = entry.commitHash ? entry.commitHash.slice(0, 7) : "-";
    console.log(`| ${entry.taskId} | ${statusIcon} ${entry.status} | ${entry.confidence}% | ${commit} |`);
  });

  console.log();

  // Build status
  console.log(chalk.bold("Build Status"));
  if (buildStatus.attempted) {
    const icon = buildStatus.passed ? chalk.green("✅") : chalk.red("❌");
    console.log(`${icon} ${buildStatus.command}: ${buildStatus.passed ? "Passed" : "Failed"}`);
    if (buildStatus.error) {
      console.log(chalk.gray(`   Error: ${buildStatus.error}`));
    }
  } else {
    console.log(chalk.gray("No build command detected"));
  }

  console.log();

  // Summary
  console.log(chalk.bold("Summary"));
  console.log(`Overall Confidence: ${overallConfidence}%`);
  if (passed) {
    console.log(chalk.green(`✅ ${result.summary}`));
  } else {
    console.log(chalk.yellow(`⚠️ ${result.summary}`));
  }

  console.log();

  // Append to PROGRESS.md
  const progressPath = findProgressFile(prpPath);
  if (progressPath) {
    const entry = generateProgressEntry(result);
    appendFileSync(progressPath, entry);
    console.log(chalk.gray("Checkpoint logged to PROGRESS.md\n"));
  }
}

function getGitInfo(): { commits: Array<{ hash: string; message: string }> } {
  try {
    const log = execSync("git log --oneline -10", { encoding: "utf-8" });
    const commits = log.trim().split("\n").map((line) => {
      const [hash, ...messageParts] = line.split(" ");
      return { hash, message: messageParts.join(" ") };
    });
    return { commits };
  } catch {
    return { commits: [] };
  }
}

function attemptBuild(): BuildStatus {
  // Detect build command
  const buildCommands = [
    { file: "package.json", cmd: "npm run build" },
    { file: "Cargo.toml", cmd: "cargo build" },
    { file: "go.mod", cmd: "go build ./..." },
    { file: "pyproject.toml", cmd: "python -m build" },
  ];

  for (const { file, cmd } of buildCommands) {
    if (existsSync(join(process.cwd(), file))) {
      try {
        execSync(cmd, { stdio: "pipe", encoding: "utf-8" });
        return { attempted: true, passed: true, command: cmd };
      } catch (err: any) {
        return {
          attempted: true,
          passed: false,
          command: cmd,
          error: err.message?.slice(0, 200) || "Build failed",
        };
      }
    }
  }

  return { attempted: false, passed: false };
}

function getConfidenceReason(status: string, hasCommit: boolean): string {
  if (status === "complete" && hasCommit) return "Task complete with commit";
  if (status === "complete" && !hasCommit) return "Marked complete, no commit found";
  if (status === "partial") return "WIP - commit exists but task not marked complete";
  return "Not started";
}

function generateProgressEntry(result: CheckpointResult): string {
  const date = new Date().toISOString().split("T")[0];
  const matrix = result.verificationMatrix
    .map((v) => `| Task ${v.taskId} | ${v.commitHash?.slice(0, 7) || "-"} | ${v.status === "complete" ? "✅" : v.status === "partial" ? "⚠️" : "❌"} ${v.status} | ${v.confidence}% |`)
    .join("\n");

  return `
---

## Checkpoint: ${date}

**Phase:** ${result.phase.id} - ${result.phase.name}
**Overall Confidence:** ${result.overallConfidence}%
**Build:** ${result.buildStatus.passed ? "✅ Passed" : result.buildStatus.attempted ? "❌ Failed" : "N/A"}

### Verification Matrix

| Task | Commit | Status | Confidence |
| :--- | :----- | :----- | :--------- |
${matrix}

**Summary:** ${result.summary}

`;
}
