# Merge both skill libraries into the OneDrive one, then point the old path at it.
# Deliberately plain PowerShell — an earlier version used syntax that would not parse.
#
# Ends with:  C:\Users\joene\.claude\skills  ->  junction to
#             C:\Users\joene\OneDrive\Design2\Web\.claude\skills
#
# Only .claude\skills is ever removed. Credentials, settings, sessions and projects
# are never touched. Junctions are removed with Directory.Delete so only the link goes.

$Account   = Join-Path $HOME '.claude\skills'
$Workspace = Join-Path $HOME 'OneDrive\Design2\Web\.claude\skills'

Write-Host ''
Write-Host 'workspace :' $Workspace
Write-Host 'account   :' $Account
Write-Host ''

if (-not (Test-Path -LiteralPath $Workspace)) {
    Write-Host 'Workspace library not found. Nothing done.' -ForegroundColor Red
    exit 1
}

# --- 1. if the account path is itself a link, drop the link (not its target) -------------
$acc = Get-Item -LiteralPath $Account -Force -ErrorAction SilentlyContinue
if ($acc -and $acc.LinkType) {
    Write-Host 'account path is a' $acc.LinkType 'pointing at' $acc.Target
    [System.IO.Directory]::Delete($Account, $false)
    Write-Host 'removed that link, target untouched'
    Write-Host ''
}

# --- 2. clear any links nested inside, and rescue real skills ----------------------------
if (Test-Path -LiteralPath $Account) {
    foreach ($d in Get-ChildItem -LiteralPath $Account -Force -Directory) {
        $item = Get-Item -LiteralPath $d.FullName -Force
        if ($item.LinkType) {
            Write-Host 'removing nested link:' $d.Name
            [System.IO.Directory]::Delete($d.FullName, $false)
            continue
        }
        $dest = Join-Path $Workspace $d.Name
        if (Test-Path -LiteralPath $dest) {
            Write-Host 'already in workspace:' $d.Name
        }
        else {
            Copy-Item -LiteralPath $d.FullName -Destination $Workspace -Recurse
            Write-Host 'copied:' $d.Name -ForegroundColor Green
        }
    }

    $mf = Join-Path $Account 'manifest.json'
    if (Test-Path -LiteralPath $mf) {
        Copy-Item -LiteralPath $mf -Destination $Workspace -Force
        Write-Host 'copied: manifest.json' -ForegroundColor Green
    }
}

# --- 3. verify before deleting anything --------------------------------------------------
$count = (Get-ChildItem -LiteralPath $Workspace -Directory).Count
Write-Host ''
Write-Host 'workspace library now holds' $count 'skills' -ForegroundColor Green

if ($count -lt 30) {
    Write-Host 'That looks too low. Stopping without deleting anything.' -ForegroundColor Red
    exit 1
}

# --- 4. remove the old folder, and only that ---------------------------------------------
if (Test-Path -LiteralPath $Account) {
    Remove-Item -LiteralPath $Account -Recurse -Force
    Write-Host 'removed the old account skills folder'
}

# --- 5. junction so the old path still resolves ------------------------------------------
New-Item -ItemType Junction -Path $Account -Target $Workspace | Out-Null
$check = (Get-ChildItem -LiteralPath $Account -Directory).Count

Write-Host ''
if ($check -eq $count) {
    Write-Host 'Done. One library,' $check 'skills, reachable from both paths.' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Next: restart Claude Code, then commit the library:' -ForegroundColor Cyan
    Write-Host '  cd $HOME\OneDrive\Design2\Web\.claude'
    Write-Host '  git add skills'
    Write-Host '  git commit -m "Consolidate both skill libraries"'
    Write-Host '  git push'
}
else {
    Write-Host 'Mismatch: junction sees' $check 'but folder has' $count -ForegroundColor Red
    Write-Host 'Check before restarting.' -ForegroundColor Red
}
