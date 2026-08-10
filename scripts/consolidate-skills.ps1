<#
.SYNOPSIS
  Merge both skill libraries into the workspace one, and point the old path at it.

.DESCRIPTION
  Ends up with a single real folder — OneDrive\Design2\Web\.claude\skills — that still loads
  in every project, because C:\Users\joene\.claude\skills becomes a junction to it.

  Deletes ONLY the old skills folder. Never touches the rest of .claude, which holds sessions,
  projects, settings and hooks.

  Refuses to delete anything unless the copy verified first.

.EXAMPLE
  ./scripts/consolidate-skills.ps1 -WhatIf     # dry run
  ./scripts/consolidate-skills.ps1             # do it
#>
[CmdletBinding(SupportsShouldProcess)]
param(
  [string]$Account   = (Join-Path $HOME '.claude\skills'),
  [string]$Workspace = (Join-Path $HOME 'OneDrive\Design2\Web\.claude\skills')
)

$ErrorActionPreference = 'Stop'
function Say($m, $c = 'Gray') { Write-Host $m -ForegroundColor $c }

# ---------------------------------------------------------------- checks
if (-not (Test-Path -LiteralPath $Workspace)) { throw "Workspace library not found: $Workspace" }

$isJunction = (Get-Item -LiteralPath $Account -Force -ErrorAction SilentlyContinue).LinkType
if ($isJunction) { Say "Already done — $Account is a $isJunction to its target." Green; return }

if (-not (Test-Path -LiteralPath $Account)) { throw "Account library not found: $Account" }

$before  = @(Get-ChildItem -LiteralPath $Workspace -Directory).Count
$incoming = @(Get-ChildItem -LiteralPath $Account -Directory)
$new  = @($incoming | Where-Object { -not (Test-Path -LiteralPath (Join-Path $Workspace $_.Name)) })
$dupe = @($incoming | Where-Object {      Test-Path -LiteralPath (Join-Path $Workspace $_.Name)  })

Say ""
Say "Workspace has $before skills."
Say "Account has $($incoming.Count): $($new.Count) new, $($dupe.Count) already present."
if ($dupe) { Say "  already present (workspace copy kept): $($dupe.Name -join ', ')" Yellow }
Say ""

# ---------------------------------------------------------------- 1. copy
foreach ($d in $new) {
  if ($PSCmdlet.ShouldProcess($d.Name, "copy into workspace library")) {
    Copy-Item -LiteralPath $d.FullName -Destination $Workspace -Recurse
    Say "  copied $($d.Name)"
  }
}
$manifest = Join-Path $Account 'manifest.json'
if ((Test-Path -LiteralPath $manifest) -and $PSCmdlet.ShouldProcess('manifest.json', 'copy')) {
  Copy-Item -LiteralPath $manifest -Destination $Workspace -Force
  Say "  copied manifest.json"
}

if ($WhatIfPreference) { Say ""; Say "Dry run only. Nothing changed." Cyan; return }

# ---------------------------------------------------------------- 2. verify before deleting anything
$after   = @(Get-ChildItem -LiteralPath $Workspace -Directory).Count
$expected = $before + $new.Count
if ($after -ne $expected) {
  throw "Copy did not verify: expected $expected skills in the workspace library, found $after. Nothing deleted."
}
$missing = @($incoming | Where-Object { -not (Test-Path -LiteralPath (Join-Path $Workspace $_.Name)) })
if ($missing) { throw "These did not make it across: $($missing.Name -join ', '). Nothing deleted." }
Say ""
Say "Verified: $after skills in the workspace library, every account skill present." Green

# ---------------------------------------------------------------- 3. delete the old folder, and only that
if ($PSCmdlet.ShouldProcess($Account, "delete (skills folder only — .claude itself is untouched)")) {
  Remove-Item -LiteralPath $Account -Recurse -Force
  Say "Removed $Account"
}

# ---------------------------------------------------------------- 4. junction so the old path still resolves
if ($PSCmdlet.ShouldProcess($Account, "junction -> $Workspace")) {
  New-Item -ItemType Junction -Path $Account -Target $Workspace | Out-Null
  Say "Junction created: $Account -> $Workspace" Green
}

# ---------------------------------------------------------------- 5. prove it
$check = @(Get-ChildItem -LiteralPath $Account -Directory).Count
Say ""
if ($check -eq $after) {
  Say "Done. One library, $check skills, reachable from both paths." Green
  Say ""
  Say "Next:" Cyan
  Say "  1. Restart Claude Code."
  Say "  2. Commit and push — that folder is a git repo and this was a big change:"
  Say "       cd `$HOME\OneDrive\Design2\Web\.claude"
  Say "       git add skills"
  Say "       git commit -m `"Consolidate both skill libraries into this one`""
  Say "       git push"
} else {
  Say "Junction reports $check skills but the folder has $after. Check it before restarting." Red
}
