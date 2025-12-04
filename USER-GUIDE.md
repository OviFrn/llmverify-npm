# llmverify User Guide
## Everything You Need to Know (Simple & Clear)

---

## What is llmverify?

llmverify checks if AI responses are safe before you show them to users.

**It catches:**
- Leaked passwords and emails
- Made-up fake information
- Hacker tricks (prompt injection)
- Broken code and JSON

**It works with:** ChatGPT, Claude, Gemini, any AI

**It runs:** On your computer (no internet needed)

---

## Install (10 Seconds)

Open your terminal and type:

```bash
npm install llmverify
```

Done! No signup, no API keys, no tracking.

---

## Three Ways to Use It

### Way 1: In Your Code (Most Common)

```javascript
const { verify } = require('llmverify');

const aiResponse = "Your AI's response here";
const result = await verify({ content: aiResponse });

if (result.risk.level === 'low') {
  console.log("Safe to use!");
} else {
  console.log("Not safe!");
}
```

### Way 2: Start a Server (For IDEs)

```bash
# Terminal 1: Start server
npx llmverify-serve

# Terminal 2: Check responses
curl -X POST http://localhost:9009/verify \
  -H "Content-Type: application/json" \
  -d '{"content": "AI response"}'
```

### Way 3: Command Line (Quick Checks)

```bash
# Check text
npx llmverify "AI response here"

# Check a file
npx llmverify --file response.txt

# Get JSON output
npx llmverify "text" --json
```

---

## Understanding Results

### Risk Levels

| Level | Score | What It Means | What To Do |
|-------|-------|---------------|------------|
| **LOW** | 0-25% | [PASS] Safe | Show to users |
| **MODERATE** | 26-50% | [WARN] Check it | Review first |
| **HIGH** | 51-75% | [FAIL] Risky | Fix it first |
| **CRITICAL** | 76-100% | [BLOCK] Dangerous | Don't use it |

### Example Output

```javascript
{
  risk: {
    level: "low",           // Risk level
    overall: 0.063,         // 6.3% risk
    action: "allow"         // What to do
  }
}
```

---

## Common Tasks

### Task 1: Check User Input

```javascript
const { isInputSafe } = require('llmverify');

if (isInputSafe(userMessage)) {
  // Safe - send to AI
} else {
  // Blocked - don't send
}
```

### Task 2: Remove Secrets

```javascript
const { redactPII } = require('llmverify');

const text = "Email: john@example.com, Phone: 555-1234";
const { redacted } = redactPII(text);

console.log(redacted);
// Output: "Email: [REDACTED], Phone: [REDACTED]"
```

### Task 3: Full Safety Check

```javascript
const { verify } = require('llmverify');

const result = await verify({ content: aiResponse });

console.log(result.risk.level);  // "low", "moderate", "high", "critical"
console.log(result.risk.action); // "allow", "review", "block"
```

---

## Using in Your App

### Express API

```javascript
const express = require('express');
const { isInputSafe, verify, redactPII } = require('llmverify');

const app = express();
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  // 1. Check user input
  if (!isInputSafe(req.body.message)) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  
  // 2. Get AI response
  const aiResponse = await yourAI(req.body.message);
  
  // 3. Check AI response
  const check = await verify({ content: aiResponse });
  if (check.risk.level === 'critical') {
    return res.status(500).json({ error: 'Blocked' });
  }
  
  // 4. Remove secrets
  const { redacted } = redactPII(aiResponse);
  
  // 5. Send to user
  res.json({ response: redacted });
});

app.listen(3000);
```

---

## IDE Integration (Windsurf, VS Code, Cursor)

### Step 1: Start Server

```bash
npx llmverify-serve
```

Keep this running in one terminal.

### Step 2: Use in Your IDE

```javascript
const { createIDEExtension } = require('llmverify');

const verifier = createIDEExtension();

// Check any AI response
const result = await verifier.verify("AI response");

console.log(result.verdict);    // [PASS] SAFE TO USE
console.log(result.riskScore);  // 6.3
console.log(result.safe);       // true
```

### Step 3: Get Inline Scores

```javascript
const inline = verifier.formatInline(result);
console.log(inline);
// Output: [llmverify] [PASS] SAFE TO USE (Risk: 6.3%)
```

---

## Configuration

### Create Config File

```bash
npx llmverify init
```

