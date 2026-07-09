#!/bin/bash
# Library integrity check. RUN THIS BEFORE EVERY COMMIT.
#
# Written after `git add -A` silently committed the deletion of
# skills/ask-dont-guess/SKILL.md — 130 lines, 54 inbound wiki-links — because
# the file had vanished from disk and nobody looked at `git status` first.
#
#   bash eval/check-integrity.sh          # check working tree
#   bash eval/check-integrity.sh <ref>    # also diff skill set against a git ref
#
# Exits non-zero on any failure.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 2
FAIL=0

say()  { printf '%s\n' "$*"; }
bad()  { printf '  FAIL  %s\n' "$*"; FAIL=1; }
ok()   { printf '  ok    %s\n' "$*"; }

say "== skills present =="
mapfile -t SKILLS < <(for d in skills/*/; do [ -f "$d/SKILL.md" ] && basename "$d"; done | sort)
say "  ${#SKILLS[@]} skills"

say ""
say "== empty skill dirs (no SKILL.md) =="
found_empty=0
for d in skills/*/; do
  [ -f "$d/SKILL.md" ] && continue
  case "$(basename "$d")" in references) continue;; esac
  bad "$d has no SKILL.md"; found_empty=1
done
[ "$found_empty" = 0 ] && ok "none"

say ""
say "== every [[wiki-link]] resolves =="
dead=0
grep -rhoE '\[\[[a-z-]+\]\]' --include='*.md' skills agents CLAUDE.md 2>/dev/null \
| sed 's/\[\[//; s/\]\]//' | sort -u | while read -r n; do
    [ "$n" = "skill-name" ] && continue
    [ -f "skills/$n/SKILL.md" ] && continue
    [ -f "agents/$n.md" ] && continue
    printf '  FAIL  dead link [[%s]]\n' "$n"
    printf 'x' >> /tmp/.deadlinks
done
if [ -s /tmp/.deadlinks ]; then FAIL=1; rm -f /tmp/.deadlinks; else ok "all resolve"; fi

say ""
say "== every frontmatter name matches its directory =="
mism=0
for d in skills/*/; do
  [ -f "$d/SKILL.md" ] || continue
  dir=$(basename "$d")
  nm=$(awk '/^---$/{c++; next} c==1 && /^name:/ {sub(/^name:[[:space:]]*/,""); print; exit}' "$d/SKILL.md")
  [ "$nm" = "$dir" ] || { bad "$d frontmatter name '$nm' != dir '$dir'"; mism=1; }
done
[ "$mism" = 0 ] && ok "all match"

say ""
say "== markdown links in README resolve =="
mdbad=0
grep -oE '\]\([a-z-]+/SKILL\.md\)' skills/README.md 2>/dev/null | sed 's/](//; s/)//' | sort -u | while read -r p; do
  [ -f "skills/$p" ] || { printf '  FAIL  README links missing skills/%s\n' "$p"; printf 'x' >> /tmp/.deadmd; }
done
if [ -s /tmp/.deadmd ]; then FAIL=1; rm -f /tmp/.deadmd; else ok "all resolve"; fi

if [ $# -ge 1 ]; then
  REF="$1"
  say ""
  say "== skill set vs $REF =="
  git ls-tree -r --name-only "$REF" 2>/dev/null | grep -E '^skills/[^/]+/SKILL\.md$' | cut -d/ -f2 | sort > /tmp/.was
  printf '%s\n' "${SKILLS[@]}" > /tmp/.now
  gone=$(comm -23 /tmp/.was /tmp/.now)
  new=$(comm -13 /tmp/.was /tmp/.now)
  [ -n "$gone" ] && printf '  REMOVED since %s:\n%s\n' "$REF" "$(printf '%s\n' "$gone" | sed 's/^/    - /')"
  [ -n "$new" ]  && printf '  ADDED since %s:\n%s\n'   "$REF" "$(printf '%s\n' "$new"  | sed 's/^/    + /')"
  [ -z "$gone$new" ] && ok "identical"
  say "  ^ confirm every REMOVED line was intentional before committing."
  rm -f /tmp/.was /tmp/.now
fi

say ""
say "== staged deletions (git) =="
del=$(git diff --cached --name-only --diff-filter=D)
if [ -n "$del" ]; then
  printf '%s\n' "$del" | sed 's/^/  STAGED DELETE: /'
  say "  ^ every one of these must be deliberate. If you did not mean to delete it, STOP."
else
  ok "none staged"
fi

say ""
[ "$FAIL" = 0 ] && say "INTEGRITY OK" || say "INTEGRITY FAILED"
exit $FAIL
