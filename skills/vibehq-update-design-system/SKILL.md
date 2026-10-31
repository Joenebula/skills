---
name: vibehq-update-design-system
description: >
  Vibe HQ only. Bring every copy of the design system up to date with the code on develop:
  the trace file, missing stories, the Storybook build and the Paper file (tokens and
  components). Use when Joe says "update the design system", "sync the design system",
  "redraw Paper", "Paper is out of date", or after a change to CSS, tokens or components
  on the Vibe HQ site. Do NOT use for other projects, or to design or change a component —
  this copies what the code already says; it never changes how anything looks.
---

# Update the Vibe HQ design system

The code is the design system. Every other copy is drawn from it, and each copy goes stale
in its own way:

| Copy | How it updates | This skill |
|---|---|---|
| Storybook — https://vibehq-storybook.vercel.app | Vercel rebuilds on every merge to `develop` | checks it, never builds it online |
| Signal map — https://vibehq-storybook.vercel.app/signal-map.html | built with Storybook, same merge | checks it |
| `docs/design-trace.json` | **by hand**: `npm run design-trace`, committed. CI fails at `check:design-trace` if stale | steps 2–3 |
| Stories | **by hand**: a part with no `*.stories.tsx` is not in Storybook and not checked by axe | step 4 |
| Paper file `01M66S7CTE9FS4F5FK8P12N3QD` | **by hand**: two scripts, on Joe's PC, with Paper open | steps 5–7 |

Figma is not a copy (D-112). Do not offer a Figma sync.

## Stop and ask

- **Paper is not open** or the MCP call fails → stop at step 5 and ask Joe to open Paper.
  Do not retry in a loop: each call counts against Paper's limit.
- **The trace changed** → it goes in a PR. Joe merges. Never push to `develop`.
- **A part has no story** → list them and offer to write them. Writing stories is a code
  change with its own PR; do not fold it in silently.
- **A redraw looks wrong** in the screenshot → report it with the screenshot. Do not
  "fix" it by hand in Paper: the next redraw would undo it. Fix the script instead, in a PR.

## Steps

Work in a fresh worktree from `origin/develop`, never in Joe's checkout:

```bash
cd C:/Users/joene/OneDrive/Design2/Web/vibehq
git fetch -q origin develop
git worktree add -q --detach .local/wt-ds origin/develop
```

Link or install `node_modules` there (a junction to another worktree's `node_modules` is
fine if `package-lock.json` matches; otherwise `npm ci`). If `.local/wt-ds` already exists,
remove it first with `git worktree remove --force`. OneDrive can lock a folder ("Permission
denied"): use a new name rather than fighting it.

1. **Note the commit.** `git rev-parse --short HEAD`. Every number below is about this commit.

2. **Trace.** `npm run design-trace`. It prints tokens, parts and parts on a page.

3. **Did the trace change?** `git status --short docs/design-trace.json`.
   - No change → say so and go on.
   - Changed → branch `ds/trace-<date>`, commit only that file, open a PR to `develop`
     naming what moved (tokens added or gone, parts added or gone). Joe merges.

4. **Parts without a story.** `node scripts/build-design-map.mjs` prints
   "N parts with a story". List the parts in `docs/design-trace.json` `compTok` that no
   story file imports (same rule as the map: a `*.stories.tsx` imports the name). Expected
   today: AdSlot and four page layouts (DirectoryPage, LandingPage, ProfilePage, SiteShell),
   plus the behaviour parts that draw nothing. Anything else is new: offer stories.

5. **Build Storybook.** `npm run build-storybook`. The component copy is read from
   `storybook-static`, so this must be the build of the commit in step 1.

6. **Redraw Paper.** Tokens first, then components:

   ```bash
   node scripts/paper-draw.mjs 01M66S7CTE9FS4F5FK8P12N3QD
   node scripts/paper-draw-components.mjs 01M66S7CTE9FS4F5FK8P12N3QD
   ```

   Each exits 1 and names what it could not draw. The components run prints
   "N components, N stories … N values linked to tokens, N plain … N Paper calls".
   A full run is about 45–55 calls.

7. **Look at it.** Take a Paper screenshot of the Tokens page and of each component page
   (`get_screenshot`). Check: nothing clipped, no page empty, page order Admin → Public → Site.
   A run that printed success is not proof it looks right.

8. **Check the online copies.** Fetch https://vibehq-storybook.vercel.app/signal-map.html and
   read "Traced from the code, <date>, <commit>". If that commit is older than the newest
   merge on `develop`, the Storybook deploy did not run: say so. Do not rebuild it by hand.

9. **Clean up.** `git worktree remove --force .local/wt-ds`.

## Report

In this order, short:

- The commit it was all drawn from.
- Trace: changed (PR link) or unchanged.
- Stories: new parts without one, or "none new".
- Paper: tokens drawn, components and stories drawn, values linked vs plain, Paper calls.
- Online map: its commit, and whether it is the newest.
- What Joe must do: merge a PR, open Paper, approve stories — or nothing.

## Known limits of the Paper copy

These are not faults to fix during an update:

- Paper does not draw text with a font-family token, so fonts are written as names.
- Hover and focus states, `::before`/`::after` (about 32) and site light mode are not copied.
- About 9% of values are plain, not token-linked: values with no matching token.
