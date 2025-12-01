# Auto-commit script for Windows PowerShell
# This script automatically commits changes with detailed messages

Write-Host "Checking for changes..." -ForegroundColor Cyan

# Check if there are any changes
$hasChanges = (git diff --quiet 2>&1) -or (git diff --cached --quiet 2>&1)
if (-not $hasChanges) {
    $staged = git diff --cached --name-only
    $unstaged = git diff --name-only
    
    if ($staged.Count -eq 0 -and $unstaged.Count -eq 0) {
        Write-Host "No changes to commit." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Staging all changes..." -ForegroundColor Cyan
git add -A

# Get changed files
$changedFiles = git diff --cached --name-only
$addedFiles = git diff --cached --diff-filter=A --name-only
$deletedFiles = git diff --cached --diff-filter=D --name-only
$modifiedFiles = git diff --cached --diff-filter=M --name-only

# Build commit message
$commitMsg = "Update: "

if ($addedFiles.Count -gt 0) {
    $commitMsg += "Added $($addedFiles.Count) file(s). "
}

if ($deletedFiles.Count -gt 0) {
    $commitMsg += "Deleted $($deletedFiles.Count) file(s). "
}

if ($modifiedFiles.Count -gt 0) {
    $commitMsg += "Modified $($modifiedFiles.Count) file(s). "
}

# Add file list (first 5 files)
$fileList = ($changedFiles | Select-Object -First 5) -join ", "
if ($changedFiles.Count -gt 5) {
    $fileList += " and more..."
}

$commitMsg += "Files: $fileList"

Write-Host ""
Write-Host "Commit message: $commitMsg" -ForegroundColor Green
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Cyan

git commit -m $commitMsg

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Changes committed successfully!" -ForegroundColor Green
    Write-Host ""
    
    $pushChoice = Read-Host "Push to remote? (y/n)"
    if ($pushChoice -eq "y" -or $pushChoice -eq "Y") {
        Write-Host "Pushing to remote..." -ForegroundColor Cyan
        git push origin main
    }
} else {
    Write-Host "Failed to commit changes." -ForegroundColor Red
    exit 1
}

