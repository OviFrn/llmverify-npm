/**
 * Model-Agnostic Adapters Tests
 * 
 * Tests for the unified LLM adapter interface including:
 * - createAdapter factory
 * - Provider adapters (OpenAI, Anthropic, Groq, etc.)
 * - Local adapter
 * - Custom adapter
 * - Error handling
 * 
 * @module tests/adapters
 */

import {
  createAdapter,
  registerAdapter,
  getRegisteredProviders,
  buildOpenAIAdapter,
  buildAnthropicAdapter,
  buildGroqAdapter,
  buildLocalAdapter,
  buildCustomAdapter,
  AdapterError,
  UnsupportedProviderError,
  AdapterConfigError
} from '../src';

import type {
  LlmClient,
  LlmRequest,
  LlmResponse,
  AdapterConfig,
  ProviderId
} from '../src';

// ============================================
// Test Fixtures - Mock Clients
// ============================================

function createMockOpenAIClient(response: Partial<any> = {}) {
  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ 
            message: { content: response.text ?? 'OpenAI response' },
            finish_reason: 'stop'
          }],
          usage: { 
            completion_tokens: response.tokens ?? 10,
            total_tokens: 20
          },
          model: 'gpt-4o-mini',
          ...response
        })
      }
    }
  };
}

function createMockAnthropicClient(response: Partial<any> = {}) {
  return {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: response.text ?? 'Anthropic response' }],
        stop_reason: 'end_turn',
        usage: { 
          input_tokens: 10,
          output_tokens: response.tokens ?? 10
        },
        model: 'claude-3-5-sonnet',
        ...response
      })
    }
  };
}

function createMockGroqClient(response: Partial<any> = {}) {
  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ 
            message: { content: response.text ?? 'Groq response' },
            finish_reason: 'stop'
          }],
          usage: { 
            completion_tokens: response.tokens ?? 10,
            total_tokens: 20
          },
          model: 'llama-3.1-70b',
          ...response
        })
      }
    }
  };
}

// ============================================
// createAdapter Factory Tests
// ============================================

describe('createAdapter', () => {
  describe('factory function', () => {
    it('should create OpenAI adapter', () => {
      const mockClient = createMockOpenAIClient();
      const adapter = createAdapter({
        provider: 'openai',
        client: mockClient
      });
      
      expect(adapter.provider).toBe('openai');
      expect(adapter.providerName).toBe('OpenAI');
    });

    it('should create Anthropic adapter', () => {
      const mockClient = createMockAnthropicClient();
      const adapter = createAdapter({
        provider: 'anthropic',
        client: mockClient
      });
      
      expect(adapter.provider).toBe('anthropic');
      expect(adapter.providerName).toBe('Anthropic');
    });

    it('should create Groq adapter', () => {
      const mockClient = createMockGroqClient();
      const adapter = createAdapter({
        provider: 'groq',
        client: mockClient
      });
      
      expect(adapter.provider).toBe('groq');
      expect(adapter.providerName).toBe('Groq');
    });

    it('should create local adapter', () => {
      const localFn = jest.fn().mockResolvedValue('Local response');
      const adapter = createAdapter({
        provider: 'local',
        client: localFn
      });
      
      expect(adapter.provider).toBe('local');
    });

    it('should throw UnsupportedProviderError for unknown provider', () => {
      expect(() => createAdapter({
        provider: 'unknown-provider' as ProviderId,
        client: {}
      })).toThrow(UnsupportedProviderError);
    });
  });

  describe('getRegisteredProviders', () => {
    it('should return all registered providers', () => {
      const providers = getRegisteredProviders();
      
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('groq');
      expect(providers).toContain('google');
      expect(providers).toContain('local');
      expect(providers).toContain('custom');
    });
  });

  describe('registerAdapter', () => {
    it('should register custom adapter builder', () => {
      const customBuilder = (config: AdapterConfig): LlmClient => ({
        provider: 'custom',
        providerName: 'Test Provider',
        async generate(request: LlmRequest): Promise<LlmResponse> {
          return { text: 'Custom response', tokens: 5 };
        }
      });
      
      registerAdapter('test-provider' as ProviderId, customBuilder);
      
      const providers = getRegisteredProviders();
      expect(providers).toContain('test-provider');
    });
  });
});

