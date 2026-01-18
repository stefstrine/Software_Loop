/**
 * PRP Parser
 *
 * Deterministic parser for PRP.md and PROGRESS.md files.
 * Returns structured data for CLI commands.
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import type {
  PRPStatus,
  PhaseInfo,
  PhaseStatus,
  TaskInfo,
  PRPStats,
} from "./types.js";

// =============================================================================
// Main Parser Functions
// =============================================================================

/**
 * Parse PRP.md and return structured status data.
 */
export function parsePRP(prpPath: string): PRPStatus | null {
  if (!existsSync(prpPath)) {
    return null;
  }

  const content = readFileSync(prpPath, "utf-8");

  const projectName = extractProjectName(content);
  const version = extractVersion(content);
  const status = extractStatus(content);
  const branch = extractBranch(content);
  const lastUpdated = extractLastUpdated(content);
  const phases = extractPhases(content);
  const tasks = extractAllTasks(content);
  const currentPhase = findCurrentPhase(phases);

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const stats: PRPStats = {
    totalPhases: phases.length,
    completedPhases: phases.filter((p) => p.status === "complete").length,
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    progressPercent:
      tasks.length > 0
        ? Math.round((completedTasks.length / tasks.length) * 100)
        : 0,
  };

  return {
    version,
    projectName,
    status,
    branch,
    lastUpdated,
    currentPhase,
    phases,
    pendingTasks,
    completedTasks,
    stats,
  };
}

/**
 * Parse PROGRESS.md and return last session info.
 */
export function parseProgress(progressPath: string): LastSessionInfo | null {
  if (!existsSync(progressPath)) {
    return null;
  }

  const content = readFileSync(progressPath, "utf-8");

  // Find the last session log
  const sessionRegex =
    /## Session Log: (\d{4}-\d{2}-\d{2})(?: \(Session (\d+)\))?/g;
  let lastMatch = null;
  let match;

  while ((match = sessionRegex.exec(content)) !== null) {
    lastMatch = match;
  }

  if (!lastMatch) {
    return null;
  }

  const sessionDate = lastMatch[1];
  const sessionNumber = lastMatch[2] ? parseInt(lastMatch[2]) : 1;

  // Extract agent
  const agentMatch = content.match(
    /\*\*Agent:\*\* (.+?)(?:\n|$)/
  );
  const agent = agentMatch ? agentMatch[1] : "Unknown";

  // Extract handoff note
  const handoffMatch = content.match(
    /\*To the next Agent: (.+?)\*/s
  );
  const handoffNote = handoffMatch ? handoffMatch[1].trim() : null;

  return {
    date: sessionDate,
    sessionNumber,
    agent,
    handoffNote,
  };
}

export interface LastSessionInfo {
  date: string;
  sessionNumber: number;
  agent: string;
  handoffNote: string | null;
}

// =============================================================================
// Extraction Helpers
// =============================================================================

