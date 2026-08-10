<#
.SYNOPSIS
  Scan everything that governs a session, and write one JSON the map is built from.

.DESCRIPTION
  The skills map used to be a document: I read CLAUDE.md and BUILD-PLAN section 10, formed a
  view, and wrote it out by hand. That made every finding on it my opinion, and it went stale
  the moment a skill changed.

  This replaces that. It observes four things and records what it saw:

    skills     every directory in the library: does it have a SKILL.md at all, does the
               frontmatter name match the folder, is there a description, how many files
    agents     every .md in the agents directory, with its description
    CLAUDE.md  the workspace and repo agreements, and which skills they name
    section 10 the phase-to-skill table in docs/BUILD-PLAN.md

  Nothing here is interpreted. It reports what is on disk, with a timestamp, so a finding on
  the map can say "observed by this script on this date" rather than "I think".

  Read-only. It changes nothing.

.EXAMPLE
  ./scripts/map-scan.ps1
  ./scripts/map-scan.ps1 -OutFile docs/skills-map/scan.json
#>
[CmdletBinding()]
param(
  [string]$SkillsRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) '..\.claude\skills'),
  [string]$AgentsRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) '..\.claude\agents'),
  [string]$WorkspaceClaudeMd = (Join-Path (Split-Path -Parent $PSScriptRoot) '..\.claude\CLAUDE.md'),
  [string]$RepoClaudeMd      = (Join-Path (Split-Path -Parent $PSScriptRoot) 'CLAUDE.md'),
  [string]$BuildPlan         = (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs\BUILD-PLAN.md'),
  [string]$OutFile           = (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs\skills-map\scan.json')
)

$ErrorActionPreference = 'Stop'
function Note($m,$c='Gray'){ Write-Host $m -ForegroundColor $c }

# Frontmatter is flat here, so this stays line-based rather than pulling in a YAML parser —
# it has to run on stock PowerShell 5.1.
function Get-Frontmatter {
  param([string[]]$Lines)
  $out = [ordered]@{ name=''; description=''; license='' }
  if ($Lines.Count -eq 0 -or $Lines[0].Trim() -ne '---') { return $out }
  $key = $null
  for ($i=1; $i -lt $Lines.Count; $i++) {
    if ($Lines[$i].Trim() -eq '---') { break }
    if ($Lines[$i] -match '^([A-Za-z0-9_-]+):\s*(.*)$') {
      $key = $Matches[1].ToLower()
      if ($out.Contains($key)) { $out[$key] = $Matches[2].Trim().Trim('"').Trim("'") }
    } elseif ($key -and $out.Contains($key) -and $Lines[$i].Trim()) {
      $out[$key] = ($out[$key] + ' ' + $Lines[$i].Trim()).Trim()
    }
  }
  $out
}

# ---------------------------------------------------------------- skills
$skills = @()
if (Test-Path -LiteralPath $SkillsRoot) {
  $SkillsRoot = (Resolve-Path -LiteralPath $SkillsRoot).Path
  Note "skills   $SkillsRoot" Cyan
  foreach ($dir in Get-ChildItem -LiteralPath $SkillsRoot -Directory | Sort-Object Name) {
    $sk = Join-Path $dir.FullName 'SKILL.md'
    $has = Test-Path -LiteralPath $sk
    $fm  = if ($has) { Get-Frontmatter -Lines (Get-Content -LiteralPath $sk -Encoding UTF8) }
           else      { @{ name=''; description=''; license='' } }
    $files = @(Get-ChildItem -LiteralPath $dir.FullName -Recurse -File -ErrorAction SilentlyContinue)
    $skills += [pscustomobject]@{
      directory       = $dir.Name
      declaredName    = $fm.name
      nameMatchesDir  = ($fm.name -eq $dir.Name)
      hasSkillMd      = $has
      hasDescription  = [bool]$fm.description
      descriptionLen  = $fm.description.Length
      description     = $fm.description
      license         = $fm.license
      supportingFiles = [Math]::Max(0, $files.Count - 1)
      lastWriteUtc    = if ($has) { (Get-Item -LiteralPath $sk).LastWriteTimeUtc.ToString('s')+'Z' } else { $null }
    }
  }
} else { Note "skills   NOT FOUND at $SkillsRoot" Red }

# ---------------------------------------------------------------- agents
$agents = @()
if (Test-Path -LiteralPath $AgentsRoot) {
  Note "agents   $AgentsRoot" Cyan
  foreach ($f in Get-ChildItem -LiteralPath $AgentsRoot -Recurse -File -Filter *.md | Sort-Object Name) {
    $fm = Get-Frontmatter -Lines (Get-Content -LiteralPath $f.FullName -Encoding UTF8)
    $agents += [pscustomobject]@{
      name         = $f.BaseName
      declaredName = $fm.name
      description  = $fm.description
      lastWriteUtc = $f.LastWriteTimeUtc.ToString('s')+'Z'
    }
  }
} else { Note "agents   none at $AgentsRoot" Yellow }

# ---------------------------------------------------------------- the agreements
function Read-Agreement($path,$label) {
  if (-not (Test-Path -LiteralPath $path)) { Note "$label  NOT FOUND at $path" Yellow; return $null }
  Note "$label  $path" Cyan
  $lines = Get-Content -LiteralPath $path -Encoding UTF8
  [pscustomobject]@{
    path  = $path
    lines = $lines.Count
    text  = ($lines -join "`n")
  }
}
$wsMd   = Read-Agreement $WorkspaceClaudeMd 'workspace CLAUDE.md'
$repoMd = Read-Agreement $RepoClaudeMd      'repo CLAUDE.md     '

# ---------------------------------------------------------------- section 10
$s10 = $null
if (Test-Path -LiteralPath $BuildPlan) {
  Note "build plan  $BuildPlan" Cyan
  $bp = Get-Content -LiteralPath $BuildPlan -Encoding UTF8
  # from the heading numbered 10 to the next top-level heading
  $start = ($bp | Select-String -Pattern '^#{1,3}\s*10[\.\s]' | Select-Object -First 1).LineNumber
  if ($start) {
    $end = $bp.Count
    for ($i=$start; $i -lt $bp.Count; $i++) {
      if ($bp[$i] -match '^#{1,3}\s*1[1-9][\.\s]' -or $bp[$i] -match '^#{1,2}\s+[A-Z]') { $end=$i; break }
    }
    $s10 = [pscustomobject]@{
      startLine = $start
      text      = (($bp[($start-1)..($end-1)]) -join "`n")
    }
  } else { Note "  no heading numbered 10 found" Yellow }
} else { Note "build plan  NOT FOUND at $BuildPlan" Yellow }

# ---------------------------------------------------------------- manifest
$manifestPath = Join-Path $SkillsRoot 'manifest.json'
$manifest = $null
if (Test-Path -LiteralPath $manifestPath) {
  try { $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json }
  catch { Note "manifest.json present but unparseable: $_" Yellow }
}

# ---------------------------------------------------------------- write
$report = [pscustomobject]@{
  scannedUtc  = (Get-Date).ToUniversalTime().ToString('s')+'Z'
  machine     = $env:COMPUTERNAME
  skillsRoot  = $SkillsRoot
  agentsRoot  = $AgentsRoot
  skills      = $skills
  agents      = $agents
  manifest    = if ($manifest) { @($manifest.skills | Select-Object name, source, updatedAt) } else { @() }
  workspaceClaudeMd = $wsMd
  repoClaudeMd      = $repoMd
  section10         = $s10
}

$dir = Split-Path -Parent $OutFile
if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutFile -Encoding UTF8

Note ""
Note ("{0} skills, {1} agents, {2} manifest entries" -f $skills.Count, $agents.Count, @($report.manifest).Count) Green
Note "Wrote $OutFile" Green
Note ""
Note "Next: commit it and the map rebuilds from it." Cyan
Note "  git add docs/skills-map/scan.json"
Note "  git commit -m `"Scan of the skills library`""
Note "  git push"
