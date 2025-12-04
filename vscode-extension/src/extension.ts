/**
 * llmverify VS Code Extension
 * Verify AI responses for safety, hallucinations, PII, and security
 */

import * as vscode from 'vscode';
import * as http from 'http';

let verificationPanel: vscode.WebviewPanel | undefined;
let serverTerminal: vscode.Terminal | undefined;
let statusBarItem: vscode.StatusBarItem;

interface VerificationResult {
  success: boolean;
  summary: {
    verdict: string;
    riskScore: number;
    explanation: string;
    findings: Array<{ message: string; type: string; severity: string }>;
  };
  result: {
    risk: {
      level: 'low' | 'moderate' | 'high' | 'critical';
      score: number;
      action: string;
    };
  };
}

/**
 * Get server URL from configuration
 */
function getServerUrl(): string {
  return vscode.workspace.getConfiguration('llmverify').get('serverUrl', 'http://localhost:9009');
}

/**
 * Check if llmverify server is running
 */
async function checkServer(): Promise<boolean> {
  const serverUrl = getServerUrl();
  
  return new Promise((resolve) => {
    const url = new URL(serverUrl);
    const req = http.get({
      hostname: url.hostname,
      port: url.port || 9009,
      path: '/health',
      timeout: 2000
    }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Verify content via server
 */
async function verifyContent(content: string): Promise<VerificationResult> {
  const serverUrl = getServerUrl();
  const url = new URL(serverUrl);
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ content });
    
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 9009,
      path: '/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 30000
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Invalid response from server'));
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(data);
    req.end();
  });
}

/**
 * Update status bar
 */
function updateStatusBar(isConnected: boolean): void {
  if (isConnected) {
    statusBarItem.text = '$(shield) llmverify';
    statusBarItem.tooltip = 'llmverify: Server connected';
    statusBarItem.backgroundColor = undefined;
  } else {
    statusBarItem.text = '$(shield) llmverify (offline)';
    statusBarItem.tooltip = 'llmverify: Server not running. Click to start.';
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  }
}

/**
 * Get risk color
 */
function getRiskColor(level: string): string {
  const colors: Record<string, string> = {
    low: '#28a745',
    moderate: '#ffc107',
    high: '#fd7e14',
    critical: '#dc3545'
  };
  return colors[level] || '#6c757d';
}

/**
 * Format verification result as HTML
 */
function formatResultHtml(result: VerificationResult): string {
  const { summary, result: verifyResult } = result;
  const risk = verifyResult.risk;
  const riskColor = getRiskColor(risk.level);
  
  return `
    <div class="result" style="
      padding: 16px;
      margin: 12px 0;
      border-left: 4px solid ${riskColor};
      background: var(--vscode-editor-background);
      border-radius: 4px;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <strong style="color: ${riskColor}; font-size: 16px;">
          ${summary.verdict}
        </strong>
        <span style="
          background: ${riskColor};
          color: white;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
        ">
          ${risk.level.toUpperCase()} (${summary.riskScore})
        </span>
      </div>
      
      <div style="color: var(--vscode-foreground); margin-bottom: 12px;">
        ${summary.explanation}
      </div>
      
      ${summary.findings.length > 0 ? `
        <div style="margin-top: 12px; padding: 12px; background: rgba(220, 53, 69, 0.1); border-radius: 4px;">
          <strong style="color: #dc3545;">Findings (${summary.findings.length}):</strong>
          <ul style="margin: 8px 0 0 0; padding-left: 20px;">
            ${summary.findings.map(f => `
              <li style="margin: 4px 0;">
                <span style="color: ${getRiskColor(f.severity)};">[${f.severity.toUpperCase()}]</span>
                ${f.message}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      <div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 12px;">
        Action: ${risk.action} | Verified at ${new Date().toLocaleTimeString()}
      </div>
    </div>
  `;
}

/**
 * Create verification panel
 */
function createPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
  if (verificationPanel) {
    verificationPanel.reveal(vscode.ViewColumn.Beside);
    return verificationPanel;
  }
  
  verificationPanel = vscode.window.createWebviewPanel(
    'llmverifyPanel',
    'llmverify - AI Verification',
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );
  
  verificationPanel.onDidDispose(() => {
    verificationPanel = undefined;
  });
  
  updatePanelHtml();
  
  return verificationPanel;
}

/**
 * Update panel HTML
 */
function updatePanelHtml(result?: VerificationResult): void {
  if (!verificationPanel) return;
  
  verificationPanel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>llmverify</title>
      <style>
        body {
          padding: 16px;
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          background: var(--vscode-editor-background);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--vscode-panel-border);
          margin-bottom: 16px;
        }
        h2 { margin: 0; }
        .status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .status.connected { background: #28a745; color: white; }
        .status.disconnected { background: #dc3545; color: white; }
        .empty {
          text-align: center;
          padding: 48px;
          color: var(--vscode-descriptionForeground);
        }
        .instructions {
          background: var(--vscode-textBlockQuote-background);
          padding: 16px;
          border-radius: 4px;
          margin-top: 16px;
        }
        .instructions h4 { margin-top: 0; }
        code {
          background: var(--vscode-textCodeBlock-background);
          padding: 2px 6px;
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>llmverify</h2>
        <span class="status connected" id="status">Connected</span>
      </div>
      
      <div id="results">
        ${result ? formatResultHtml(result) : `
          <div class="empty">
            <p>No verifications yet</p>
            <div class="instructions">
              <h4>How to verify AI responses:</h4>
              <ol>
                <li>Select text in the editor</li>
                <li>Press <code>Ctrl+Shift+V</code> (or <code>Cmd+Shift+V</code> on Mac)</li>
                <li>Or right-click and select "Verify Selected Text"</li>
              </ol>
              <p>You can also verify clipboard content with <code>Ctrl+Alt+V</code></p>
            </div>
          </div>
        `}
      </div>
    </body>
    </html>
  `;
}

/**
 * Show verification result
 */
async function showVerificationResult(content: string, context: vscode.ExtensionContext): Promise<void> {
  // Check server first
  const isConnected = await checkServer();
  if (!isConnected) {
    const action = await vscode.window.showWarningMessage(
      'llmverify server is not running',
      'Start Server',
      'Cancel'
    );
    if (action === 'Start Server') {
      vscode.commands.executeCommand('llmverify.startServer');
    }
    return;
  }
  
  // Show progress
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Verifying content...',
    cancellable: false
  }, async () => {
    try {
      const result = await verifyContent(content);
      
      // Create/update panel
      createPanel(context);
      updatePanelHtml(result);
      
      // Show notification for high-risk content
      const config = vscode.workspace.getConfiguration('llmverify');
      const showNotifications = config.get('showNotifications', true);
      const threshold = config.get('riskThreshold', 'high');
      
      const riskLevels = ['low', 'moderate', 'high', 'critical'];
      const thresholdIndex = riskLevels.indexOf(threshold);
      const resultIndex = riskLevels.indexOf(result.result.risk.level);
      
      if (showNotifications && resultIndex >= thresholdIndex) {
        const action = await vscode.window.showWarningMessage(
          `llmverify: ${result.summary.verdict}`,
          'View Details'
        );
        if (action === 'View Details') {
          verificationPanel?.reveal(vscode.ViewColumn.Beside);
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Verification failed: ${error}`);
    }
  });
}

