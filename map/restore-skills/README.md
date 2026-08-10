# The 13 skills that went missing during consolidation

Recovered from the session container on 6 Aug. They were in the account library at
`C:\Users\joene\.claude\skills` and did not survive the manual moves before
`fix-skills-layout.ps1` ran — by the time it ran, that folder held only a broken junction.

All 15 account skills are here. 13 of them are missing from the workspace library;
`ecommerce-security-audit` and `webaudio-plugin-builder` are already there, so those two are
included only for completeness and will be skipped by the copy below.

The seven that carry the 6 Aug description fixes are included with those fixes already applied.

## Restore

```powershell
cd C:\Users\joene\OneDrive\Design2\Web\vibehq
git fetch origin claude/skills-relationship-viz-y5t67z
git checkout origin/claude/skills-relationship-viz-y5t67z -- docs/skills-map/restore-skills

$src = "docs\skills-map\restore-skills\skills"
$dst = "$HOME\OneDrive\Design2\Web\.claude\skills"
Get-ChildItem $src -Directory | Where-Object { -not (Test-Path "$dst\$($_.Name)") } |
  ForEach-Object { Copy-Item $_.FullName $dst -Recurse }
Copy-Item "$src\manifest.json" $dst -Force

(Get-ChildItem $dst -Directory).Count     # expect 44
```

Then restart Claude Code.
