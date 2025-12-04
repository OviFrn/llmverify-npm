#!/bin/bash
# Publish script with NPM Provenance
# Usage: ./publish-with-provenance.sh [patch|minor|major]

set -e

VERSION_TYPE=${1:-patch}

echo "🚀 Publishing llmverify with NPM Provenance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Ensure we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Error: Must be on main branch (currently on $CURRENT_BRANCH)"
  exit 1
fi

# Ensure working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: Working directory is not clean. Commit or stash changes first."
  git status --short
  exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Run tests locally
echo "🧪 Running tests..."
npm test

# Bump version
echo "📦 Bumping version ($VERSION_TYPE)..."
npm version $VERSION_TYPE -m "chore: release v%s"

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ New version: v$NEW_VERSION"

# Push with tags
echo "📤 Pushing to GitHub with tags..."
git push --follow-tags

echo ""
echo "✅ Done! GitHub Actions will now:"
echo "   1. Build the package"
echo "   2. Run tests"
echo "   3. Publish to NPM with provenance"
echo ""
echo "🔗 Monitor the workflow at:"
echo "   https://github.com/subodhkc/llmverify-npm/actions"
echo ""
echo "📦 After publishing, check the provenance badge at:"
echo "   https://www.npmjs.com/package/llmverify"
