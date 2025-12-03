/**
 * Playwright Demo Recording Script
 * 
 * Records a video demonstration of llmverify features.
 * 
 * Run with:
 *   npx playwright test demo/record-demo.spec.ts --headed
 * 
 * Output: demo/recordings/llmverify-demo.webm
 */

import { test, expect } from '@playwright/test';

// Configure video recording with longer timeout
test.use({
  video: {
    mode: 'on',
    size: { width: 1280, height: 720 }
  },
  viewport: { width: 1280, height: 720 }
});

test.setTimeout(120000); // 2 minute timeout

test.describe('llmverify Demo Recording', () => {
  
  test('Record terminal demo', async ({ page }) => {
    // Create a simple HTML page that shows terminal output
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>llmverify Demo</title>
        <style>
          body {
            background: #1e1e1e;
            color: #d4d4d4;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 16px;
            padding: 20px;
            margin: 0;
            line-height: 1.5;
          }
          .header {
            color: #569cd6;
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
          }
          .section {
            color: #4ec9b0;
            font-size: 18px;
            margin: 20px 0 10px 0;
            border-bottom: 1px solid #4ec9b0;
            padding-bottom: 5px;
          }
          .code {
            background: #2d2d2d;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            overflow-x: auto;
          }
          .keyword { color: #569cd6; }
          .string { color: #ce9178; }
          .comment { color: #6a9955; }
          .function { color: #dcdcaa; }
          .success { color: #4ec9b0; }
          .warning { color: #dcdcaa; }
          .error { color: #f14c4c; }
          .output {
            background: #252526;
            padding: 10px;
            border-left: 3px solid #4ec9b0;
            margin: 10px 0;
          }
          #terminal {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <div id="terminal"></div>
      </body>
      </html>
    `);

    const terminal = page.locator('#terminal');
    
    // Helper to type text with animation (faster)
    async function typeText(text: string, delay = 10) {
      // Type in chunks for speed
      const chunkSize = 5;
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        await terminal.evaluate((el, c) => {
          el.innerHTML += c;
        }, chunk);
        await page.waitForTimeout(delay);
      }
    }
    
    // Helper to add content instantly
    async function addContent(html: string) {
      await terminal.evaluate((el, content) => {
        el.innerHTML += content;
      }, html);
    }
    
    // Start demo
    await addContent(`
      <div class="header">
        ╔═══════════════════════════════════════════════════════════╗<br>
        ║  <span class="keyword">llmverify</span> - LLM Output Monitoring & Classification  ║<br>
        ║  Local-first • Zero telemetry • TypeScript ready          ║<br>
        ╚═══════════════════════════════════════════════════════════╝
      </div>
    `);
    
    await page.waitForTimeout(2000);
    
    // Demo 1: Basic Verification
    await addContent(`<div class="section">Demo 1: Basic AI Output Verification</div>`);
    await page.waitForTimeout(500);
    
    await addContent(`<div class="code">`);
    await typeText(`import { verify } from 'llmverify';\n\n`, 20);
    await typeText(`const result = await verify({ content: aiOutput });\n`, 20);
    await typeText(`console.log(result.risk.level);  // "low" | "moderate" | "high"`, 20);
    await addContent(`</div>`);
    
    await page.waitForTimeout(1000);
    
    await addContent(`
      <div class="output">
        <span class="success">✓ Result:</span><br>
        &nbsp;&nbsp;Risk Level: <span class="string">low</span><br>
        &nbsp;&nbsp;Action: <span class="string">allow</span><br>
        &nbsp;&nbsp;Limitations: 5 noted
      </div>
    `);
    
    await page.waitForTimeout(2000);
    
    // Demo 2: Prompt Injection
    await addContent(`<div class="section">Demo 2: Prompt Injection Detection</div>`);
    await page.waitForTimeout(500);
    
    await addContent(`<div class="code">`);
    await typeText(`import { isInputSafe } from 'llmverify';\n\n`, 20);
    await typeText(`if (!isInputSafe(userInput)) {\n`, 20);
    await typeText(`  throw new Error('Potential attack detected');\n`, 20);
    await typeText(`}`, 20);
    await addContent(`</div>`);
    
    await page.waitForTimeout(1000);
    
    await addContent(`
      <div class="output">
        <span class="success">✓ Safe input:</span> "What is the weather?"<br>
        &nbsp;&nbsp;isInputSafe: <span class="success">true</span><br><br>
        <span class="error">✗ Attack input:</span> "Ignore all previous instructions..."<br>
        &nbsp;&nbsp;isInputSafe: <span class="error">false</span>
      </div>
    `);
    
    await page.waitForTimeout(2000);
    
    // Demo 3: PII Redaction
    await addContent(`<div class="section">Demo 3: PII Redaction</div>`);
    await page.waitForTimeout(500);
    
    await addContent(`<div class="code">`);
    await typeText(`import { redactPII } from 'llmverify';\n\n`, 20);
    await typeText(`const { redacted } = redactPII(aiOutput);`, 20);
    await addContent(`</div>`);
    
    await page.waitForTimeout(1000);
    
    await addContent(`
      <div class="output">
        <span class="success">✓ Original:</span> Contact john@example.com or 555-123-4567<br>
        <span class="keyword">✓ Redacted:</span> Contact [REDACTED] or [REDACTED]
      </div>
    `);
    
    await page.waitForTimeout(2000);
    
    // Demo 4: Classification
    await addContent(`<div class="section">Demo 4: Output Classification</div>`);
    await page.waitForTimeout(500);
    
    await addContent(`<div class="code">`);
    await typeText(`import { classify } from 'llmverify';\n\n`, 20);
    await typeText(`const result = classify(prompt, output);\n`, 20);
    await typeText(`console.log(result.intent);            // 'summary'\n`, 20);
    await typeText(`console.log(result.hallucinationRisk); // 0.15`, 20);
    await addContent(`</div>`);
    
    await page.waitForTimeout(1000);
    
    await addContent(`
      <div class="output">
        <span class="success">✓ Classification:</span><br>
        &nbsp;&nbsp;Intent: <span class="string">summary</span><br>
        &nbsp;&nbsp;Hallucination Risk: <span class="success">low (0.15)</span><br>
        &nbsp;&nbsp;Tags: intent:summary, hallucination:low
      </div>
    `);
    
    await page.waitForTimeout(2000);
    
    // Demo 5: Runtime Monitoring
    await addContent(`<div class="section">Demo 5: Runtime Health Monitoring</div>`);
    await page.waitForTimeout(500);
    
    await addContent(`<div class="code">`);
    await typeText(`import { createAdapter, monitorLLM } from 'llmverify';\n\n`, 20);
    await typeText(`const llm = createAdapter({ provider: 'openai', client });\n`, 20);
    await typeText(`const monitored = monitorLLM(llm);\n\n`, 20);
    await typeText(`const response = await monitored.generate({ prompt });\n`, 20);
    await typeText(`console.log(response.llmverify.health); // 'stable'`, 20);
    await addContent(`</div>`);
    
    await page.waitForTimeout(1000);
    
    await addContent(`
      <div class="output">
        <span class="success">✓ Monitoring:</span><br>
        &nbsp;&nbsp;Health: <span class="success">stable</span><br>
        &nbsp;&nbsp;Baseline samples: 5<br>
        &nbsp;&nbsp;Avg latency: 120ms
      </div>
    `);
    
    await page.waitForTimeout(2000);
    
    // Summary
    await addContent(`<div class="section">Summary</div>`);
    await page.waitForTimeout(500);
    
    await addContent(`
      <div class="output">
        <span class="success">✓ All features demonstrated!</span><br><br>
        <span class="keyword">Key Points:</span><br>
        &nbsp;&nbsp;• 100% local - no data leaves your machine<br>
        &nbsp;&nbsp;• Heuristic-based risk indicators<br>
        &nbsp;&nbsp;• See docs/LIMITATIONS.md for honest disclosure<br><br>
        <span class="keyword">Install:</span> npm install llmverify<br>
        <span class="keyword">GitHub:</span> github.com/haiec/llmverify
      </div>
    `);
    
    await page.waitForTimeout(3000);
    
    // Video will be saved automatically
  });
});
