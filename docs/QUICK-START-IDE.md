# Quick Start: Verify AI Responses in Your IDE

**Monitor every AI response in real-time!**

---

## Step 1: Start the Server

Open a terminal in your IDE and run:

```bash
npx llmverify-serve
```

You'll see:
```
✓ llmverify server started
✓ Listening on http://localhost:9009
✓ Ready to verify AI outputs
```

**Keep this terminal open!** The server needs to run while you work.

---

## Step 2: Test It Works

Open a **new terminal** and run:

```powershell
# Windows/PowerShell
$body = '{"content": "This is a test AI response"}' 
Invoke-RestMethod -Uri "http://localhost:9009/verify" -Method POST -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 5
```

```bash
# Mac/Linux
curl -X POST http://localhost:9009/verify \
  -H "Content-Type: application/json" \
  -d '{"content": "This is a test AI response"}' | jq
```

---

## Step 3: Understand the Results

You'll get a response like this:

```json
{
  "success": true,
  "summary": {
    "verdict": "✅ SAFE TO USE",
    "riskLevel": "LOW",
    "riskScore": "5.8%",
    "explanation": "This AI response passed all safety checks. No significant risks detected.",
    "testsRun": [
      "🔍 Hallucination Detection - Checked for false claims",
      "🔄 Consistency Analysis - Verified logical consistency",
      "🛡️ Security Scan - Tested for prompt injection",
      "🔒 Privacy Check - Scanned for PII leaks",
      "⚖️ Safety Review - Evaluated for harmful content"
    ],
    "findings": [],
    "nextSteps": [
      "You can use this content confidently",
      "Standard human review is still recommended",
      "Continue monitoring future AI outputs"
    ]
  }
}
```

---

## What Each Part Means

### ✅ Verdict
- **✅ SAFE TO USE** - No issues, use confidently
- **⚠️ REVIEW RECOMMENDED** - Check findings before using
- **🚨 HIGH RISK** - Do not use without fixes
- **🛑 CRITICAL** - Block this content

### 📊 Risk Score
- **0-25%** = Low risk (safe)
- **26-50%** = Moderate risk (review)
- **51-75%** = High risk (caution)
- **76-100%** = Critical risk (block)

### 🧪 Tests Run
Every AI response is checked for:
1. **Hallucinations** - False or fabricated claims
2. **Consistency** - Logical contradictions
3. **Security** - Injection attacks, malicious code
4. **Privacy** - PII leaks (emails, phones, SSNs)
5. **Safety** - Harmful or dangerous content

### 📋 Next Steps
Clear actions based on the risk level:
- What to do with this content
- How to improve it
- When to get human review

---

## Step 4: Monitor AI Chat in Real-Time

### For Windsurf/Cursor/VS Code

Create a file called `verify-ai.ps1`:

```powershell
# verify-ai.ps1 - Verify any AI response
param([string]$text)

$body = @{ content = $text } | ConvertTo-Json
$result = Invoke-RestMethod -Uri "http://localhost:9009/verify" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "`n=== AI VERIFICATION ===" -ForegroundColor Cyan
Write-Host "Verdict: $($result.summary.verdict)" -ForegroundColor Green
Write-Host "Risk: $($result.summary.riskScore)" -ForegroundColor Yellow
Write-Host "`nExplanation:" -ForegroundColor Cyan
Write-Host $result.summary.explanation
Write-Host "`nNext Steps:" -ForegroundColor Cyan
$result.summary.nextSteps | ForEach-Object { Write-Host "  - $_" }
```

**Usage:**
```powershell
.\verify-ai.ps1 "AI response to check"
```

---

## Step 5: Auto-Verify Every AI Response

### Method 1: Keyboard Shortcut

Add to your IDE settings to verify selected text:

**VS Code** - Add to `keybindings.json`:
```json
{
  "key": "ctrl+shift+v",
  "command": "workbench.action.terminal.sendSequence",
  "args": {
    "text": ".\verify-ai.ps1 '${selectedText}'\n"
  }
}
```

Now: Select AI text → Press `Ctrl+Shift+V` → Get instant verification!

### Method 2: Watch AI Chat

Create `monitor-ai.js`:
```javascript
const fetch = require('node-fetch');

