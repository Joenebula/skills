#!/usr/bin/env node
/*
 * T1 probe. Logs what Claude Code sends a PreToolUse hook, then gets
 * out of the way. Blocks nothing, ever.
 *
 * Purpose: confirm two things before the real gate is written.
 *   1. That hooks run at all on this machine (managed settings can
 *      switch them off org-wide).
 *   2. The exact field name holding the file path on a Read call.
 *
 * Run it, read one large file in Claude Code, then look at the log:
 *   macOS/Linux  ~/.claude/shunt-probe.log
 *   Windows      %USERPROFILE%\.claude\shunt-probe.log
 *
 * Remove this hook once T1 passes.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const LOG = path.join(os.homedir(), ".claude", "shunt-probe.log");

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  try {
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    const entry = [
      "=== " + new Date().toISOString() + " ===",
      raw.trim(),
      "",
    ].join("\n");
    fs.appendFileSync(LOG, entry, "utf8");
  } catch (err) {
    // Never let the probe interfere with a session.
  }
  process.exit(0);
});

// If stdin never closes, don't hang the tool call.
setTimeout(() => process.exit(0), 5000).unref();
