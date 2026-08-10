<#
.SYNOPSIS
  Push the skills library. One command, from anywhere.

.DESCRIPTION
  Adding a skill and having it appear on the map is three steps, and only the first is yours:

    1. push the library      <- this script
    2. rebuild the map       <- happens in the library repo, on the push itself
    3. re-publish it         <- ask Claude; a web page cannot read your disk

  Step 2 used to run here on a schedule against a checkout of the library. The map now lives
  in the library (see docs/skills-map.md), so pushing IS what rebuilds it.

  Step 1 kept being the one that got missed — twice now a skill was "not showing" and the
  reason was that it had never left the machine. So it is one command instead of four, and it
  says what it did rather than leaving you to read git's output.

  It stages by explicit path and never `git add -A`. G-001 in docs/gotchas.md is the reason:
  this library has lost SKILL.md files twice, and a blanket add is how a deletion travels.
  Anything already staged is left alone; anything not under skills/ or agents/ is reported
  and skipped rather than swept along.

.PARAMETER Message
  Commit message. Defaults to a summary of what changed.

.PARAMETER WhatIf
  Show what would be committed and pushed, and stop.

.EXAMPLE
  .\scripts\push-skills.ps1
  .\scripts\push-skills.ps1 -Message "Add impeccable"
  .\scripts\push-skills.ps1 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess)]
param(
  [string]$Message,
  [string]$LibraryPath
)

$ErrorActionPreference = 'Stop'

# Find the library rather than assume it. The path has been typed wrong before — a literal
# "..." once created a git repo in the home directory — so it is derived, then checked.
if (-not $LibraryPath) {
  $here = Split-Path -Parent $PSScriptRoot          # the vibehq repo
  $LibraryPath = Join-Path (Split-Path -Parent $here) '.claude'
}
if (-not (Test-Path (Join-Path $LibraryPath 'skills'))) {
  Write-Host "No skills library at: $LibraryPath" -ForegroundColor Red
  Write-Host "Pass the path explicitly:  .\scripts\push-skills.ps1 -LibraryPath 'C:\path\to\.claude'"
  exit 1
}
if (-not (Test-Path (Join-Path $LibraryPath '.git'))) {
  Write-Host "That folder is not a git repository: $LibraryPath" -ForegroundColor Red
  exit 1
}

Push-Location $LibraryPath
try {
  $remote = (git remote get-url origin 2>$null)
  if (-not $remote) { Write-Host "No 'origin' remote set." -ForegroundColor Red; exit 1 }
  Write-Host "Library : $LibraryPath"
  Write-Host "Remote  : $remote`n"

  # --porcelain is the stable format; the first two columns are the index and worktree status
  $changes = @(git status --porcelain -- skills agents | Where-Object { $_ })
  $other   = @(git status --porcelain | Where-Object { $_ -and $_ -notmatch '^..\s+"?(skills|agents)/' })

  if (-not $changes) {
    Write-Host "Nothing to push — the library on disk matches the last commit." -ForegroundColor Green
    # It can still be ahead of the remote if a previous run committed and the push failed.
    $ahead = (git rev-list --count '@{u}..HEAD' 2>$null)
    if ($ahead -and [int]$ahead -gt 0) {
      Write-Host "$ahead commit(s) not yet pushed. Pushing those." -ForegroundColor Yellow
    } else { exit 0 }
  } else {
    $added    = @($changes | Where-Object { $_ -match '^\?\?' })
    $modified = @($changes | Where-Object { $_ -match '^.M|^M.' })
    $deleted  = @($changes | Where-Object { $_ -match '^.D|^D.' })
    Write-Host ("{0} new, {1} changed, {2} deleted" -f $added.Count,$modified.Count,$deleted.Count)
    foreach ($c in $changes) { Write-Host "  $c" }

    if ($deleted) {
      # A deletion in this library is the exact shape of the loss recorded in G-001, so it is
      # named loudly and confirmed rather than pushed on the assumption it was deliberate.
      Write-Host "`nSome files are DELETED. This library has lost files by accident twice (G-001)." -ForegroundColor Yellow
      $yes = Read-Host "Type 'yes' to include the deletions"
      if ($yes -ne 'yes') { Write-Host "Stopped. Nothing committed."; exit 1 }
    }
    if ($other) {
      Write-Host "`nNot staging these — outside skills/ and agents/:" -ForegroundColor DarkGray
      foreach ($o in $other) { Write-Host "  $o" -ForegroundColor DarkGray }
    }

    if (-not $Message) {
      $names = $changes | ForEach-Object { ($_ -replace '^...\s*','' -split '/')[1] } |
               Select-Object -Unique | Sort-Object
      $Message = "Library: " + ($names -join ', ')
      if ($Message.Length -gt 72) { $Message = "Library: $($names.Count) skills changed" }
    }

    if ($PSCmdlet.ShouldProcess($LibraryPath, "commit and push")) {
      git add -- skills agents
      git commit -m $Message
    } else {
      Write-Host "`n-WhatIf: would commit '$Message' and push." ; exit 0
    }
  }

  Write-Host "`nPushing..."
  git push
  if ($LASTEXITCODE -ne 0) { Write-Host "Push failed. Fix the error above and re-run." -ForegroundColor Red; exit 1 }

  $sha = (git rev-parse --short HEAD)
  Write-Host "`nPushed $sha." -ForegroundColor Green
  Write-Host "The map rebuilds in the library repo off this push."
  Write-Host "It still needs re-publishing to the artifact link — ask Claude to do that."
}
finally { Pop-Location }