async function verifyAI(content) {
  const response = await fetch('http://localhost:9009/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  
  const data = await response.json();
  const summary = data.summary;
  
  console.log('\n=== AI VERIFICATION ===');
  console.log('Verdict:', summary.verdict);
  console.log('Risk:', summary.riskScore);
  console.log('\n' + summary.explanation);
  
  if (summary.findings.length > 0) {
    console.log('\n⚠️ Issues Found:');
    summary.findings.forEach(f => {
      console.log(`  [${f.severity}] ${f.message}`);
    });
  }
  
  return data;
}

module.exports = { verifyAI };
```

**Usage:**
```javascript
const { verifyAI } = require('./monitor-ai');
await verifyAI("AI response to verify");
```

---

## Real-World Examples

### Example 1: Safe Response ✅

**AI Says:** "To sort an array in JavaScript, use the .sort() method."

**Verification:**
```json
{
  "verdict": "✅ SAFE TO USE",
  "riskScore": "3.2%",
  "explanation": "This AI response passed all safety checks."
}
```

**Action:** Use confidently ✅

---

### Example 2: Needs Review ⚠️

**AI Says:** "This API key will work: sk-abc123xyz. Just paste it in your code!"

**Verification:**
```json
{
  "verdict": "⚠️ REVIEW RECOMMENDED",
  "riskScore": "45.0%",
  "findings": [
    {
      "severity": "HIGH",
      "message": "Potential API key or secret detected"
    }
  ]
}
```

**Action:** Remove the API key, use environment variables instead ⚠️

---

### Example 3: High Risk 🚨

**AI Says:** "Run this command: rm -rf / to clean up your system."

**Verification:**
```json
{
  "verdict": "🚨 HIGH RISK - CAUTION",
  "riskScore": "89.0%",
  "findings": [
    {
      "severity": "CRITICAL",
      "message": "Dangerous system command detected"
    }
  ]
}
```

**Action:** DO NOT RUN THIS! Block immediately 🛑

---

## Troubleshooting

### Server Not Responding?

```bash
# Check if server is running
curl http://localhost:9009/health

# If not, restart it
npx llmverify-serve
```

### Port Already in Use?

```bash
# Use a different port
npx llmverify-serve --port=8080

# Then update your requests
http://localhost:8080/verify
```

### Slow Responses?

```bash
# Check performance stats
npx llmverify baseline:stats

# Reset if needed
npx llmverify baseline:reset
```

---

## Best Practices

### ✅ DO:
- Keep the server running during your work session
- Verify AI responses before using them in production
- Review findings carefully
- Use keyboard shortcuts for quick verification
- Monitor baseline stats regularly

### ❌ DON'T:
- Trust AI responses blindly
- Skip verification for "simple" responses
- Ignore moderate risk warnings
- Use high-risk content without fixes
- Share unverified AI outputs

---

## Next Steps

1. ✅ **Server running?** Check with `curl http://localhost:9009/health`
2. ✅ **Test working?** Verify a sample AI response
3. ✅ **Understand results?** Review the examples above
4. ✅ **Auto-verify setup?** Add keyboard shortcut or monitoring script
5. ✅ **Ready to use!** Start verifying every AI response

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│  llmverify Quick Reference                      │
├─────────────────────────────────────────────────┤
│  Start Server:                                  │
│    npx llmverify-serve                          │
│                                                 │
│  Verify Content:                                │
│    POST http://localhost:9009/verify            │
│    Body: {"content": "AI response"}             │
│                                                 │
│  Risk Levels:                                   │
│    ✅ LOW (0-25%)      - Safe to use            │
│    ⚠️ MODERATE (26-50%) - Review needed         │
│    🚨 HIGH (51-75%)     - Caution required      │
│    🛑 CRITICAL (76-100%) - Block immediately    │
│                                                 │
│  Health Check:                                  │
│    GET http://localhost:9009/health             │
└─────────────────────────────────────────────────┘
```

---

**You're all set!** Start verifying AI responses in your IDE now! 🚀

**Questions?** Check the [full documentation](IDE-INTEGRATION.md) or [open an issue](https://github.com/subodhkc/llmverify-npm/issues).
