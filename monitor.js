#!/usr/bin/env node

/**
 * llmverify Chat Monitor
 * Monitors clipboard and verifies AI responses automatically
 */

const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SERVER_URL = 'http://localhost:9009';
let lastClipboard = '';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkServer() {
  return new Promise((resolve) => {
    http.get(`${SERVER_URL}/health`, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

async function verifyContent(content) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ content });
    const options = {
      hostname: 'localhost',
      port: 9009,
      path: '/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          if (body) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error('Empty response from server'));
          }
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
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

async function getClipboard() {
  try {
    const { stdout } = await execAsync('powershell -command "Get-Clipboard"');
    return stdout.trim();
  } catch {
    return '';
  }
}

async function monitor() {
  console.clear();
  log('╔══════════════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  llmverify Chat Monitor - AI Response Verification                          ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  log('Checking server...', 'yellow');

  const serverOk = await checkServer();
  if (!serverOk) {
    log('ERROR: Server not running!', 'red');
    log('Start server with: npm run serve', 'yellow');
    process.exit(1);
  }

  log('Server OK', 'green');
  log('');
  log('╔══════════════════════════════════════════════════════════════════════════════╗', 'green');
  log('║  READY - Copy AI responses to see verification scores                       ║', 'green');
  log('╚══════════════════════════════════════════════════════════════════════════════╝', 'green');
  log('');
  log('Instructions:', 'cyan');
  log('  1. Select AI response in chat');
  log('  2. Copy it (Ctrl+C)');
  log('  3. Verification score appears below automatically');
  log('');
  log('  Press Ctrl+C to stop', 'gray');
  log('');
  log('Waiting for AI responses...', 'yellow');
  log('');

  // Monitor clipboard
  setInterval(async () => {
    try {
      const clipboard = await getClipboard();
      
      if (clipboard && clipboard !== lastClipboard && clipboard.length > 50) {
        lastClipboard = clipboard;
        
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'gray');
        log('VERIFYING: Checking AI response...', 'cyan');
        
        try {
          const result = await verifyContent(clipboard);
          const riskLevel = result.result.risk.level.toUpperCase();
          const riskScore = Math.round(result.result.risk.overall * 100 * 10) / 10;
          const verdict = result.summary.verdict;
          
          const color = riskLevel === 'LOW' ? 'green' : 
                       riskLevel === 'MODERATE' ? 'yellow' : 'red';
          
          log('');
          log('╔══════════════════════════════════════════════════════════════════════════════╗', color);
          log('║  VERIFICATION RESULT                                                         ║', color);
          log('╚══════════════════════════════════════════════════════════════════════════════╝', color);
          log('');
          log(`  Verdict:      ${verdict}`, color);
          log(`  Risk Level:   ${riskLevel}`, color);
          log(`  Risk Score:   ${riskScore}%`, color);
          log(`  Explanation:  ${result.summary.explanation}`);
          
          if (result.summary.findings && result.summary.findings.length > 0) {
            log('');
            log('  Findings:', 'red');
            result.summary.findings.forEach(finding => {
              log(`    - ${finding.message || finding}`, 'red');
            });
          }
          
          log('');
          log(`  Timestamp:    ${new Date().toLocaleString()}`, 'gray');
          log('');
          
        } catch (error) {
          log(`ERROR: Verification failed - ${error.message}`, 'red');
        }
      }
    } catch (error) {
      // Ignore clipboard errors
    }
  }, 500);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('\nMonitor stopped', 'yellow');
  process.exit(0);
});

// Start monitoring
monitor().catch(error => {
  log(`ERROR: ${error.message}`, 'red');
  process.exit(1);
});
