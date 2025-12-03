/**
 * Provider Adapters Tests
 */

import { buildCohereAdapter } from '../src/adapters/providers/cohere';
import { buildDeepSeekAdapter } from '../src/adapters/providers/deepseek';
import { buildGoogleAdapter } from '../src/adapters/providers/google';
import { buildMistralAdapter } from '../src/adapters/providers/mistral';
import { AdapterConfigError } from '../src/adapters/types';

describe('Provider Adapters', () => {
  describe('Cohere Adapter', () => {
    it('should throw error without client or apiKey', () => {
      expect(() => buildCohereAdapter({ provider: 'cohere' })).toThrow(AdapterConfigError);
    });

    it('should create adapter with mock client', () => {
      const mockClient = {
        chat: jest.fn().mockResolvedValue({ text: 'Hello' })
      };
      
      const adapter = buildCohereAdapter({ provider: 'cohere', client: mockClient });
      expect(adapter).toBeDefined();
      expect(adapter.generate).toBeDefined();
    });

    it('should call generate correctly', async () => {
      const mockClient = {
        chat: jest.fn().mockResolvedValue({ 
          text: 'Response text',
          meta: { tokens: { outputTokens: 10, inputTokens: 5 } }
        })
      };
      
      const adapter = buildCohereAdapter({ provider: 'cohere', client: mockClient });
      const result = await adapter.generate({ prompt: 'Hello', model: 'command-r' });
      
      expect(result.text).toBe('Response text');
      expect(mockClient.chat).toHaveBeenCalled();
    });

    it('should handle system prompt', async () => {
      const mockClient = {
        chat: jest.fn().mockResolvedValue({ text: 'Response' })
      };
      
      const adapter = buildCohereAdapter({ provider: 'cohere', client: mockClient });
      await adapter.generate({ prompt: 'Hello', system: 'Be helpful' });
      
      expect(mockClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({ preamble: 'Be helpful' })
      );
    });

    it('should use default model', async () => {
      const mockClient = {
        chat: jest.fn().mockResolvedValue({ text: 'Response' })
      };
      
      const adapter = buildCohereAdapter({ 
        provider: 'cohere', 
        client: mockClient,
        defaultModel: 'command-r-plus'
      });
      await adapter.generate({ prompt: 'Hello' });
      
      expect(mockClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'command-r-plus' })
      );
    });
  });

  describe('DeepSeek Adapter', () => {
    it('should throw error without client or apiKey', () => {
      expect(() => buildDeepSeekAdapter({ provider: 'deepseek' })).toThrow(AdapterConfigError);
    });

    it('should create adapter with mock client', () => {
      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Hello' } }]
            })
          }
        }
      };
      
      const adapter = buildDeepSeekAdapter({ provider: 'deepseek', client: mockClient });
      expect(adapter).toBeDefined();
    });

    it('should call generate correctly', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Response' }, finish_reason: 'stop' }],
              usage: { completion_tokens: 10, prompt_tokens: 5 }
            })
          }
        }
      };
      
      const adapter = buildDeepSeekAdapter({ provider: 'deepseek', client: mockClient });
      const result = await adapter.generate({ prompt: 'Hello' });
      
      expect(result.text).toBe('Response');
    });
  });

  describe('Google Adapter', () => {
    it('should throw error without client or apiKey', () => {
      expect(() => buildGoogleAdapter({ provider: 'google' })).toThrow(AdapterConfigError);
    });

    it('should create adapter with mock client', () => {
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => 'Hello' }
        })
      };
      const mockClient = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };
      
      const adapter = buildGoogleAdapter({ provider: 'google', client: mockClient });
      expect(adapter).toBeDefined();
    });

    it('should call generate correctly', async () => {
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: { 
            text: () => 'Response',
            usageMetadata: { candidatesTokenCount: 10, promptTokenCount: 5 }
          }
        })
      };
      const mockClient = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };
      
      const adapter = buildGoogleAdapter({ provider: 'google', client: mockClient });
      const result = await adapter.generate({ prompt: 'Hello' });
      
      expect(result.text).toBe('Response');
    });
  });

  describe('Mistral Adapter', () => {
    it('should throw error without client or apiKey', () => {
      expect(() => buildMistralAdapter({ provider: 'mistral' })).toThrow(AdapterConfigError);
    });

    it('should create adapter with mock client', () => {
      const mockClient = {
        chat: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Hello' } }]
        })
      };
      
      const adapter = buildMistralAdapter({ provider: 'mistral', client: mockClient });
      expect(adapter).toBeDefined();
    });

    it('should call generate correctly', async () => {
      const mockClient = {
        chat: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Response' }, finishReason: 'stop' }],
          usage: { completionTokens: 10, promptTokens: 5 }
        })
      };
      
      const adapter = buildMistralAdapter({ provider: 'mistral', client: mockClient });
      const result = await adapter.generate({ prompt: 'Hello' });
      
      expect(result.text).toBe('Response');
    });

    it('should handle system prompt', async () => {
      const mockClient = {
        chat: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Response' } }]
        })
      };
      
      const adapter = buildMistralAdapter({ provider: 'mistral', client: mockClient });
      await adapter.generate({ prompt: 'Hello', system: 'Be helpful' });
      
      expect(mockClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system', content: 'Be helpful' })
          ])
        })
      );
    });
  });
});
