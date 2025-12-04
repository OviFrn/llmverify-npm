/**
 * Configuration Management
 * 
 * Loads configuration from files and environment variables
 * 
 * @module config
 */

import * as fs from 'fs';
import * as path from 'path';
import { Config, DEFAULT_CONFIG } from '../types/config';

const ENV_PREFIX = 'LLMVERIFY_';

/**
 * Load config from environment variables
 */
export function loadConfigFromEnv(): Partial<Config> {
  const config: any = {};
  
  if (process.env[`${ENV_PREFIX}TIER`]) {
    config.tier = process.env[`${ENV_PREFIX}TIER`];
  }
  
  if (process.env[`${ENV_PREFIX}API_KEY`]) {
    config.privacy = { ...config.privacy, apiKey: process.env[`${ENV_PREFIX}API_KEY`] };
  }
  
  return config;
}

/**
 * Load config from file
 */
export function loadConfigFile(searchPath?: string): Partial<Config> | null {
  const startPath = searchPath || process.cwd();
  const configPath = path.join(startPath, 'llmverify.config.json');
  
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (error) {
      console.warn('Failed to load config:', error);
    }
  }
  
  return null;
}

/**
 * Merge configs with priority: runtime > env > file > defaults
 */
export function mergeConfigs(
  fileConfig: Partial<Config> | null,
  envConfig: Partial<Config>,
  runtimeConfig?: Partial<Config>
): Config {
  return {
    ...DEFAULT_CONFIG,
    ...(fileConfig || {}),
    ...envConfig,
    ...(runtimeConfig || {})
  } as Config;
}

/**
 * Load complete configuration
 */
export function loadConfig(runtimeConfig?: Partial<Config>): Config {
  const fileConfig = loadConfigFile();
  const envConfig = loadConfigFromEnv();
  return mergeConfigs(fileConfig, envConfig, runtimeConfig);
}

/**
 * Create default config file
 */
export function createDefaultConfigFile(targetPath?: string): string {
  const configPath = path.join(targetPath || process.cwd(), 'llmverify.config.json');
  
  const defaultConfig = {
    tier: 'free',
    engines: {
      hallucination: { enabled: true },
      consistency: { enabled: true },
      jsonValidator: { enabled: true },
      csm6: { enabled: true, profile: 'baseline' }
    }
  };
  
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  return configPath;
}
