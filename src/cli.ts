#!/usr/bin/env node

/**
 * llmverify CLI
 * 
 * Command-line interface for AI output verification.
 * 
 * @module cli
 * @author Haiec
 * @license MIT
 */

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import * as fs from 'fs';
import * as path from 'path';
import { verify } from './verify';
import { VERSION, PRIVACY_GUARANTEE } from './constants';
import { Config, DEFAULT_CONFIG } from './types/config';
import { VerifyResult, Finding } from './types/results';

const program = new Command();

program
  .name('llmverify')
  .description('AI Output Verification Toolkit - Local-first, privacy-preserving')
  .version(VERSION);

program
  .command('verify', { isDefault: true })
  .description('Verify AI output for risks')
  .argument('[content]', 'Content to verify (or use --file)')
  .option('-f, --file <path>', 'Read content from file')
  .option('-j, --json', 'Content is JSON')
  .option('-c, --config <path>', 'Path to config file')
  .option('-v, --verbose', 'Verbose output')
  .option('-o, --output <format>', 'Output format: text, json', 'text')
  .action(async (content: string | undefined, options) => {
    try {
      // Get content
      let inputContent = content;
      
      if (options.file) {
        const filePath = path.resolve(options.file);
        if (!fs.existsSync(filePath)) {
          console.error(chalk.red(`File not found: ${filePath}`));
          process.exit(1);
        }
        inputContent = fs.readFileSync(filePath, 'utf-8');
      }
      
      if (!inputContent) {
        console.error(chalk.red('No content provided. Use --file or provide content as argument.'));
        program.help();
        process.exit(1);
      }
      
      // Load config
      let config: Partial<Config> = {};
      if (options.config) {
        const configPath = path.resolve(options.config);
        if (fs.existsSync(configPath)) {
          config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
      }
      
      if (options.verbose) {
        config.output = { 
          verbose: true,
          includeEvidence: true,
          includeMethodology: true,
          includeLimitations: true
        };
      }
      
      // Run verification
      console.log(chalk.blue('\n🔍 Running llmverify...\n'));
      
      const result = await verify({
        content: inputContent,
        config,
        context: {
          isJSON: options.json
        }
      });
      
      // Output results
      if (options.output === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printTextResult(result, options.verbose);
      }
      
      // Exit code based on risk level
      const exitCodes: Record<string, number> = {
        low: 0,
        moderate: 1,
        high: 2,
        critical: 2
      };
      
      process.exit(exitCodes[result.risk.level] || 0);
      
    } catch (error) {
      console.error(chalk.red(`\nError: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize llmverify config file')
  .action(() => {
    const configPath = path.resolve('llmverify.config.json');
    
    if (fs.existsSync(configPath)) {
      console.log(chalk.yellow('Config file already exists: llmverify.config.json'));
      return;
    }
    
    const config = {
      tier: 'free',
      engines: DEFAULT_CONFIG.engines,
      performance: DEFAULT_CONFIG.performance,
      output: DEFAULT_CONFIG.output
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green('Created llmverify.config.json'));
  });

program
  .command('privacy')
  .description('Show privacy guarantees')
  .action(() => {
    console.log(chalk.blue('\n📋 llmverify Privacy Guarantees\n'));
    
    console.log(chalk.green('Free Tier:'));
    console.log(`  • Network Traffic: ${PRIVACY_GUARANTEE.freeTier.networkTraffic}`);
    console.log(`  • Data Transmission: ${PRIVACY_GUARANTEE.freeTier.dataTransmission}`);
    console.log(`  • Telemetry: ${PRIVACY_GUARANTEE.freeTier.telemetry}`);
    console.log(`  • Verification: ${PRIVACY_GUARANTEE.freeTier.verification}`);
    
    console.log(chalk.yellow('\nPaid Tiers:'));
    console.log(`  • Default: ${PRIVACY_GUARANTEE.paidTiers.defaultBehavior}`);
    console.log(`  • API Calls: ${PRIVACY_GUARANTEE.paidTiers.apiCalls}`);
    console.log(`  • Requires: ${PRIVACY_GUARANTEE.paidTiers.requires}`);
    
    console.log(chalk.red('\nWe NEVER:'));
    PRIVACY_GUARANTEE.neverEver.forEach(item => {
      console.log(`  ✗ ${item}`);
    });
    
    console.log();
  });

function printTextResult(result: VerifyResult, verbose: boolean): void {
  // Risk summary
  const riskColors: Record<string, typeof chalk.green> = {
    low: chalk.green,
    moderate: chalk.yellow,
    high: chalk.red,
    critical: chalk.bgRed.white
  };
  
  const riskColor = riskColors[result.risk.level] || chalk.white;
  
  console.log(chalk.bold('📊 Risk Assessment'));
  console.log(`   Level: ${riskColor(result.risk.level.toUpperCase())}`);
  console.log(`   Score: ${(result.risk.overall * 100).toFixed(1)}%`);
  console.log(`   Action: ${result.risk.action}`);
  console.log();
  
  // Findings
  if (result.csm6 && result.csm6.findings.length > 0) {
    console.log(chalk.bold('🔍 Findings'));
    
    const table = new Table({
      head: ['Severity', 'Category', 'Message', 'Confidence'],
      style: { head: ['cyan'] }
    });
    
    result.csm6.findings.forEach((finding: Finding) => {
      const severityColors: Record<string, typeof chalk.green> = {
        info: chalk.blue,
        low: chalk.green,
        medium: chalk.yellow,
        high: chalk.red,
        critical: chalk.bgRed.white
      };
      
      const sevColor = severityColors[finding.severity] || chalk.white;
      
      table.push([
        sevColor(finding.severity),
        finding.category,
        finding.message.substring(0, 50),
        `${(finding.confidence.value * 100).toFixed(0)}%`
      ]);
    });
    
    console.log(table.toString());
    console.log();
  }
  
  // Blockers
  if (result.risk.blockers.length > 0) {
    console.log(chalk.red.bold('🚫 Blockers'));
    result.risk.blockers.forEach(blocker => {
      console.log(`   • ${blocker}`);
    });
    console.log();
  }
  
  // Interpretation
  console.log(chalk.bold('📝 Interpretation'));
  console.log(`   ${result.risk.interpretation}`);
  console.log();
  
  // Limitations
  if (verbose) {
    console.log(chalk.yellow.bold('⚠️  Limitations'));
    result.limitations.slice(0, 5).forEach(limitation => {
      console.log(`   • ${limitation}`);
    });
    console.log();
  }
  
  // Meta
  console.log(chalk.dim(`Verification ID: ${result.meta.verification_id}`));
  console.log(chalk.dim(`Latency: ${result.meta.latency_ms}ms | Version: ${result.meta.version}`));
  console.log();
}

program.parse();
