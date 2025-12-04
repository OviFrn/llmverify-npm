/**
 * Windsurf IDE Extension for llmverify
 * Automatically verifies AI responses and displays scores
 */

const vscode = require('vscode');
const http = require('http');

let verificationPanel = null;
let serverUrl = 'http://localhost:9009';
let isServerAvailable = false;

/**
 * Check if llmverify server is running
 */
async function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`${serverUrl}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Verify AI response
 */
async function verifyResponse(content) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ content });
    
    const options = {
      hostname: 'localhost',
      port: 9009,
      path: '/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Format verification result for display
 */
function formatVerification(result) {
  const { summary, result: verifyResult } = result;
  const risk = verifyResult.risk;
  
  const riskColor = {
    low: '#28a745',
    moderate: '#ffc107',
    high: '#fd7e14',
    critical: '#dc3545'
  }[risk.level] || '#6c757d';

  return `
    <div style="
      padding: 12px;
      margin: 8px 0;
      border-left: 4px solid ${riskColor};
      background: rgba(0,0,0,0.05);
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong style="color: ${riskColor}; font-size: 14px;">
          ${summary.verdict}
        </strong>
        <span style="
          background: ${riskColor};
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        ">
          Risk: ${summary.riskScore}
        </span>
      </div>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
        ${summary.explanation}
      </div>
      ${summary.findings.length > 0 ? `
        <div style="font-size: 11px; color: #dc3545; margin-top: 8px;">
          <strong>Findings:</strong>
          <ul style="margin: 4px 0; padding-left: 20px;">
            ${summary.findings.map(f => `<li>${f.message || f}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      <div style="font-size: 10px; color: #999; margin-top: 8px;">
        Verified by llmverify • ${new Date().toLocaleTimeString()}
      </div>
    </div>
  `;
}

/**
 * Create or update verification panel
 */
function createVerificationPanel(context) {
  if (!verificationPanel) {
    verificationPanel = vscode.window.createWebviewPanel(
      'llmverifyPanel',
      'AI Verification',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    verificationPanel.onDidDispose(() => {
      verificationPanel = null;
    });
  }

  return verificationPanel;
}

/**
 * Update verification panel with new result
 */
function updateVerificationPanel(result) {
  if (!verificationPanel) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Verification</title>
      <style>
        body {
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e0e0e0;
        }
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .status.active {
          background: #28a745;
          color: white;
        }
        .status.inactive {
          background: #dc3545;
          color: white;
        }
        .verification-list {
          max-height: calc(100vh - 120px);
          overflow-y: auto;
        }
        .empty-state {
          text-align: center;
          padding: 48px 16px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin: 0;">AI Verification</h2>
        <span class="status ${isServerAvailable ? 'active' : 'inactive'}">
          ${isServerAvailable ? 'Server Active' : 'Server Offline'}
        </span>
      </div>
      <div class="verification-list" id="verifications">
        ${result ? formatVerification(result) : `
          <div class="empty-state">
            <p>Waiting for AI responses to verify...</p>
            <p style="font-size: 12px;">llmverify will automatically check each response</p>
          </div>
        `}
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        
        window.addEventListener('message', event => {
          const message = event.data;
          if (message.type === 'verification') {
            const container = document.getElementById('verifications');
            const emptyState = container.querySelector('.empty-state');
            if (emptyState) {
              container.innerHTML = '';
            }
            container.insertAdjacentHTML('afterbegin', message.html);
          }
        });
      </script>
    </body>
    </html>
  `;

  verificationPanel.webview.html = html;
}

/**
 * Intercept AI responses and verify them
 */
async function interceptAIResponse(response) {
  if (!isServerAvailable) {
    console.log('[llmverify] Server not available, skipping verification');
    return;
  }

  try {
    const result = await verifyResponse(response);
    
    // Create panel if it doesn't exist
    const panel = createVerificationPanel();
    
    // Update panel with new verification
    const html = formatVerification(result);
    panel.webview.postMessage({
      type: 'verification',
      html: html
    });

    // Show notification for high-risk responses
    if (result.result.risk.level === 'high' || result.result.risk.level === 'critical') {
      vscode.window.showWarningMessage(
        `llmverify: ${result.summary.verdict}`,
        'View Details'
      ).then(selection => {
        if (selection === 'View Details') {
          panel.reveal(vscode.ViewColumn.Beside);
        }
      });
    }
  } catch (error) {
    console.error('[llmverify] Verification failed:', error);
  }
}

/**
 * Activate extension
 */
function activate(context) {
  console.log('[llmverify] Extension activating...');

  // Check server availability
  checkServer().then(available => {
    isServerAvailable = available;
    if (available) {
      console.log('[llmverify] Server detected at', serverUrl);
      vscode.window.showInformationMessage('llmverify: Server connected');
    } else {
      console.log('[llmverify] Server not available');
      vscode.window.showWarningMessage(
        'llmverify: Server not running. Start with: npm run serve',
        'Start Server'
      ).then(selection => {
        if (selection === 'Start Server') {
          const terminal = vscode.window.createTerminal('llmverify');
          terminal.show();
          terminal.sendText('npm run serve');
        }
      });
    }
  });

  // Register commands
  const showPanelCommand = vscode.commands.registerCommand(
    'llmverify.showPanel',
    () => {
      const panel = createVerificationPanel(context);
      updateVerificationPanel(null);
      panel.reveal(vscode.ViewColumn.Beside);
    }
  );

  const verifySelectionCommand = vscode.commands.registerCommand(
    'llmverify.verifySelection',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No text selected');
        return;
      }

      const selection = editor.selection;
      const text = editor.document.getText(selection);

      if (!text) {
        vscode.window.showErrorMessage('No text selected');
        return;
      }

      await interceptAIResponse(text);
    }
  );

  const checkServerCommand = vscode.commands.registerCommand(
    'llmverify.checkServer',
    async () => {
      const available = await checkServer();
      isServerAvailable = available;
      
      if (available) {
        vscode.window.showInformationMessage('llmverify: Server is running');
      } else {
        vscode.window.showWarningMessage('llmverify: Server is not running');
      }
    }
  );

  context.subscriptions.push(showPanelCommand);
  context.subscriptions.push(verifySelectionCommand);
  context.subscriptions.push(checkServerCommand);

  // Monitor AI chat responses (Windsurf-specific)
  // This hooks into Windsurf's AI chat to automatically verify responses
  if (vscode.workspace.getConfiguration('llmverify').get('autoVerify', true)) {
    // TODO: Hook into Windsurf's AI response stream
    // This requires Windsurf API access
    console.log('[llmverify] Auto-verification enabled');
  }
}

/**
 * Deactivate extension
 */
function deactivate() {
  if (verificationPanel) {
    verificationPanel.dispose();
  }
}

module.exports = {
  activate,
  deactivate
};
