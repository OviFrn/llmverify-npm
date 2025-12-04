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

// Risk level definitions and thresholds
const RISK_LEVELS = {
  LOW: { min: 0, max: 25, color: 'green', action: 'Safe to use' },
  MODERATE: { min: 26, max: 50, color: 'yellow', action: 'Review recommended' },
  HIGH: { min: 51, max: 75, color: 'red', action: 'Fix before using' },
  CRITICAL: { min: 76, max: 100, color: 'red', action: 'Do not use' }
};

function explainRisk(result) {
  const riskScore = Math.round(result.result.risk.overall * 100 * 10) / 10;
  const riskLevel = result.result.risk.level.toUpperCase();
  const findings = result.summary.findings || [];
  
  const explanations = [];
  
  // Explain what the score means
  const levelInfo = RISK_LEVELS[riskLevel];
  explanations.push(`Risk Score ${riskScore}% means: ${levelInfo.action}`);
  explanations.push(`Range: ${levelInfo.min}-${levelInfo.max}% is ${riskLevel}`);
  
  // Break down the risk factors
  const breakdown = result.result.risk.breakdown || {};
  if (breakdown.hallucination > 0.1) {
    explanations.push(`Hallucination risk: ${Math.round(breakdown.hallucination * 100)}% - May contain unverified claims`);
  }
  if (breakdown.consistency < 0.9) {
    explanations.push(`Consistency: ${Math.round(breakdown.consistency * 100)}% - Internal contradictions detected`);
  }
  if (breakdown.security > 0.1) {
    explanations.push(`Security risk: ${Math.round(breakdown.security * 100)}% - May contain unsafe content`);
  }
  
  // Provide actionable suggestions
  const suggestions = [];
  if (findings.length > 0) {
    suggestions.push('How to lower risk:');
    if (findings.some(f => f.type === 'hallucination')) {
      suggestions.push('  - Verify factual claims with reliable sources');
      suggestions.push('  - Ask AI to cite sources for specific facts');
    }
    if (findings.some(f => f.type === 'security')) {
      suggestions.push('  - Remove or sanitize sensitive information');
      suggestions.push('  - Avoid using commands or code without review');
    }
    if (findings.some(f => f.type === 'consistency')) {
      suggestions.push('  - Check for contradictory statements');
      suggestions.push('  - Ask AI to clarify conflicting information');
    }
    if (findings.some(f => f.type === 'pii')) {
      suggestions.push('  - Remove personal identifiable information');
      suggestions.push('  - Use generic examples instead of real data');
    }
  } else if (riskScore > 15) {
    suggestions.push('How to lower risk:');
    suggestions.push('  - Ask AI to be more specific and factual');
    suggestions.push('  - Request sources for important claims');
    suggestions.push('  - Break complex responses into smaller parts');
  }
  
  return { explanations, suggestions };
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
          
          // Add detailed risk explanation
          const { explanations, suggestions } = explainRisk(result);
          
          if (explanations.length > 0) {
            log('');
            log('  Understanding Your Risk Score:', 'cyan');
            explanations.forEach(exp => {
              log(`    ${exp}`, 'gray');
            });
          }
          
          if (suggestions.length > 0) {
            log('');
            suggestions.forEach(sug => {
              if (sug.startsWith('How to')) {
                log(`  ${sug}`, 'yellow');
              } else {
                log(`  ${sug}`, 'gray');
              }
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
