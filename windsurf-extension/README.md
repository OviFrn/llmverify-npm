# llmverify Windsurf Extension

Automatically verify AI responses in Windsurf IDE for safety, hallucinations, PII, and security issues.

## Features

- **Automatic Verification**: Every AI response is automatically checked
- **Real-time Scoring**: See risk scores as responses are generated
- **Visual Panel**: Dedicated panel showing verification history
- **Notifications**: Alerts for high-risk responses
- **Manual Verification**: Verify any selected text

## Installation

### Method 1: From Source (Development)

1. Ensure llmverify server is running:
   ```bash
   cd /path/to/llmverify-npm
   npm run serve
   ```

2. Install the extension in Windsurf:
   ```bash
   cd windsurf-extension
   code --install-extension .
   ```

### Method 2: Manual Installation

1. Copy the `windsurf-extension` folder to Windsurf extensions directory:
   - Windows: `%USERPROFILE%\.windsurf\extensions\`
   - macOS: `~/.windsurf/extensions/`
   - Linux: `~/.windsurf/extensions/`

2. Restart Windsurf

3. Start llmverify server:
   ```bash
   npm run serve
   ```

## Usage

### Automatic Verification

Once installed and the server is running, the extension automatically verifies all AI responses in the chat.

### View Verification Panel

- Press `Ctrl+Shift+L` (Windows/Linux) or `Cmd+Shift+L` (macOS)
- Or run command: `llmverify: Show Verification Panel`

### Verify Selected Text

1. Select any text in the editor
2. Press `Ctrl+Shift+V` (Windows/Linux) or `Cmd+Shift+V` (macOS)
3. Or run command: `llmverify: Verify Selected Text`

### Check Server Status

Run command: `llmverify: Check Server Status`

## Configuration

Open Settings (`Ctrl+,`) and search for "llmverify":

- **Auto Verify**: Automatically verify AI responses (default: true)
- **Server URL**: llmverify server URL (default: http://localhost:9009)
- **Show Notifications**: Show alerts for high-risk responses (default: true)

## Verification Panel

The verification panel shows:

- **Verdict**: [PASS], [WARN], [FAIL], or [BLOCK]
- **Risk Score**: Percentage (0-100%)
- **Explanation**: Why the content was flagged
- **Findings**: Specific issues detected
- **Timestamp**: When verification occurred

### Risk Levels

- **LOW (0-25%)**: Safe to use
- **MODERATE (26-50%)**: Review recommended
- **HIGH (51-75%)**: Fix before using
- **CRITICAL (76-100%)**: Do not use

## Requirements

- llmverify server must be running on port 9009
- Node.js 18+ installed
- llmverify npm package installed

## Troubleshooting

### "Server not running" error

Start the server:
```bash
npm run serve
```

### Extension not activating

1. Check Windsurf extension logs
2. Verify extension is installed: `Extensions > llmverify`
3. Restart Windsurf

### No verification scores showing

1. Check server is running: `llmverify: Check Server Status`
2. Verify server URL in settings
3. Check firewall isn't blocking localhost:9009

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Show Verification Panel | `Ctrl+Shift+L` | Open verification history |
| Verify Selected Text | `Ctrl+Shift+V` | Verify highlighted text |
| Check Server Status | - | Check if server is running |

## Support

- GitHub: https://github.com/subodhkc/llmverify-npm
- Issues: https://github.com/subodhkc/llmverify-npm/issues
- NPM: https://www.npmjs.com/package/llmverify

## License

MIT