// ============================================
// OpenAI Adapter Tests
// ============================================

describe('OpenAI Adapter', () => {
  describe('generate', () => {
    it('should generate response from OpenAI', async () => {
      const mockClient = createMockOpenAIClient({ text: 'Hello from OpenAI!' });
      const adapter = buildOpenAIAdapter({
        provider: 'openai',
        client: mockClient
      });
      
      const response = await adapter.generate({ prompt: 'Hello' });
      
      expect(response.text).toBe('Hello from OpenAI!');
      expect(response.tokens).toBe(10);
      expect(mockClient.chat.completions.create).toHaveBeenCalled();
    });

    it('should include system message when provided', async () => {
      const mockClient = createMockOpenAIClient();
      const adapter = buildOpenAIAdapter({
        provider: 'openai',
        client: mockClient
      });
      
      await adapter.generate({ 
        prompt: 'Hello',
        system: 'You are helpful'
      });
      
      const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(2);
      expect(callArgs.messages[0].role).toBe('system');
    });

    it('should use default model when not specified', async () => {
      const mockClient = createMockOpenAIClient();
      const adapter = buildOpenAIAdapter({
        provider: 'openai',
        client: mockClient,
        defaultModel: 'gpt-4'
      });
      
      await adapter.generate({ prompt: 'Hello' });
      
      const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.model).toBe('gpt-4');
    });

    it('should pass temperature and maxTokens', async () => {
      const mockClient = createMockOpenAIClient();
      const adapter = buildOpenAIAdapter({
        provider: 'openai',
        client: mockClient
      });
      
      await adapter.generate({ 
        prompt: 'Hello',
        temperature: 0.7,
        maxTokens: 100
      });
      
      const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.temperature).toBe(0.7);
      expect(callArgs.max_tokens).toBe(100);
    });
  });

  describe('error handling', () => {
    it('should throw AdapterConfigError when no client or apiKey', () => {
      expect(() => buildOpenAIAdapter({
        provider: 'openai'
      })).toThrow(AdapterConfigError);
    });
  });
});

// ============================================
// Anthropic Adapter Tests
// ============================================

describe('Anthropic Adapter', () => {
  describe('generate', () => {
    it('should generate response from Anthropic', async () => {
      const mockClient = createMockAnthropicClient({ text: 'Hello from Claude!' });
      const adapter = buildAnthropicAdapter({
        provider: 'anthropic',
        client: mockClient
      });
      
      const response = await adapter.generate({ prompt: 'Hello' });
      
      expect(response.text).toBe('Hello from Claude!');
      expect(mockClient.messages.create).toHaveBeenCalled();
    });

    it('should include system message', async () => {
      const mockClient = createMockAnthropicClient();
      const adapter = buildAnthropicAdapter({
        provider: 'anthropic',
        client: mockClient
      });
      
      await adapter.generate({ 
        prompt: 'Hello',
        system: 'You are helpful'
      });
      
      const callArgs = mockClient.messages.create.mock.calls[0][0];
      expect(callArgs.system).toBe('You are helpful');
    });

    it('should normalize finish reason', async () => {
      const mockClient = createMockAnthropicClient();
      mockClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Response' }],
        stop_reason: 'end_turn',
        usage: { output_tokens: 10 }
      });
      
      const adapter = buildAnthropicAdapter({
        provider: 'anthropic',
        client: mockClient
      });
      
      const response = await adapter.generate({ prompt: 'Hello' });
      
      expect(response.finishReason).toBe('stop');
    });
  });
});

