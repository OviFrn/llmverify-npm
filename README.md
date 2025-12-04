# llmverify

Check AI responses for safety issues before showing them to users.

[![npm](https://img.shields.io/npm/v/llmverify.svg)](https://www.npmjs.com/package/llmverify)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install llmverify
```

## Usage

```javascript
const { verify, isInputSafe, redactPII } = require('llmverify');

// Check user input
if (!isInputSafe(userMessage)) {
  return { error: 'Invalid input' };
}

// Check AI response
const result = await verify({ content: aiResponse });
if (result.risk.level === 'critical') {
  return { error: 'Blocked for safety' };
}

// Remove personal info
const { redacted } = redactPII(aiResponse);
```

## What It Checks

- Prompt injection attacks
- Personal info (emails, phones, SSNs)
- Broken JSON
- Hallucinations
- Harmful content

## Server Mode

```bash
# Start server
npx llmverify-serve

# Check responses via HTTP
curl -X POST http://localhost:9009/verify \
  -H "Content-Type: application/json" \
  -d '{"content": "AI response"}'
```

## CLI

```bash
# Check text
npx llmverify "AI response"

# Check file
npx llmverify --file response.txt

# JSON output
npx llmverify "text" --json
```

## Risk Levels

| Level | Score | Action |
|-------|-------|--------|
| LOW | 0-25% | Safe to use |
| MODERATE | 26-50% | Review first |
| HIGH | 51-75% | Fix before using |
| CRITICAL | 76-100% | Block |

## Documentation

- [Getting Started](docs/GETTING-STARTED.md) - Tutorial
- [CLI Reference](docs/CLI-REFERENCE.md) - All commands
- [API Reference](docs/API-REFERENCE.md) - All functions
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues

## Examples

See `/examples` folder for:
- Basic usage
- Express API integration
- IDE integration
- Server mode

## License

MIT

## Support

- Issues: https://github.com/subodhkc/llmverify-npm/issues
- NPM: https://www.npmjs.com/package/llmverify
