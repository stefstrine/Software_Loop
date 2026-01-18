#!/usr/bin/env node
/**
 * Software Loop CLI
 *
 * AI-assisted software development framework with phase-based execution
 * and multi-agent handoff.
 */

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { statusCommand } from "./commands/status.js";
import { checkpointCommand } from "./commands/checkpoint.js";
import { handoffCommand } from "./commands/handoff.js";

const program = new Command();

program
  .name("software-loop")
  .description("AI-assisted software development framework")
  .version("0.1.0");

// Initialize a new project with PRP structure
program
  .command("init")
  .description("Initialize a new project with PRP structure")
  .option("-n, --name <name>", "Project name")
  .option("-t, --template <template>", "Template to use (default, minimal)", "default")
  .option("--no-git", "Skip git initialization")
  .action(initCommand);

// Show project status (like /prp)
program
  .command("status")
  .alias("prp")
  .description("Show PRP status, current phase, and pending tasks")
  .option("-p, --phase", "Show current phase details only")
  .option("-t, --tasks", "Show pending tasks only")
  .option("--tiers", "Show architecture tiers status")
  .option("-j, --json", "Output as JSON (for slash command integration)")
  .action(statusCommand);

// Run checkpoint verification (like /checkpoint)
program
  .command("checkpoint")
  .description("Verify phase completion and update progress")
  .option("-p, --phase <phase>", "Verify specific phase")
  .option("--no-commit", "Skip creating checkpoint commit")
  .option("-j, --json", "Output as JSON (for slash command integration)")
  .action(checkpointCommand);

// Generate handoff note (like /handoff)
program
  .command("handoff")
  .description("Generate session handoff note for next agent")
  .option("-m, --message <message>", "Additional notes to include")
  .option("-j, --json", "Output as JSON (for slash command integration)")
  .action(handoffCommand);

// Parse and execute
program.parse();
