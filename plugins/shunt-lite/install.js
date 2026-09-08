#!/usr/bin/env node
/*
 * Copies the files that have to live in your home directory, because a
 * plugin cannot ship them:
 *
 *   agents/Explore.md  — a plugin agent is namespaced and lowest
 *                        priority, so it cannot override the built-in
 *                        Explore. Only a user or project agent can.
 *
 * Run from the repo root:  node plugins/shunt-lite/install.js
 * Preview without writing: node plugins/shunt-lite/install.js --dry-run
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const DRY = process.argv.includes("--dry-run");
const HOME_CLAUDE = path.join(os.homedir(), ".claude");

const files = [
  {
    from: path.join(__dirname, "user-files", "agents", "Explore.md"),
    to: path.join(HOME_CLAUDE, "agents", "Explore.md"),
    label: "Explore subagent override (routes exploration to Haiku)",
  },
];

function backup(target) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = `${target}.backup-${stamp}`;
  fs.copyFileSync(target, dest);
  return dest;
}

let failed = false;

for (const file of files) {
  console.log(`\n${file.label}`);
  console.log(`  -> ${file.to}`);

  if (!fs.existsSync(file.from)) {
    console.log("  SKIPPED: source missing. Run this from the repo root.");
    failed = true;
    continue;
  }

  if (DRY) {
    console.log(
      fs.existsSync(file.to)
        ? "  would overwrite (existing file backed up first)"
        : "  would create"
    );
    continue;
  }

  try {
    fs.mkdirSync(path.dirname(file.to), { recursive: true });
    if (fs.existsSync(file.to)) {
      console.log(`  existing file backed up to ${backup(file.to)}`);
    }
    fs.copyFileSync(file.from, file.to);
    console.log("  installed");
  } catch (err) {
    console.log(`  FAILED: ${err.message}`);
    failed = true;
  }
}

console.log(
  DRY
    ? "\nDry run only. Nothing was written."
    : "\nRestart Claude Code to pick up the agent.\n" +
        "Check it worked: ask a question spanning several files, then run\n" +
        "/tasks while it works. The Explore row should name Haiku."
);

process.exit(failed ? 1 : 0);