function extractProjectName(content: string): string {
  const match = content.match(/^# PRP: (.+)$/m);
  return match ? match[1].trim() : "Unknown Project";
}

function extractVersion(content: string): string {
  const match = content.match(/\*\*Version:\*\* (.+?)(?:\n|$)/);
  return match ? match[1].trim() : "1.0";
}

function extractStatus(content: string): "active" | "paused" | "complete" {
  const match = content.match(/\*\*Status:\*\* (.+?)(?:\n|$)/);
  if (!match) return "active";

  const statusText = match[1].toLowerCase();
  if (statusText.includes("complete")) return "complete";
  if (statusText.includes("paused")) return "paused";
  return "active";
}

function extractBranch(content: string): string {
  const match = content.match(/\*\*Branch:\*\* (.+?)(?:\n|$)/);
  return match ? match[1].trim() : "main";
}

function extractLastUpdated(content: string): string {
  const match = content.match(/\*\*Last Updated:\*\* (.+?)(?:\n|$)/);
  return match ? match[1].trim() : new Date().toISOString().split("T")[0];
}

function extractPhases(content: string): PhaseStatus[] {
  const phases: PhaseStatus[] = [];

  // Look for phase table in Section 0
  const tableRegex =
    /\| Phase (\d+) - (.+?) \| (✅ Complete|🔄 Active|📋 Planned)/g;
  let match;

  while ((match = tableRegex.exec(content)) !== null) {
    const phaseId = parseInt(match[1]);
    const phaseName = match[2].trim();
    const statusEmoji = match[3];

    let status: "complete" | "active" | "planned";
    if (statusEmoji.includes("✅")) status = "complete";
    else if (statusEmoji.includes("🔄")) status = "active";
    else status = "planned";

    // Count tasks for this phase
    const { complete, total } = countPhaseTasks(content, phaseId);

    phases.push({
      id: phaseId,
      name: phaseName,
      status,
      tasksComplete: complete,
      tasksTotal: total,
    });
  }

  return phases;
}

function countPhaseTasks(
  content: string,
  phaseId: number
): { complete: number; total: number } {
  // Match tasks like "- [x] 1.1:" or "- [ ] 1.2:"
  const taskRegex = new RegExp(
    `^- \\[([ x])\\] ${phaseId}\\.(\\d+):`,
    "gm"
  );
  let complete = 0;
  let total = 0;
  let match;

  while ((match = taskRegex.exec(content)) !== null) {
    total++;
    if (match[1] === "x") complete++;
  }

  return { complete, total };
}

function extractAllTasks(content: string): TaskInfo[] {
  const tasks: TaskInfo[] = [];

  // Match tasks like "- [x] 1.1: Description" or "- [ ] 2.3: Description"
  const taskRegex = /^- \[([ x])\] (\d+)\.(\d+): (.+)$/gm;
  let match;

  while ((match = taskRegex.exec(content)) !== null) {
    const completed = match[1] === "x";
    const phase = parseInt(match[2]);
    const taskNum = match[3];
    const description = match[4].trim();

    // Check for commit hash in description
    const commitMatch = description.match(/\(commit: ([a-f0-9]+)\)/);
    const commitHash = commitMatch ? commitMatch[1] : undefined;

    // Clean description (remove commit reference)
    const cleanDescription = description
      .replace(/\(commit: [a-f0-9]+\)/, "")
      .trim();

    tasks.push({
      id: `${phase}.${taskNum}`,
      description: cleanDescription,
      completed,
      phase,
      commitHash,
    });
  }

  return tasks;
}

function findCurrentPhase(phases: PhaseStatus[]): PhaseInfo {
  // Find the active phase
  const active = phases.find((p) => p.status === "active");
  if (active) {
    return {
      id: active.id,
      name: active.name,
      status: active.status,
    };
  }

  // If no active, find first planned
  const planned = phases.find((p) => p.status === "planned");
  if (planned) {
    return {
      id: planned.id,
      name: planned.name,
      status: planned.status,
    };
  }

  // All complete
  const lastComplete = phases[phases.length - 1];
  if (lastComplete) {
    return {
      id: lastComplete.id,
      name: lastComplete.name,
      status: "complete",
    };
  }

  return {
    id: 0,
    name: "Planning",
    status: "active",
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Find PRP.md in current directory or parent directories.
 */
export function findPRPFile(startDir: string): string | null {
  let dir = startDir;

  while (true) {
    const prpPath = join(dir, "PRP.md");
    if (existsSync(prpPath)) {
      return prpPath;
    }

    const parent = dirname(dir);
    if (parent === dir) {
      // Reached root
      return null;
    }
    dir = parent;
  }
}

/**
 * Find PROGRESS.md relative to PRP.md location.
 */
export function findProgressFile(prpPath: string): string | null {
  const dir = dirname(prpPath);
  const progressPath = join(dir, "PROGRESS.md");
  return existsSync(progressPath) ? progressPath : null;
}