/**
 * Activate extension
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('[llmverify] Extension activating...');
  
  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'llmverify.checkServer';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
  
  // Check server on startup
  checkServer().then(isConnected => {
    updateStatusBar(isConnected);
    
    // Auto-start server if configured
    const config = vscode.workspace.getConfiguration('llmverify');
    if (!isConnected && config.get('autoStart', false)) {
      vscode.commands.executeCommand('llmverify.startServer');
    }
  });
  
  // Periodic server check
  const interval = setInterval(async () => {
    const isConnected = await checkServer();
    updateStatusBar(isConnected);
  }, 30000);
  
  context.subscriptions.push({ dispose: () => clearInterval(interval) });
  
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('llmverify.verifySelection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }
      
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      
      if (!text) {
        vscode.window.showErrorMessage('No text selected');
        return;
      }
      
      await showVerificationResult(text, context);
    }),
    
    vscode.commands.registerCommand('llmverify.verifyClipboard', async () => {
      const text = await vscode.env.clipboard.readText();
      
      if (!text) {
        vscode.window.showErrorMessage('Clipboard is empty');
        return;
      }
      
      await showVerificationResult(text, context);
    }),
    
    vscode.commands.registerCommand('llmverify.showPanel', () => {
      createPanel(context);
    }),
    
    vscode.commands.registerCommand('llmverify.startServer', () => {
      if (serverTerminal) {
        serverTerminal.dispose();
      }
      
      serverTerminal = vscode.window.createTerminal('llmverify Server');
      serverTerminal.show();
      serverTerminal.sendText('npx llmverify-serve');
      
      // Check server after a delay
      setTimeout(async () => {
        const isConnected = await checkServer();
        updateStatusBar(isConnected);
        if (isConnected) {
          vscode.window.showInformationMessage('llmverify server started');
        }
      }, 3000);
    }),
    
    vscode.commands.registerCommand('llmverify.stopServer', () => {
      if (serverTerminal) {
        serverTerminal.dispose();
        serverTerminal = undefined;
        updateStatusBar(false);
        vscode.window.showInformationMessage('llmverify server stopped');
      }
    }),
    
    vscode.commands.registerCommand('llmverify.checkServer', async () => {
      const isConnected = await checkServer();
      updateStatusBar(isConnected);
      
      if (isConnected) {
        vscode.window.showInformationMessage('llmverify: Server is running');
      } else {
        const action = await vscode.window.showWarningMessage(
          'llmverify: Server is not running',
          'Start Server'
        );
        if (action === 'Start Server') {
          vscode.commands.executeCommand('llmverify.startServer');
        }
      }
    })
  );
  
  console.log('[llmverify] Extension activated');
}

/**
 * Deactivate extension
 */
export function deactivate(): void {
  if (verificationPanel) {
    verificationPanel.dispose();
  }
  if (serverTerminal) {
    serverTerminal.dispose();
  }
}
