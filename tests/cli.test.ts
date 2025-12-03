/**
 * CLI Tests
 * 
 * Tests for CLI commands and output formatting.
 */

import { execSync } from 'child_process';
import * as path from 'path';

const CLI_PATH = path.join(__dirname, '..', 'dist', 'cli.js');

function runCLI(args: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`node "${CLI_PATH}" ${args}`, {
      encoding: 'utf-8',
      timeout: 30000
    });
    return { stdout, exitCode: 0 };
  } catch (error: any) {
    return { 
      stdout: error.stdout || error.message, 
      exitCode: error.status || 1 
    };
  }
}

describe('CLI', () => {
  describe('help command', () => {
    it('should display help with --help flag', () => {
      const { stdout, exitCode } = runCLI('--help');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('llmverify');
      expect(stdout).toContain('verify');
    });

    it('should display version with --version flag', () => {
      const { stdout, exitCode } = runCLI('--version');
      expect(exitCode).toBe(0);
      expect(stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('verify command', () => {
    it('should verify safe content', () => {
      const { stdout, exitCode } = runCLI('verify "The capital of France is Paris."');
      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('risk');
    });

    it('should output JSON with --output json', () => {
      const { stdout, exitCode } = runCLI('verify "Hello world" --output json');
      expect(exitCode).toBe(0);
      // Extract JSON from output (may have banner before it)
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      expect(jsonMatch).not.toBeNull();
      const result = JSON.parse(jsonMatch![0]);
      expect(result).toHaveProperty('risk');
    });

    it('should handle verbose flag', () => {
      const { stdout, exitCode } = runCLI('verify "Test content" --verbose');
      expect(exitCode).toBe(0);
    });
  });

  describe('run command', () => {
    it('should run with dev preset', () => {
      const { stdout, exitCode } = runCLI('run "Test AI output" --preset dev');
      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('risk');
    });

    it('should run with prod preset', () => {
      const { stdout, exitCode } = runCLI('run "Test AI output" --preset prod');
      expect(exitCode).toBe(0);
    });

    it('should run with ci preset', () => {
      const { stdout, exitCode } = runCLI('run "Test AI output" --preset ci');
      expect(exitCode).toBe(0);
    });

    it('should run with strict preset', () => {
      const { stdout, exitCode } = runCLI('run "Test AI output" --preset strict');
      expect(exitCode).toBe(0);
    });

    it('should run with fast preset', () => {
      const { stdout, exitCode } = runCLI('run "Test AI output" --preset fast');
      expect(exitCode).toBe(0);
    });

    it('should output summary format', () => {
      const { stdout, exitCode } = runCLI('run "Test" --preset ci --output summary');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Risk:');
    });

    it('should output JSON format', () => {
      const { stdout, exitCode } = runCLI('run "Test" --preset ci --output json');
      expect(exitCode).toBe(0);
      // Extract JSON from output (may have banner before it)
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      expect(jsonMatch).not.toBeNull();
      const result = JSON.parse(jsonMatch![0]);
      expect(result).toHaveProperty('verification');
      expect(result).toHaveProperty('meta');
    });
  });

  describe('engines command', () => {
    it('should list all engines', () => {
      const { stdout, exitCode } = runCLI('engines');
      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('engine');
    });

    it('should output JSON with --json flag', () => {
      const { stdout, exitCode } = runCLI('engines --json');
      expect(exitCode).toBe(0);
      const result = JSON.parse(stdout);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('presets command', () => {
    it('should list all presets', () => {
      const { stdout, exitCode } = runCLI('presets');
      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('dev');
      expect(stdout.toLowerCase()).toContain('prod');
      expect(stdout.toLowerCase()).toContain('strict');
    });

    it('should output JSON with --json flag', () => {
      const { stdout, exitCode } = runCLI('presets --json');
      expect(exitCode).toBe(0);
      const result = JSON.parse(stdout);
      expect(result).toHaveProperty('dev');
      expect(result).toHaveProperty('prod');
    });
  });

  describe('doctor command', () => {
    it('should run health check', () => {
      const { stdout, exitCode } = runCLI('doctor');
      expect(exitCode).toBe(0);
      // Doctor command outputs system info
      expect(stdout.toLowerCase()).toMatch(/node|version|config/);
    });
  });

  describe('privacy command', () => {
    it('should display privacy guarantees', () => {
      const { stdout, exitCode } = runCLI('privacy');
      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('privacy');
    });
  });

  describe('info command', () => {
    it('should display package info', () => {
      const { stdout, exitCode } = runCLI('info');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('llmverify');
    });
  });

  describe('adapters command', () => {
    it('should list adapters', () => {
      const { stdout, exitCode } = runCLI('adapters');
      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('adapter');
    });
  });

  describe('tutorial command', () => {
    it('should display tutorial', () => {
      const { stdout, exitCode } = runCLI('tutorial');
      expect(exitCode).toBe(0);
    });
  });

  describe('explain command', () => {
    it('should explain hallucination engine', () => {
      const { stdout, exitCode } = runCLI('explain hallucination');
      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('hallucination');
    });

    it('should explain csm6 engine', () => {
      const { stdout, exitCode } = runCLI('explain csm6');
      expect(exitCode).toBe(0);
    });

    it('should explain consistency engine', () => {
      const { stdout, exitCode } = runCLI('explain consistency');
      expect(exitCode).toBe(0);
    });
  });

  describe('version command', () => {
    it('should show detailed version info', () => {
      const { stdout, exitCode } = runCLI('version');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('llmverify');
    });

    it('should output JSON with --json flag', () => {
      const { stdout, exitCode } = runCLI('version --json');
      expect(exitCode).toBe(0);
      const result = JSON.parse(stdout);
      // Version info is nested under package
      expect(result).toHaveProperty('package');
      expect(result.package).toHaveProperty('version');
    });
  });
});