// ============================================
// Groq Adapter Tests
// ============================================

describe('Groq Adapter', () => {
  describe('generate', () => {
    it('should generate response from Groq', async () => {
      const mockClient = createMockGroqClient({ text: 'Hello from Groq!' });
      const adapter = buildGroqAdapter({
        provider: 'groq',
        client: mockClient
      });
      
      const response = await adapter.generate({ prompt: 'Hello' });
      
      expect(response.text).toBe('Hello from Groq!');
      expect(adapter.providerName).toBe('Groq');
    });

    it('should use default model llama-3.1-70b-versatile', async () => {
      const mockClient = createMockGroqClient();
      const adapter = buildGroqAdapter({
        provider: 'groq',
        client: mockClient
      });
      
      await adapter.generate({ prompt: 'Hello' });
      
      const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.model).toBe('llama-3.1-70b-versatile');
    });
  });
});

// ============================================
// Local Adapter Tests
// ============================================

describe('Local Adapter', () => {
  describe('generate', () => {
    it('should call local function with prompt', async () => {
      const localFn = jest.fn().mockResolvedValue('Local response');
      const adapter = buildLocalAdapter({
        provider: 'local',
        client: localFn
      });
      
      const response = await adapter.generate({ prompt: 'Hello' });
      
      expect(response.text).toBe('Local response');
      expect(localFn).toHaveBeenCalledWith('Hello', expect.any(Object));
    });

    it('should prepend system message to prompt', async () => {
      const localFn = jest.fn().mockResolvedValue('Response');
      const adapter = buildLocalAdapter({
        provider: 'local',
        client: localFn
      });
      
      await adapter.generate({ 
        prompt: 'Hello',
        system: 'You are helpful'
      });
      
      expect(localFn).toHaveBeenCalledWith(
        'You are helpful\n\nHello',
        expect.any(Object)
      );
    });

    it('should handle object response with tokens', async () => {
      const localFn = jest.fn().mockResolvedValue({ text: 'Response', tokens: 15 });
      const adapter = buildLocalAdapter({
        provider: 'local',
        client: localFn
      });
      
      const response = await adapter.generate({ prompt: 'Hello' });
      
      expect(response.text).toBe('Response');
      expect(response.tokens).toBe(15);
    });

    it('should estimate tokens for string response', async () => {
      const localFn = jest.fn().mockResolvedValue('Hello world test');
      const adapter = buildLocalAdapter({
        provider: 'local',
        client: localFn
      });
      
      const response = await adapter.generate({ prompt: 'Hello' });
      
      expect(response.tokens).toBeGreaterThan(0);
    });

    it('should use custom provider name', async () => {
      const localFn = jest.fn().mockResolvedValue('Response');
      const adapter = buildLocalAdapter({
        provider: 'local',
        client: localFn,
        providerName: 'Ollama'
      });
      
      expect(adapter.providerName).toBe('Ollama');
    });
  });

  describe('error handling', () => {
    it('should throw AdapterConfigError when client is not a function', () => {
      expect(() => buildLocalAdapter({
        provider: 'local',
        client: { notAFunction: true }
      })).toThrow(AdapterConfigError);
    });
  });

  describe('healthCheck', () => {
    it('should return true when local function works', async () => {
      const localFn = jest.fn().mockResolvedValue('OK');
      const adapter = buildLocalAdapter({
        provider: 'local',
        client: localFn
      });
      
      const healthy = await adapter.healthCheck!();
      
      expect(healthy).toBe(true);
    });

    it('should return false when local function fails', async () => {
      const localFn = jest.fn().mockRejectedValue(new Error('Failed'));
      const adapter = buildLocalAdapter({
        provider: 'local',
        client: localFn
      });
      
      const healthy = await adapter.healthCheck!();
      
      expect(healthy).toBe(false);
    });
  });
});

// ============================================
// Custom Adapter Tests
// ============================================

