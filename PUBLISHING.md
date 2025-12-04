# Publishing Guide - NPM Provenance Enabled

This package is configured to publish with **NPM Provenance**, which provides cryptographic proof that your package was built and published from GitHub Actions.

## 🎯 What is NPM Provenance?

NPM Provenance creates a verifiable link between your package and its source code, showing:
- ✅ **Built and signed on GitHub Actions** badge on npmjs.com
- 🔐 Cryptographic attestation of the build process
- 📜 Transparency log entries for supply chain security
- 🔗 Direct link to the exact commit and workflow run

## 🚀 How to Publish

### Option 1: Using the Helper Script (Recommended)

**Windows (PowerShell):**
```powershell
# Patch version (1.0.1 → 1.0.2)
.\publish-with-provenance.ps1 patch

# Minor version (1.0.1 → 1.1.0)
.\publish-with-provenance.ps1 minor

# Major version (1.0.1 → 2.0.0)
.\publish-with-provenance.ps1 major
```

**Linux/Mac (Bash):**
```bash
# Make script executable (first time only)
chmod +x publish-with-provenance.sh

# Patch version (1.0.1 → 1.0.2)
./publish-with-provenance.sh patch

# Minor version (1.0.1 → 1.1.0)
./publish-with-provenance.sh minor

# Major version (1.0.1 → 2.0.0)
./publish-with-provenance.sh major
```

### Option 2: Manual Steps

```bash
# 1. Ensure you're on main branch with clean working directory
git checkout main
git pull origin main

# 2. Run tests locally
npm test

# 3. Bump version (creates a git tag)
npm version patch  # or minor, or major

# 4. Push with tags
git push --follow-tags
```

## ⚙️ How It Works

1. **Tag Creation**: When you run `npm version`, it creates a git tag (e.g., `v1.0.2`)
2. **Push Tags**: `git push --follow-tags` pushes the tag to GitHub
3. **Workflow Trigger**: The `npm-publish.yml` workflow is triggered by tags matching `v*`
4. **Build & Test**: GitHub Actions builds and tests the package
5. **Publish with Provenance**: Package is published with `--provenance` flag
6. **Attestation**: NPM creates a signed attestation linking the package to the GitHub workflow

## 📋 Requirements

### GitHub Secrets
Ensure `NPM_TOKEN` is configured in GitHub repository secrets:
1. Go to https://github.com/subodhkc/llmverify-npm/settings/secrets/actions
2. Add secret named `NPM_TOKEN` with your NPM automation token

### NPM Token Setup
1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token" → "Automation"
3. Copy the token and add it to GitHub secrets

## 🔍 Verification

After publishing, verify the provenance badge:
1. Visit https://www.npmjs.com/package/llmverify
2. Look for the **"Built and signed on GitHub Actions"** badge
3. Click the badge to see the full attestation details

## 📁 Workflow Configuration

**File**: `.github/workflows/npm-publish.yml`

Key features:
- ✅ Triggers on version tags (`v*`)
- ✅ Node.js 20
- ✅ OIDC token permissions (`id-token: write`)
- ✅ Publishes with `--provenance` flag
- ✅ Runs full test suite before publishing

## 🛡️ Security Benefits

1. **Supply Chain Security**: Verifiable build provenance
2. **Transparency**: Public audit trail of all releases
3. **Trust**: Users can verify package authenticity
4. **Compliance**: Meets modern security standards (SLSA, SBOM)

## 🐛 Troubleshooting

### Workflow doesn't trigger
- Ensure tag starts with `v` (e.g., `v1.0.2`, not `1.0.2`)
- Check that tag was pushed: `git push --follow-tags`

### Provenance badge doesn't appear
- Wait 5-10 minutes after publishing
- Verify workflow completed successfully
- Check that `publishConfig.provenance: true` is in package.json

### Build fails
- Check workflow logs: https://github.com/subodhkc/llmverify-npm/actions
- Ensure all tests pass locally: `npm test`
- Verify build works: `npm run build`

## 📚 Additional Resources

- [NPM Provenance Documentation](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [SLSA Framework](https://slsa.dev/)
