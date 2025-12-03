/**
 * Adapter Factory
 * 
 * Creates unified LLM clients from provider-specific configurations.
 * Uses a registry pattern for extensibility.
 * 
 * @module adapters/factory
 * @author Haiec
 * @license MIT
 */

import { 
  ProviderId, 
  LlmClient, 
  AdapterConfig, 
  AdapterBuilder,
  UnsupportedProviderError 
} from './types';

import { buildOpenAIAdapter } from './providers/openai';
import { buildAnthropicAdapter } from './providers/anthropic';
import { buildGroqAdapter } from './providers/groq';
import { buildGoogleAdapter } from './providers/google';
import { buildDeepSeekAdapter } from './providers/deepseek';
import { buildMistralAdapter } from './providers/mistral';
import { buildCohereAdapter } from './providers/cohere';
import { buildLocalAdapter } from './providers/local';
import { buildCustomAdapter } from './providers/custom';

/**
 * Registry of adapter builders by provider ID.
 */
const adapterRegistry: Map<ProviderId, AdapterBuilder> = new Map([
  ['openai', buildOpenAIAdapter],
  ['anthropic', buildAnthropicAdapter],
  ['groq', buildGroqAdapter],
  ['google', buildGoogleAdapter],
  ['deepseek', buildDeepSeekAdapter],
  ['mistral', buildMistralAdapter],
  ['cohere', buildCohereAdapter],
  ['local', buildLocalAdapter],
  ['custom', buildCustomAdapter]
]);

/**
 * Creates a unified LLM client from provider configuration.
 * 
 * @param config - Adapter configuration
 * @returns Unified LLM client
 * @throws UnsupportedProviderError if provider is not registered
 * 
 * @example
 * // With existing OpenAI client
 * import OpenAI from 'openai';
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * const llm = createAdapter({ provider: 'openai', client: openai });
 * 
 * @example
 * // With API key only
 * const llm = createAdapter({ 
 *   provider: 'openai', 
 *   apiKey: process.env.OPENAI_API_KEY,
 *   defaultModel: 'gpt-4o-mini'
 * });
 * 
 * @example
 * // Local model
 * const llm = createAdapter({
 *   provider: 'local',
 *   client: async (prompt) => await myLocalModel(prompt)
 * });
 */
export function createAdapter(config: AdapterConfig): LlmClient {
  const builder = adapterRegistry.get(config.provider);
  
  if (!builder) {
    throw new UnsupportedProviderError(config.provider);
  }
  
  return builder(config);
}

/**
 * Registers a custom adapter builder.
 * Use this to add support for providers not included by default.
 * 
 * @param provider - Provider identifier
 * @param builder - Adapter builder function
 * 
 * @example
 * registerAdapter('my-provider', (config) => ({
 *   provider: 'custom',
 *   providerName: 'My Provider',
 *   async generate(request) {
 *     // Your implementation
 *     return { text: '...', tokens: 0 };
 *   }
 * }));
 */
export function registerAdapter(provider: ProviderId | string, builder: AdapterBuilder): void {
  adapterRegistry.set(provider as ProviderId, builder);
}

/**
 * Gets list of registered provider IDs.
 */
export function getRegisteredProviders(): ProviderId[] {
  return Array.from(adapterRegistry.keys());
}
