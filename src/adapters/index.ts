/**
 * Model-Agnostic Adapters
 * 
 * Unified interface for any LLM provider.
 * 
 * @example
 * import { createAdapter, monitorLLM } from 'llmverify';
 * import OpenAI from 'openai';
 * 
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * const llm = createAdapter({ provider: 'openai', client: openai });
 * const monitored = monitorLLM(llm);
 * 
 * const response = await monitored.generate({ prompt: 'Hello!' });
 * 
 * @module adapters
 * @author Haiec
 * @license MIT
 */

// Types
export type { 
  ProviderId, 
  LlmRequest, 
  LlmResponse, 
  LlmClient, 
  AdapterConfig,
  AdapterBuilder
} from './types';

export { 
  AdapterError, 
  UnsupportedProviderError, 
  AdapterConfigError 
} from './types';

// Factory
export { createAdapter, registerAdapter, getRegisteredProviders } from './factory';

// Individual adapters (for advanced usage)
export { buildOpenAIAdapter } from './providers/openai';
export { buildAnthropicAdapter } from './providers/anthropic';
export { buildGroqAdapter } from './providers/groq';
export { buildGoogleAdapter } from './providers/google';
export { buildDeepSeekAdapter } from './providers/deepseek';
export { buildMistralAdapter } from './providers/mistral';
export { buildCohereAdapter } from './providers/cohere';
export { buildLocalAdapter } from './providers/local';
export { buildCustomAdapter } from './providers/custom';
