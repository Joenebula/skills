<#
.SYNOPSIS
  Inventory the skills library so the skills map can be checked against reality.

.DESCRIPTION
  The map at docs/skills-map/skills-map.html was built from the account-synced copy of the
  skills, not from the workspace library that CLAUDE.md points at (../.claude/skills). If a
  skill exists there but not in the synced copy, the map wrongly calls it missing.

  Run this, paste the output back to Claude, and the map can be corrected against it.

.EXAMPLE
  ./scripts/skills-inventory.ps1
  ./scripts/skills-inventory.ps1 -Root "C:\Users\joene\OneDrive\Design2\Web\.claude\skills"
  ./scripts/skills-inventory.ps1 -OutFile skills.json
#>
[CmdletBinding()]
param(
  # Defaults to the workspace library beside the repo, i.e. ..\.claude\skills
  [string]$Root = (Join-Path (Split-Path -Parent $PSScriptRoot) '..\.claude\skills'),
  [string]$OutFile
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Root)) {
  Write-Error "No skills directory at: $Root`nPass -Root with the correct path."
  return
}
$Root = (Resolve-Path -LiteralPath $Root).Path
Write-Host "Scanning $Root" -ForegroundColor Cyan

# Pull `name` and `description` out of the YAML frontmatter. Deliberately line-based rather
# than a real YAML parse: frontmatter here is flat, and this must run on stock PowerShell 5.1.
function Get-Frontmatter {
  param([string[]]$Lines)
  $out = @{ name = ''; description = '' }
  if ($Lines.Count -eq 0 -or $Lines[0].Trim() -ne '---') { return $out }

  $key = $null
  for ($i = 1; $i -lt $Lines.Count; $i++) {
    $line = $Lines[$i]
    if ($line.Trim() -eq '---') { break }

    if ($line -match '^([A-Za-z0-9_-]+):\s*(.*)$') {
      $key = $Matches[1].ToLower()
      $val = $Matches[2].Trim().Trim('"').Trim("'")
      if ($out.ContainsKey($key)) { $out[$key] = $val }
    }
    elseif ($key -and $out.ContainsKey($key) -and $line.Trim()) {
      # continuation of a wrapped value
      $out[$key] = ($out[$key] + ' ' + $line.Trim()).Trim()
    }
  }
  $out
}

$skills = foreach ($dir in Get-ChildItem -LiteralPath $Root -Directory | Sort-Object Name) {
  $skillFile = Join-Path $dir.FullName 'SKILL.md'
  $hasSkill  = Test-Path -LiteralPath $skillFile

  $name = ''; $desc = ''
  if ($hasSkill) {
    $fm   = Get-Frontmatter -Lines (Get-Content -LiteralPath $skillFile -Encoding UTF8)
    $name = $fm.name
    $desc = $fm.description
  }

  $files = @(Get-ChildItem -LiteralPath $dir.FullName -Recurse -File -ErrorAction SilentlyContinue)

  [pscustomobject]@{
    directory       = $dir.Name
    declaredName    = $name
    nameMatchesDir  = ($name -eq $dir.Name)
    hasSkillMd      = $hasSkill
    supportingFiles = [Math]::Max(0, $files.Count - 1)
    description     = $desc
  }
}

$manifestPath = Join-Path $Root 'manifest.json'
$inManifest = @()
if (Test-Path -LiteralPath $manifestPath) {
  try {
    $inManifest = (Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 |
                   ConvertFrom-Json).skills.name
  } catch { Write-Warning "manifest.json present but could not be parsed: $_" }
}

$report = [pscustomobject]@{
  root            = $Root
  scannedUtc      = (Get-Date).ToUniversalTime().ToString('s') + 'Z'
  skillCount      = @($skills).Count
  manifestPresent = (Test-Path -LiteralPath $manifestPath)
  missingFromManifest = @(
    if ($inManifest) { $skills | Where-Object { $inManifest -notcontains $_.directory } |
                                 Select-Object -ExpandProperty directory }
  )
  nameMismatches  = @($skills | Where-Object { $_.hasSkillMd -and -not $_.nameMatchesDir } |
                      ForEach-Object { "$($_.directory) declares '$($_.declaredName)'" })
  skills          = @($skills)
}

$json = $report | ConvertTo-Json -Depth 6

if ($OutFile) {
  $json | Set-Content -LiteralPath $OutFile -Encoding UTF8
  Write-Host "Wrote $OutFile" -ForegroundColor Green
} else {
  $json
}

Write-Host ""
Write-Host "$($report.skillCount) skills in $Root" -ForegroundColor Green
if ($report.nameMismatches)      { Write-Host "Name mismatches: $($report.nameMismatches -join '; ')" -ForegroundColor Yellow }
if ($report.missingFromManifest) { Write-Host "Not in manifest.json: $($report.missingFromManifest -join ', ')" -ForegroundColor Yellow }