describe('Custom Adapter', () => {
  describe('generate', () => {
    it('should use custom generate implementation', async () => {
      const customClient = {
        generate: jest.fn().mockResolvedValue({
          text: 'Custom response',
          tokens: 20
        })
      };
      
      const adapter = buildCustomAdapter({
        provider: 'custom',
        client: customClient,
        providerName: 'My API'
      });
      
      const response = await adapter.generate({ prompt: 'Hello' });
      
      expect(response.text).toBe('Custom response');
      expect(response.tokens).toBe(20);
      expect(adapter.providerName).toBe('My API');
    });

    it('should estimate tokens if not provided', async () => {
      const customClient = {
        generate: jest.fn().mockResolvedValue({
          text: 'Hello world response'
        })
      };
      
      const adapter = buildCustomAdapter({
        provider: 'custom',
        client: customClient
      });
      
      const response = await adapter.generate({ prompt: 'Hello' });
      
      expect(response.tokens).toBeGreaterThan(0);
    });
  });

  describe('optional methods', () => {
    it('should support embed method if provided', async () => {
      const customClient = {
        generate: jest.fn().mockResolvedValue({ text: 'Response', tokens: 5 }),
        embed: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]])
      };
      
      const adapter = buildCustomAdapter({
        provider: 'custom',
        client: customClient
      });
      
      const embeddings = await adapter.embed!('Hello');
      
      expect(embeddings).toEqual([[0.1, 0.2, 0.3]]);
    });

    it('should support healthCheck method if provided', async () => {
      const customClient = {
        generate: jest.fn().mockResolvedValue({ text: 'Response', tokens: 5 }),
        healthCheck: jest.fn().mockResolvedValue(true)
      };
      
      const adapter = buildCustomAdapter({
        provider: 'custom',
        client: customClient
      });
      
      const healthy = await adapter.healthCheck!();
      
      expect(healthy).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw AdapterConfigError when client has no generate method', () => {
      expect(() => buildCustomAdapter({
        provider: 'custom',
        client: { notGenerate: () => {} }
      })).toThrow(AdapterConfigError);
    });
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Adapter Integration', () => {
  describe('provider switching', () => {
    it('should allow switching providers with same interface', async () => {
      const openaiClient = createMockOpenAIClient({ text: 'OpenAI' });
      const anthropicClient = createMockAnthropicClient({ text: 'Anthropic' });
      
      const openaiAdapter = createAdapter({ provider: 'openai', client: openaiClient });
      const anthropicAdapter = createAdapter({ provider: 'anthropic', client: anthropicClient });
      
      // Same interface, different providers
      const openaiResponse = await openaiAdapter.generate({ prompt: 'Hello' });
      const anthropicResponse = await anthropicAdapter.generate({ prompt: 'Hello' });
      
      expect(openaiResponse.text).toBe('OpenAI');
      expect(anthropicResponse.text).toBe('Anthropic');
      
      // Both have same interface
      expect(typeof openaiAdapter.generate).toBe('function');
      expect(typeof anthropicAdapter.generate).toBe('function');
    });
  });

  describe('normalized response format', () => {
    it('should return consistent response format across providers', async () => {
      const providers: Array<{ provider: ProviderId; client: any }> = [
        { provider: 'openai', client: createMockOpenAIClient() },
        { provider: 'anthropic', client: createMockAnthropicClient() },
        { provider: 'groq', client: createMockGroqClient() },
        { provider: 'local', client: jest.fn().mockResolvedValue('Response') }
      ];
      
      for (const { provider, client } of providers) {
        const adapter = createAdapter({ provider, client });
        const response = await adapter.generate({ prompt: 'Hello' });
        
        // All responses should have these fields
        expect(response).toHaveProperty('text');
        expect(response).toHaveProperty('tokens');
        expect(typeof response.text).toBe('string');
        expect(typeof response.tokens).toBe('number');
      }
    });
  });
});
