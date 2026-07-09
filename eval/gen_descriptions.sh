#!/bin/bash
# Extract name + description from every SKILL.md frontmatter, exactly as the
# skill router sees them. Handles both `description: one line` and folded
# `description: >` blocks.
set -e
cd "c:/Users/joene/OneDrive/Design2/Web/.claude"

for f in skills/*/SKILL.md; do
  awk '
    BEGIN { infm = 0; indesc = 0; name = ""; desc = "" }
    /^---[[:space:]]*$/ { infm++; if (infm == 2) exit; next }
    infm == 1 {
      if ($0 ~ /^name:[[:space:]]*/)        { sub(/^name:[[:space:]]*/, ""); name = $0; indesc = 0; next }
      if ($0 ~ /^description:[[:space:]]*/) { sub(/^description:[[:space:]]*/, ""); desc = $0; indesc = 1; next }
      if ($0 ~ /^[a-zA-Z_-]+:/)             { indesc = 0; next }
      if (indesc) { line = $0; gsub(/^[[:space:]]+|[[:space:]]+$/, "", line); desc = (desc == ">" || desc == "|" || desc == "") ? line : desc " " line }
    }
    END {
      gsub(/^[[:space:]]*[>|][[:space:]]*/, "", desc)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", desc)
      printf "- **%s**: %s\n", name, desc
    }
  ' "$f"
done
