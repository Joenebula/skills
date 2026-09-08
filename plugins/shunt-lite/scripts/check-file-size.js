#!/usr/bin/env node
/*
 * Size gate for Claude Code.
 *
 * Fires on PreToolUse / Read. If the target file is longer than the
 * threshold, blocks the read and tells Claude to delegate to the
 * Explore subagent instead, which runs on Haiku.
 *
 * Design rule: fail open. Any uncertainty, any error, any unexpected
 * input shape — exit 0 and let the read through. A gate that
 * misfires is worse than a gate that misses.
 *
 * Environment:
 *   SHUNT_GATE       "1" turns the gate on. Anything else, off.
 *   SHUNT_MIN_LINES  Line threshold. Default 350.
 */

const fs = require("fs");

const DEFAULT_MIN_LINES = 350;

// Files above this are never counted line by line — reading them to
// measure them would cost more than the gate saves.
const MAX_BYTES_TO_SCAN = 20 * 1024 * 1024;

function allow() {
  process.exit(0);
}

function block(reason) {
  process.stderr.write(reason);
  process.exit(2);
}

function threshold() {
  const raw = parseInt(process.env.SHUNT_MIN_LINES, 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MIN_LINES;
}

/*
 * The docs don't pin the field name for Read's target, so check the
 * plausible ones rather than assuming. T1 tells us which is real; the
 * rest can be deleted afterwards.
 */
function targetPath(toolInput) {
  const candidates = ["file_path", "filePath", "path", "file"];
  for (const key of candidates) {
    const value = toolInput[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

function isTargetedRead(toolInput) {
  return toolInput.offset != null || toolInput.limit != null;
}

function looksBinary(buffer) {
  const window = buffer.subarray(0, Math.min(buffer.length, 8192));
  return window.includes(0);
}

function countLines(buffer) {
  let lines = 1;
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === 0x0a) lines++;
  }
  return lines;
}

function main(raw) {
  // Gate off unless explicitly switched on.
  if (process.env.SHUNT_GATE !== "1") return allow();

  let input;
  try {
    input = JSON.parse(raw);
  } catch (err) {
    return allow();
  }

  // Critical: hooks also fire inside subagents. Without this, the gate
  // blocks the Explore agent's own reads and it is told to delegate to
  // itself. agent_id is present only inside a subagent.
  if (input.agent_id) return allow();

  if (input.tool_name && input.tool_name !== "Read") return allow();

  const toolInput = input.tool_input || {};

  // A read with offset/limit already knows what it wants. Delegating
  // it would cost latency for no saving, and edits depend on it.
  if (isTargetedRead(toolInput)) return allow();

  const filePath = targetPath(toolInput);
  if (!filePath) return allow();

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch (err) {
    return allow();
  }

  if (!stat.isFile()) return allow();
  if (stat.size > MAX_BYTES_TO_SCAN) return allow();

  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch (err) {
    return allow();
  }

  if (looksBinary(buffer)) return allow();

  const lines = countLines(buffer);
  const limit = threshold();
  if (lines <= limit) return allow();

  return block(
    `Blocked: ${filePath} is ${lines} lines, over the ${limit}-line delegation threshold.\n\n` +
      `Do not read this file directly. Instead:\n` +
      `  - Delegate to the Explore subagent, which reads it on a cheaper model and returns a summary. Send it the file paths and the specific question.\n` +
      `  - Or, if you already know which part you need, re-read with offset and limit. Targeted reads are not blocked.\n\n` +
      `If you need exact text in order to edit this file, use a targeted read — a summary cannot be edited from.`
  );
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  try {
    main(raw);
  } catch (err) {
    allow();
  }
});

// Never hang a tool call waiting on stdin.
setTimeout(() => allow(), 5000).unref();
