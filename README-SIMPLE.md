# llmverify - Check if AI Responses Are Safe

**Stop AI from leaking secrets, making things up, or being hacked.**

Works with ChatGPT, Claude, Gemini, and any AI. No API keys needed. Everything runs on your computer.

---

## What Does This Do?

When you use AI in your app, it can:
- **Leak passwords and emails** (PII)
- **Make up fake information** (hallucinations)
- **Get tricked by hackers** (prompt injection)
- **Return broken code** (malformed JSON)

llmverify catches these problems BEFORE they reach your users.

---

## Install (10 seconds)

```bash
npm install llmverify
```

That's it. No signup, no API keys, no tracking.

---

## Quick Start (Copy & Paste)

### 1. Check if User Input is Safe

```javascript
const { isInputSafe } = require('llmverify');

const userMessage = "Tell me a joke";

if (isInputSafe(userMessage)) {
  // Safe! Send to AI
  console.log("OK");
} else {
  // Blocked! Don't send to AI
  console.log("BLOCKED");
}
```

### 2. Remove Secrets from AI Responses

```javascript
const { redactPII } = require('llmverify');

const aiResponse = "Email me at john@example.com or call 555-1234";
const { redacted } = redactPII(aiResponse);

console.log(redacted);
// Output: "Email me at [REDACTED] or call [REDACTED]"
```

### 3. Full Safety Check

```javascript
const { verify } = require('llmverify');

const aiResponse = "The answer is 42";
const result = await verify({ content: aiResponse });

console.log(result.risk.level);  // "low", "moderate", "high", or "critical"

if (result.risk.level === 'critical') {
  console.log("DON'T SHOW THIS TO USERS!");
}
```

---

## How to Use in Your App

### Express API Example

```javascript
const express = require('express');
const { isInputSafe, redactPII, verify } = require('llmverify');

const app = express();
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  // Step 1: Check user input
  if (!isInputSafe(req.body.message)) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  
  // Step 2: Get AI response (your code here)
  const aiResponse = await yourAIFunction(req.body.message);
  
  // Step 3: Check AI response
  const check = await verify({ content: aiResponse });
  if (check.risk.level === 'critical') {
    return res.status(500).json({ error: 'Blocked for safety' });
  }
  
  // Step 4: Remove secrets
  const { redacted } = redactPII(aiResponse);
  
  res.json({ response: redacted });
});

app.listen(3000);
```

---

## Server Mode (For IDEs like Windsurf, VS Code, Cursor)

### Start the Server

```bash
npx llmverify-serve
```

Server starts at `http://localhost:9009`

### Check AI Responses

```bash
# Windows PowerShell
$body = '{"content": "AI response here"}'
Invoke-RestMethod -Uri "http://localhost:9009/verify" -Method POST -ContentType "application/json" -Body $body

# Mac/Linux
curl -X POST http://localhost:9009/verify \
  -H "Content-Type: application/json" \
  -d '{"content": "AI response here"}'
```

### Use in JavaScript

```javascript
const { createIDEExtension } = require('llmverify');

const verifier = createIDEExtension();

// Check any AI response
const result = await verifier.verify("AI response");

console.log(result.verdict);    // [PASS] SAFE TO USE
console.log(result.riskScore);  // 5.8
console.log(result.safe);       // true
```

---

## What Gets Checked?

Every AI response is tested for:

1. **[CHECK] Hallucination Detection** - False claims, made-up facts
2. **[CHECK] Consistency Analysis** - Contradictions, logical errors
3. **[CHECK] Security Scan** - Prompt injection, code injection
4. **[CHECK] Privacy Check** - Emails, phones, SSNs, API keys
5. **[CHECK] Safety Review** - Harmful content, dangerous instructions

---

## Risk Levels Explained

| Level | Score | What It Means | What To Do |
|-------|-------|---------------|------------|
| **LOW** | 0-25% | [PASS] Safe to use | Show to users |
| **MODERATE** | 26-50% | [WARN] Review needed | Check before showing |
| **HIGH** | 51-75% | [FAIL] Risky | Fix before showing |
| **CRITICAL** | 76-100% | [BLOCK] Dangerous | Don't show at all |

---

## CLI Commands

```bash
# Check a file
npx llmverify --file response.txt

# Check text directly
npx llmverify "AI response here"

# Get JSON output
npx llmverify "AI response" --json

# Start server
npx llmverify-serve

# Create config file
npx llmverify init
```

---

## Configuration File

Create `llmverify.config.json`:

```json
{
  "tier": "free",
  "performance": {
    "maxContentLength": 10000,
    "timeout": 30000
  },
  "output": {
    "verbose": false
  },
  "engines": {
    "hallucination": { "enabled": true },
    "consistency": { "enabled": true },
    "csm6": {
      "enabled": true,
      "profile": "baseline",
      "checks": {
        "security": true,
        "privacy": true,
        "safety": true
      }
    }
  }
}
```

---

## Examples

See the `examples/` folder for:
- `basic-usage.js` - Simple examples
- `express-api.js` - Full API integration
- `windsurf-extension.js` - IDE integration
- `server-usage.js` - Server mode examples

---

## What This Does NOT Do

Be honest about limits:

- **Does NOT fact-check** - Can't verify if statements are true
- **Does NOT guarantee safety** - Provides risk scores, not guarantees
- **Does NOT replace humans** - Always review important content
- **Does NOT work perfectly** - Expect some false positives/negatives

---

## API Reference

### Main Functions

```javascript
// Check if input is safe
isInputSafe(text: string): boolean

// Remove personal info
redactPII(text: string): { redacted: string, found: string[] }

// Full verification
verify({ content: string, config?: Config }): Promise<VerifyResult>

// Classify content
classify(prompt: string, output: string): ClassificationResult
```

### Server Mode

```javascript
// Create IDE extension
const verifier = createIDEExtension(serverUrl?: string)

// Verify content
await verifier.verify(content: string): Promise<VerificationResult>

// Format results
verifier.formatInline(result): string
verifier.formatDetailed(result): string

// Check server
await verifier.isServerAvailable(): Promise<boolean>
```

---

## TypeScript Support

Full TypeScript definitions included:

```typescript
import { verify, VerifyResult, Config } from 'llmverify';

const result: VerifyResult = await verify({ content: "test" });
```

---

## Privacy & Security

- **No telemetry** - Zero tracking, zero data collection
- **Local-first** - Everything runs on your machine
- **No API keys** - No external services required
- **Open source** - Audit the code yourself

---

## Performance

- **Fast** - 2-10ms average response time
- **Lightweight** - <50MB memory usage
- **Efficient** - 100+ requests/second

---

## Troubleshooting

### Server won't start
```bash
# Check if port 9009 is in use
npx llmverify-serve --port=8080
```

### "Module not found"
```bash
# Rebuild
npm run build
```

### Slow responses
```bash
# Reset baseline
npx llmverify baseline:reset
```

---

## Getting Help

- **Issues**: https://github.com/subodhkc/llmverify-npm/issues
- **Docs**: https://github.com/subodhkc/llmverify-npm#readme
- **Examples**: `/examples` folder

---

## License

MIT - Use it however you want

---

## Summary

```javascript
// 1. Install
npm install llmverify

// 2. Check user input
isInputSafe(userMessage)

// 3. Remove secrets
redactPII(aiResponse)

// 4. Full check
await verify({ content: aiResponse })

// 5. Use in your app
// Done!
```

**That's it. Now your AI is safer.**
