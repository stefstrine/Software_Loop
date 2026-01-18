/**
 * Shared Types for Software Loop
 *
 * These types define the JSON schema for CLI outputs.
 * Slash commands consume these for deterministic behavior.
 */

// =============================================================================
// PRP Document Types
// =============================================================================

export interface PRPStatus {
  version: string;
  projectName: string;
  status: "active" | "paused" | "complete";
  branch: string;
  lastUpdated: string;
  currentPhase: PhaseInfo;
  phases: PhaseStatus[];
  pendingTasks: TaskInfo[];
  completedTasks: TaskInfo[];
  stats: PRPStats;
}

export interface PhaseInfo {
  id: number;
  name: string;
  status: "complete" | "active" | "planned";
  objective?: string;
}

export interface PhaseStatus {
  id: number;
  name: string;
  status: "complete" | "active" | "planned";
  tasksComplete: number;
  tasksTotal: number;
}

export interface TaskInfo {
  id: string;           // e.g., "1.1", "2.3"
  description: string;
  completed: boolean;
  phase: number;
  commitHash?: string;
  confidence?: number;
}

export interface PRPStats {
  totalPhases: number;
  completedPhases: number;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
}

// =============================================================================
// Checkpoint Types
// =============================================================================

export interface CheckpointResult {
  timestamp: string;
  phase: PhaseInfo;
  verificationMatrix: VerificationEntry[];
  buildStatus: BuildStatus;
  overallConfidence: number;
  passed: boolean;
  summary: string;
}

export interface VerificationEntry {
  taskId: string;
  description: string;
  commitHash: string | null;
  status: "complete" | "partial" | "not_started";
  confidence: number;
  reason: string;
}

export interface BuildStatus {
  attempted: boolean;
  passed: boolean;
  command?: string;
  error?: string;
}

// =============================================================================
// Handoff Types
// =============================================================================

export interface HandoffData {
  timestamp: string;
  branch: string;
  currentPhase: PhaseInfo;
  recentCommits: CommitInfo[];
  uncommittedChanges: string[];
  completedThisSession: TaskInfo[];
  nextTasks: TaskInfo[];
  risks: string[];
}

export interface CommitInfo {
  hash: string;
  message: string;
  date?: string;
}

// =============================================================================
// Confidence Scoring Rules
// =============================================================================

/**
 * Deterministic confidence scoring based on observable facts.
 *
 * Rules:
 * - Task has commit + tests pass: 100%
 * - Task has commit, no tests: 90%
 * - Task marked complete, no commit found: 70%
 * - Task partially done (WIP commit): 50%
 * - Task not started: 0%
 */
export function computeTaskConfidence(task: {
  completed: boolean;
  hasCommit: boolean;
  hasTests: boolean;
  testsPass: boolean;
  isPartial: boolean;
}): number {
  if (!task.completed && !task.isPartial) return 0;

  if (task.isPartial) return 50;

  if (task.completed) {
    if (task.hasCommit && task.hasTests && task.testsPass) return 100;
    if (task.hasCommit && task.hasTests && !task.testsPass) return 60;
    if (task.hasCommit) return 90;
    return 70; // Marked complete but no commit found
  }

  return 0;
}

/**
 * Compute overall phase confidence from task confidences.
 */
export function computePhaseConfidence(tasks: VerificationEntry[]): number {
  if (tasks.length === 0) return 0;

  const total = tasks.reduce((sum, t) => sum + t.confidence, 0);
  return Math.round(total / tasks.length);
}

// =============================================================================
// CLI Output Wrapper
// =============================================================================

export interface CLIOutput<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  version: string;
}

export function wrapOutput<T>(data: T): CLIOutput<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  };
}

export function wrapError(error: string): CLIOutput<never> {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  };
}
