# Publish script with NPM Provenance (PowerShell)
# Usage: .\publish-with-provenance.ps1 [patch|minor|major]

param(
    [string]$VersionType = "patch"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Publishing llmverify with NPM Provenance" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Ensure we're on main branch
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host " Error: Must be on main branch (currently on $currentBranch)" -ForegroundColor Red
    exit 1
}

# Ensure working directory is clean
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host " Error: Working directory is not clean. Commit or stash changes first." -ForegroundColor Red
    git status --short
    exit 1
}

# Pull latest changes
Write-Host "Pulling latest changes..." -ForegroundColor Yellow
git pull origin main

# Run tests locally
Write-Host " Running tests..." -ForegroundColor Yellow
npm test

# Bump version
Write-Host " Bumping version ($VersionType)..." -ForegroundColor Yellow
npm version $VersionType -m "chore: release v%s"

# Get new version
$packageJson = Get-Content -Path "package.json" | ConvertFrom-Json
$newVersion = $packageJson.version
Write-Host "New version: v$newVersion" -ForegroundColor Green

# Push with tags
Write-Host " Pushing to GitHub with tags..." -ForegroundColor Yellow
git push --follow-tags

Write-Host ""
Write-Host " Done! GitHub Actions will now:" -ForegroundColor Green
Write-Host "   1. Build the package"
Write-Host "   2. Run tests"
Write-Host "   3. Publish to NPM with provenance"
Write-Host ""
Write-Host " Monitor the workflow at:" -ForegroundColor Cyan
Write-Host "https://github.com/subodhkc/llmverify-npm/actions"
Write-Host ""
Write-Host "After publishing, check the provenance badge at:" -ForegroundColor Cyan
Write-Host "https://www.npmjs.com/package/llmverify"
