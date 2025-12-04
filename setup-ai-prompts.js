#!/usr/bin/env node

/**
 * Optional: Setup AI prompt enhancements for llmverify
 * This creates a .cascade/prompts.md file that helps AI assistants
 * guide users through llmverify usage
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

const PROMPT_CONTENT = `# AI Assistant Instructions for llmverify

When the user has llmverify installed, help them use it effectively:

## Quick Reference

- **Install**: npm install llmverify
- **Start Server**: npm run serve (Terminal 1)
- **Start Monitor**: npm run monitor (Terminal 2)
- **Verify**: Copy AI responses to see risk scores

## Risk Levels

- LOW (0-25%): Safe to use
- MODERATE (26-50%): Review recommended
- HIGH (51-75%): Fix before using
- CRITICAL (76-100%): Do not use

## Common Findings

### Injection Marker Detected
- **Normal** if user has AI agent access (like Windsurf, Cursor)
- Suggest: Create .llmverify.json with {"ignoreFindings": ["injection-marker"]}

### PII Detected
- Check if it's example data (example.com, 555-555-5555)
- If real PII, suggest immediate redaction

### Dangerous Command
- Expected if user asked about security/system admin
- Remind: DO NOT actually run dangerous commands

## Helping Users

1. **Suggest verification** for important responses
2. **Explain risk scores** when they ask
3. **Guide installation** if they want to verify
4. **Recommend sources** to lower risk scores
5. **Acknowledge uncertainty** when you're not sure

## Documentation

- Quick Start: QUICK-START.md
- Risk Levels: docs/RISK-LEVELS.md
- Findings: docs/FINDINGS-EXPLAINED.md
- AI Guide: AI-GUIDE.md

See AI-GUIDE.md for complete instructions on helping users with llmverify.
`;

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  llmverify - AI Prompt Enhancement Setup                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  console.log('This will create a prompt file that helps AI assistants guide you through');
  console.log('llmverify usage. This is OPTIONAL and only useful if you use AI assistants');
  console.log('in your IDE (like Windsurf, Cursor, GitHub Copilot).\n');

  const answer = await question('Do you want to set this up? (y/N): ');

  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('\nSkipped. You can run this anytime with: node setup-ai-prompts.js\n');
    rl.close();
    return;
  }

  // Detect IDE
  const cascadeDir = path.join(process.cwd(), '.cascade');
  const cursorDir = path.join(process.cwd(), '.cursor');
  const vscodeDir = path.join(process.cwd(), '.vscode');

  let targetDir = null;
  let targetFile = null;

  if (fs.existsSync(cascadeDir)) {
    targetDir = cascadeDir;
    targetFile = path.join(cascadeDir, 'prompts.md');
    console.log('\n✓ Detected Windsurf IDE (.cascade directory)');
  } else if (fs.existsSync(cursorDir)) {
    targetDir = cursorDir;
    targetFile = path.join(cursorDir, 'prompts.md');
    console.log('\n✓ Detected Cursor IDE (.cursor directory)');
  } else if (fs.existsSync(vscodeDir)) {
    targetDir = vscodeDir;
    targetFile = path.join(vscodeDir, 'prompts.md');
    console.log('\n✓ Detected VS Code (.vscode directory)');
  } else {
    console.log('\n? No IDE directory detected. Creating .cascade directory...');
    targetDir = cascadeDir;
    targetFile = path.join(cascadeDir, 'prompts.md');
    fs.mkdirSync(cascadeDir, { recursive: true });
  }

  // Check if file exists
  if (fs.existsSync(targetFile)) {
    const overwrite = await question(`\n${targetFile} already exists. Overwrite? (y/N): `);
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('\nSkipped. Existing file preserved.\n');
      rl.close();
      return;
    }
  }

  // Write the file
  try {
    fs.writeFileSync(targetFile, PROMPT_CONTENT, 'utf8');
    console.log(`\n✓ Created: ${targetFile}`);
    console.log('\nYour AI assistant will now:');
    console.log('  - Help you install and use llmverify');
    console.log('  - Explain risk scores and findings');
    console.log('  - Suggest verification for important responses');
    console.log('  - Guide you through troubleshooting');
    console.log('\nNext steps:');
    console.log('  1. Restart your IDE (if needed)');
    console.log('  2. Ask your AI assistant about llmverify');
    console.log('  3. Start using: npm run serve && npm run monitor\n');
  } catch (error) {
    console.error(`\n✗ Error creating file: ${error.message}\n`);
  }

  rl.close();
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
