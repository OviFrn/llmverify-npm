# llmverify - AI Output Verification for VS Code

Verify AI responses for safety, hallucinations, PII, and security vulnerabilities directly in VS Code.

Works with ChatGPT, Claude, Copilot, Cursor, and any AI assistant.

---

## Features

- **Verify Selected Text** - Select any AI response and verify it instantly
- **Verify Clipboard** - Verify content from your clipboard
- **Real-time Results** - See verification results in a dedicated panel
- **Risk Notifications** - Get alerts for high-risk content
- **Server Management** - Start/stop the llmverify server from VS Code

---

## Quick Start

### 1. Install the Extension

Search for "llmverify" in the VS Code Extensions marketplace.

### 2. Start the Server

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and run:
```
llmverify: Start Server
```

Or run in terminal:
```bash
npx llmverify-serve
```

### 3. Verify AI Responses

- **Select text** in the editor
- Press `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac)
- Or right-click and select "Verify Selected Text"

---

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `llmverify: Verify Selected Text` | `Ctrl+Shift+V` | Verify selected text |
| `llmverify: Verify Clipboard Content` | `Ctrl+Alt+V` | Verify clipboard |
| `llmverify: Show Verification Panel` | `Ctrl+Shift+L` | Open results panel |
| `llmverify: Start Server` | - | Start llmverify server |
| `llmverify: Stop Server` | - | Stop llmverify server |
| `llmverify: Check Server Status` | - | Check if server is running |

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `llmverify.serverUrl` | `http://localhost:9009` | Server URL |
| `llmverify.autoStart` | `false` | Auto-start server on activation |
| `llmverify.showNotifications` | `true` | Show notifications for risky content |
| `llmverify.riskThreshold` | `high` | Minimum risk level for notifications |

---

## What Gets Verified

llmverify checks AI responses for:

- **Hallucinations** - Factual inconsistencies and made-up information
- **PII** - Personal identifiable information (SSN, emails, phone numbers)
- **Security** - SQL injection, command injection, prompt injection
- **Harmful Content** - Dangerous commands, malicious code
- **Consistency** - Internal contradictions

---

## Risk Levels

| Level | Color | Description |
|-------|-------|-------------|
| Low | Green | Safe to use |
| Moderate | Yellow | Review recommended |
| High | Orange | Caution advised |
| Critical | Red | Do not use without review |

---

## Privacy

- **100% Local** - All verification runs on your machine
- **Zero Telemetry** - No data sent anywhere
- **No API Keys** - Works offline

---

## Requirements

- Node.js 18 or higher
- llmverify npm package (installed automatically)

---

## Troubleshooting

### Server Not Starting

```bash
# Install llmverify globally
npm install -g llmverify

# Start server manually
llmverify-serve
```

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :9009
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:9009 | xargs kill -9
```

### Extension Not Working

1. Check server status in status bar
2. Run "llmverify: Check Server Status"
3. Restart VS Code

---

## Links

- [GitHub](https://github.com/subodhkc/llmverify-npm)
- [npm Package](https://www.npmjs.com/package/llmverify)
- [Documentation](https://github.com/subodhkc/llmverify-npm/tree/main/docs)

---

## License

MIT
