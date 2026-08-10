<#
.SYNOPSIS
  One report that unblocks the skills-map fix list.

.DESCRIPTION
  Claude runs in a remote container. The repo comes from GitHub; the skills libraries never
  leave your machine. This gathers everything eleven of the thirteen open items are waiting on,
  in one output you can paste back.

  Read-only. It changes nothing.

.EXAMPLE
  ./scripts/skills-report.ps1
  ./scripts/skills-report.ps1 -OutFile report.txt
#>
[CmdletBinding()]
param(
  [string]$Workspace = 'C:\Users\joene\OneDrive\Design2\Web\.claude',
  [string]$Account   = (Join-Path $HOME '.claude'),
  [string]$OutFile
)

$ErrorActionPreference = 'Continue'
$out = [System.Collections.Generic.List[string]]::new()
function W([string]$t) { $out.Add($t) }

W "=== SKILLS REPORT  $(Get-Date -Format s) ==="
W "workspace: $Workspace"
W "account:   $Account"
W ""

# ---------------------------------------------------------------- 1. the two files that outrank everything
W "--- 1. FILES THAT VANISHED BEFORE (gotcha G-001) ---"
foreach ($n in 'security','ask-dont-guess') {
  $f = Join-Path $Workspace "skills\$n\SKILL.md"
  $folder = Test-Path (Join-Path $Workspace "skills\$n")
  $file   = Test-Path $f
  $lines  = if ($file) { (Get-Content -LiteralPath $f).Count } else { 0 }
  W ("{0,-16} folder={1,-5} SKILL.md={2,-5} lines={3}" -f $n, $folder, $file, $lines)
}
W ""

# ---------------------------------------------------------------- 2. the agreement above vibehq
W "--- 2. WORKSPACE CLAUDE.md (the map is missing this) ---"
$wc = Join-Path $Workspace 'CLAUDE.md'
if (Test-Path $wc) {
  W "present, $((Get-Content -LiteralPath $wc).Count) lines. Lines naming a skill or law:"
  Get-Content -LiteralPath $wc |
    Select-String -Pattern 'skill|law|always|ask-dont-guess' |
    Select-Object -First 40 |
    ForEach-Object { W ("  " + $_.Line.Trim()) }
} else { W "NOT FOUND at $wc" }
W ""

# ---------------------------------------------------------------- 3. agents
W "--- 3. AGENTS (section 10 names security-route-auditor; the map has no agents at all) ---"
$ag = Join-Path $Workspace 'agents'
if (Test-Path $ag) {
  Get-ChildItem -LiteralPath $ag -Recurse -File -Include *.md |
    ForEach-Object {
      $desc = (Get-Content -LiteralPath $_.FullName |
               Select-String -Pattern '^description:' | Select-Object -First 1).Line
      W ("{0,-28} {1}" -f $_.BaseName, ($desc -replace '^description:\s*',''))
    }
} else { W "no agents directory at $ag" }
W ""

# ---------------------------------------------------------------- 4. both libraries
function Report-Library([string]$root, [string]$label) {
  W "--- $label : $root ---"
  if (-not (Test-Path $root)) { W "NOT FOUND"; W ""; return }
  foreach ($d in Get-ChildItem -LiteralPath $root -Directory | Sort-Object Name) {
    $sk = Join-Path $d.FullName 'SKILL.md'
    if (-not (Test-Path $sk)) { W ("{0,-28} NO SKILL.md" -f $d.Name); continue }

    $raw  = Get-Content -LiteralPath $sk
    $name = ($raw | Select-String -Pattern '^name:' | Select-Object -First 1).Line -replace '^name:\s*',''
    $desc = ($raw | Select-String -Pattern '^description:' | Select-Object -First 1).Line -replace '^description:\s*',''
    if ($desc.Length -gt 260) { $desc = $desc.Substring(0,260) + '…' }
    $files = @(Get-ChildItem -LiteralPath $d.FullName -Recurse -File).Count - 1
    $flag  = if ($name -and $name.Trim('"''') -ne $d.Name) { " [NAME MISMATCH: $name]" } else { "" }
    W ("{0,-28} files={1,-3}{2}" -f $d.Name, $files, $flag)
    W ("    " + $desc)
  }
  W ""
}
Report-Library (Join-Path $Workspace 'skills') "4. WORKSPACE LIBRARY"
Report-Library (Join-Path $Account   'skills') "5. ACCOUNT LIBRARY"

# ---------------------------------------------------------------- 6. duplicates
W "--- 6. SKILLS PRESENT IN BOTH LIBRARIES (do they differ, or are they one file synced?) ---"
$wsSkills = Join-Path $Workspace 'skills'
$acSkills = Join-Path $Account   'skills'
if ((Test-Path $wsSkills) -and (Test-Path $acSkills)) {
  $a = Get-ChildItem -LiteralPath $wsSkills -Directory | Select-Object -ExpandProperty Name
  $b = Get-ChildItem -LiteralPath $acSkills -Directory | Select-Object -ExpandProperty Name
  $both = $a | Where-Object { $b -contains $_ }
  if (-not $both) { W "none" }
  foreach ($n in $both) {
    $f1 = Join-Path $wsSkills "$n\SKILL.md"; $f2 = Join-Path $acSkills "$n\SKILL.md"
    if ((Test-Path $f1) -and (Test-Path $f2)) {
      $h1 = (Get-FileHash -LiteralPath $f1 -Algorithm SHA256).Hash
      $h2 = (Get-FileHash -LiteralPath $f2 -Algorithm SHA256).Hash
      W ("{0,-28} {1}" -f $n, $(if ($h1 -eq $h2) { "IDENTICAL — nothing to fix" } else { "DIFFERENT — they have drifted" }))
    } else { W ("{0,-28} one side has no SKILL.md" -f $n) }
  }
}
W ""
W "=== END ==="

$text = $out -join "`r`n"
if ($OutFile) { $text | Set-Content -LiteralPath $OutFile -Encoding UTF8; Write-Host "Wrote $OutFile" -ForegroundColor Green }
else { $text }