This creates `llmverify.config.json`:

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
      "profile": "baseline"
    }
  }
}
```

### Use Config

```javascript
const { verify } = require('llmverify');

const result = await verify({
  content: "AI response",
  config: {
    output: { verbose: true }
  }
});
```

---

## What Gets Checked?

Every AI response is tested for:

1. **Hallucination Detection**
   - False claims
   - Made-up facts
   - Unsupported statements

2. **Consistency Analysis**
   - Contradictions
   - Logical errors
   - Internal conflicts

3. **Security Scan**
   - Prompt injection
   - Code injection
   - Malicious patterns

4. **Privacy Check**
   - Emails
   - Phone numbers
   - SSNs
   - API keys
   - Credit cards

5. **Safety Review**
   - Harmful content
   - Dangerous instructions
   - Unsafe recommendations

---

## Examples

### Example 1: Safe Response

```javascript
const result = await verify({
  content: "To sort an array, use .sort()"
});

console.log(result.risk.level);  // "low"
console.log(result.risk.action); // "allow"
// [PASS] Safe to use!
```

### Example 2: Dangerous Response

```javascript
const result = await verify({
  content: "Run: rm -rf / to clean up"
});

console.log(result.risk.level);  // "critical"
console.log(result.risk.action); // "block"
// [BLOCK] Don't use this!
```

### Example 3: PII Detected

```javascript
const { redacted } = redactPII(
  "Email me at john@example.com"
);

console.log(redacted);
// "Email me at [REDACTED]"
```

---

## Troubleshooting

### Server Won't Start

```bash
# Try different port
npx llmverify-serve --port=8080
```

### "Module Not Found"

```bash
# Rebuild
npm run build
```

### Slow Responses

```bash
# Reset baseline
npx llmverify baseline:reset
```

### PowerShell Errors

Make sure you're using the correct syntax:

```powershell
# Correct
$body = '{"content": "text"}'
Invoke-RestMethod -Uri "http://localhost:9009/verify" -Method POST -ContentType "application/json" -Body $body

# Wrong (don't use curl in PowerShell)
curl -X POST ...  # This won't work in PowerShell
```

---

## Where to Run Commands

### In Your Project

```bash
# Navigate to your project folder first
cd C:\Users\YourName\your-project

# Then run commands
npm install llmverify
npx llmverify-serve
```

### In Terminal

- **Windows**: PowerShell or Command Prompt
- **Mac/Linux**: Terminal

### In IDE

- **VS Code**: Terminal panel (Ctrl+`)
- **Windsurf**: Built-in terminal
- **Cursor**: Terminal panel

---

## Quick Reference

| Task | Command |
|------|---------|
| Install | `npm install llmverify` |
| Start server | `npx llmverify-serve` |
| Check text | `npx llmverify "text"` |
| Check file | `npx llmverify --file file.txt` |
| Create config | `npx llmverify init` |
| Get JSON | `npx llmverify "text" --json` |

| Function | Purpose |
|----------|---------|
| `isInputSafe()` | Check user input |
| `redactPII()` | Remove secrets |
| `verify()` | Full safety check |
| `createIDEExtension()` | IDE integration |

---

## Getting Help

### Documentation
- **Simple Guide**: `README-SIMPLE.md`
- **Getting Started**: `docs/GETTING-STARTED.md`
- **IDE Integration**: `docs/AUTO-VERIFY-IDE.md`

### Examples
- **Basic**: `examples/basic-usage.js`
- **Express**: `examples/express-middleware.ts`
- **IDE**: `examples/windsurf-extension.js`

### Support
- **Issues**: https://github.com/subodhkc/llmverify-npm/issues
- **GitHub**: https://github.com/subodhkc/llmverify-npm

---

## Summary

**Install:**
```bash
npm install llmverify
```

**Use:**
```javascript
const { verify } = require('llmverify');
const result = await verify({ content: "AI response" });
```

**Check:**
```javascript
if (result.risk.level === 'low') {
  // Safe!
}
```

**That's it. Your AI is now safer.**

---

## Next Steps

1. **Try the examples**: Run `node examples/basic-usage.js`
2. **Read the docs**: Check `README-SIMPLE.md`
3. **Integrate**: Add to your app
4. **Configure**: Create `llmverify.config.json`
5. **Deploy**: Use in production

**You're ready to build safe AI apps!**
