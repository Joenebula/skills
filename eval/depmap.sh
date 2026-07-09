#!/bin/bash
# Dependency map for the skills library: inbound [[wiki-link]] references per skill.
# One pass over the pre-captured grep output. No recursive scans (OneDrive is slow).
set -e
ROOT="c:/Users/joene/OneDrive/Design2/Web/.claude"
SRC="$1"
cd "$ROOT"

ls -1 skills | grep -v '\.md$' > /tmp/skills.txt
wc -l skills/*/SKILL.md | grep -v ' total$' > /tmp/bodies.txt

sed 's|\\|/|g; s|\[\[||g; s|\]\]||g' "$SRC" \
| awk -F: '
    { file=$1; link=$2; owner=""
      if (file ~ /^skills\//) { split(file, p, "/"); owner = p[2] }
      if (link == "skill-name" || link == owner) next
      refs[link]++
      if (!((link SUBSEP file) in seen)) { seen[link, file] = 1; files[link]++ }
    }
    END { for (k in refs) printf "%s\t%d\t%d\n", k, refs[k], files[k] }
  ' > /tmp/inb.txt

printf 'REFS  FILES   BODY  SKILL\n'
printf -- '----  -----  -----  ------------------------\n'
awk '
  FILENAME ~ /skills\.txt$/ { name[$1] = 1; next }
  FILENAME ~ /bodies\.txt$/ { split($2, a, "/"); body[a[2]] = $1; next }
  FILENAME ~ /inb\.txt$/    { refs[$1] = $2; files[$1] = $3; next }
  END {
    for (n in name) printf "%4d  %5d  %5d  %s\n", refs[n]+0, files[n]+0, body[n]+0, n
  }' /tmp/skills.txt /tmp/bodies.txt /tmp/inb.txt | sort -rn
