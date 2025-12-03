/**
 * llmverify - Main Verification Function
 * 
 * AI Output Verification with honest limitations.
 * Local-first, privacy-preserving, transparent.
 * 
 * @module verify
 * @author Haiec
 * @license MIT
 */

import { v4 as uuidv4 } from 'uuid';
import { Config, DEFAULT_CONFIG, TIER_LIMITS } from './types/config';
import { VerifyResult } from './types/results';
import { VERSION } from './constants';
import { PrivacyViolationError, ValidationError, VerificationError } from './errors';
import { HallucinationEngine } from './engines/hallucination';
import { ConsistencyEngine } from './engines/consistency';
import { JSONValidatorEngine } from './engines/json-validator';
import { CSM6Baseline } from './csm6/baseline';
import { RiskScoringEngine } from './engines/risk-scoring';

export interface VerifyOptions {
  content: string;
  config?: Partial<Config>;
  context?: {
    isJSON?: boolean;
    expectedSchema?: unknown;
    skipEngines?: string[];
  };
}

/**
 * Main verification function
 * 
 * PRIVACY GUARANTEE: Free tier never makes network requests.
 * All processing is local unless explicit API key is provided.
 * 
 * @param options - Verification options
 * @returns Complete verification result with limitations
 * 
 * @example
 * ```typescript
 * const result = await verify({
 *   content: "The Earth is flat."
 * });
 * 
 * console.log(result.risk.level); // "moderate"
 * console.log(result.limitations); // ["Pattern-based detection only", ...]
 * ```
 */
export async function verify(options: VerifyOptions): Promise<VerifyResult> {
  const startTime = Date.now();
  const verificationId = uuidv4();
  
  // Merge config with tier limits
  const config = mergeConfig(options.config);
  
  // CRITICAL: Validate privacy compliance
  validatePrivacyCompliance(config);
  
  // Validate input
  validateInput(options.content, config);
  
  const result: Partial<VerifyResult> = {
    limitations: [],
    notChecked: []
  };
  
  const enginesUsed: string[] = [];
  
  try {
    const enginePromises: Promise<void>[] = [];
    
    // Hallucination detection
    if (config.engines.hallucination.enabled && 
        !options.context?.skipEngines?.includes('hallucination')) {
      const engine = new HallucinationEngine(config);
      enginesUsed.push('hallucination');
      enginePromises.push(
        engine.detect(options.content).then(res => {
          result.hallucination = res;
          result.limitations?.push(...res.limitations);
        })
      );
    } else {
      result.notChecked?.push('hallucination');
    }
    
    // Consistency check
    if (config.engines.consistency.enabled &&
        !options.context?.skipEngines?.includes('consistency')) {
      const engine = new ConsistencyEngine(config);
      enginesUsed.push('consistency');
      enginePromises.push(
        engine.check(options.content).then(res => {
          result.consistency = res;
          result.limitations?.push(...res.limitations);
        })
      );
    } else {
      result.notChecked?.push('consistency');
    }
    
    // JSON validation
    if (config.engines.jsonValidator.enabled &&
        options.context?.isJSON &&
        !options.context?.skipEngines?.includes('json')) {
      const engine = new JSONValidatorEngine(config);
      enginesUsed.push('json');
      enginePromises.push(
        engine.validate(
          options.content,
          options.context?.expectedSchema
        ).then(res => {
          result.json = res;
          result.limitations?.push(...res.limitations);
        })
      );
    }
    
    // CSM6 checks
    if (config.engines.csm6.enabled &&
        !options.context?.skipEngines?.includes('csm6')) {
      const engine = new CSM6Baseline(config);
      enginesUsed.push('csm6');
      enginePromises.push(
        engine.audit(options.content, options.content).then(res => {
          result.csm6 = res;
          result.limitations?.push(...res.limitations);
        })
      );
    } else {
      result.notChecked?.push('csm6');
    }
    
    // Wait for all engines
    await Promise.all(enginePromises);
    
    // Calculate overall risk
    const riskEngine = new RiskScoringEngine(config);
    result.risk = riskEngine.calculate(result as VerifyResult);
    
    // De-duplicate limitations
    result.limitations = [...new Set(result.limitations)];
    
  } catch (error) {
    throw new VerificationError(`Verification failed: ${(error as Error).message}`);
  }
  
  const endTime = Date.now();
  
  return {
    ...result,
    risk: result.risk!,
    meta: {
      verification_id: verificationId,
      timestamp: new Date().toISOString(),
      latency_ms: endTime - startTime,
      version: VERSION,
      tier: config.tier,
      enginesUsed
    },
    limitations: result.limitations!,
    notChecked: result.notChecked!
  } as VerifyResult;
}

/**
 * Merge user config with defaults and tier limits
 */
function mergeConfig(userConfig?: Partial<Config>): Config {
  const tier = userConfig?.tier || 'free';
  const tierConfig = TIER_LIMITS[tier];
  
  // Deep merge
  const merged: Config = {
    ...DEFAULT_CONFIG,
    ...userConfig,
    tier,
    privacy: {
      ...DEFAULT_CONFIG.privacy,
      ...userConfig?.privacy
    },
    engines: {
      ...DEFAULT_CONFIG.engines,
      ...userConfig?.engines,
      csm6: {
        ...DEFAULT_CONFIG.engines.csm6,
        ...userConfig?.engines?.csm6,
        checks: {
          ...DEFAULT_CONFIG.engines.csm6.checks,
          ...userConfig?.engines?.csm6?.checks
        }
      }
    },
    performance: {
      ...DEFAULT_CONFIG.performance,
      ...tierConfig?.performance,
      ...userConfig?.performance
    },
    output: {
      ...DEFAULT_CONFIG.output,
      ...userConfig?.output,
      includeLimitations: true // ALWAYS true
    }
  };
  
  return merged;
}

/**
 * CRITICAL: Validate privacy compliance
 */
function validatePrivacyCompliance(config: Config): void {
  // Free tier must never allow network requests
  if (config.tier === 'free' && config.privacy.allowNetworkRequests) {
    throw new PrivacyViolationError(
      'Free tier cannot enable network requests. ' +
      'This is a privacy violation. ' +
      'Upgrade to Team tier for ML-enhanced features.'
    );
  }
  
  // Free tier must never have telemetry
  if (config.tier === 'free' && config.privacy.telemetryEnabled) {
    throw new PrivacyViolationError(
      'Free tier cannot enable telemetry. ' +
      'This is a privacy violation.'
    );
  }
}

/**
 * Validate input constraints
 */
function validateInput(content: string, config: Config): void {
  if (!content || content.trim().length === 0) {
    throw new ValidationError('Content cannot be empty');
  }
  
  if (content.length > config.performance.maxContentLength) {
    throw new ValidationError(
      `Content exceeds maximum length of ${config.performance.maxContentLength} characters. ` +
      `Current length: ${content.length}. ` +
      `Upgrade to ${config.tier === 'free' ? 'Team' : 'Professional'} tier for higher limits.`
    );
  }
}
