import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMessages, estimateTokens, type BuildMessagesParams } from '../contextAssembler';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('contextAssembler', () => {
  describe('estimateTokens', () => {
    it('should estimate tokens as text.length / 4', () => {
      expect(estimateTokens('hello')).toBe(2); // 5/4 = 1.25, ceil = 2
      expect(estimateTokens('hello world')).toBe(3); // 11/4 = 2.75, ceil = 3
      expect(estimateTokens('a'.repeat(400))).toBe(100); // 400/4 = 100
    });
  });

  describe('buildMessages', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return system + user for action intent', async () => {
      const params: BuildMessagesParams = {
        userId: 'test-user',
        userText: 'Create a new task',
        intent: 'action'
      };

      const messages = await buildMessages(params);
      
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toBe('Create a new task');
    });

    it('should truncate user text when exceeding USER budget', async () => {
      const longText = 'a'.repeat(4000); // ~1000 tokens, exceeds 800 budget
      
      const params: BuildMessagesParams = {
        userId: 'test-user',
        userText: longText,
        intent: 'action'
      };

      const messages = await buildMessages(params);
      const userMessage = messages.find(m => m.role === 'user');
      
      expect(userMessage).toBeDefined();
      expect(estimateTokens(userMessage!.content)).toBeLessThanOrEqual(800);
      expect(userMessage!.content).toMatch(/\.\.\.$/); // Should end with ellipsis
    });

    it('should include memories for recall intent', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock successful RAG search
      (supabase.functions.invoke as any)
        .mockResolvedValueOnce({
          data: {
            results: [
              { title: 'Meeting Notes', content: 'Had a productive meeting about project X' }
            ]
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            items: [
              { id: 0, text: '• Meeting about project X - productive discussion' }
            ]
          },
          error: null
        });

      const params: BuildMessagesParams = {
        userId: 'test-user',
        userText: 'What did I discuss in my last meeting?',
        intent: 'recall'
      };

      const messages = await buildMessages(params);
      
      expect(messages.length).toBeGreaterThan(2);
      expect(messages.some(m => m.role === 'assistant')).toBe(true);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('rag-search', expect.any(Object));
      expect(supabase.functions.invoke).toHaveBeenCalledWith('compress-snippets', expect.any(Object));
    });

    it('should respect MEMORY token budget when packing memories', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Create many large compressed memories that would exceed budget
      const largeMemories = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        text: 'a'.repeat(500) // ~125 tokens each
      }));

      (supabase.functions.invoke as any)
        .mockResolvedValueOnce({
          data: { results: largeMemories.map((_, i) => ({ title: `Item ${i}`, content: 'content' })) },
          error: null
        })
        .mockResolvedValueOnce({
          data: { items: largeMemories },
          error: null
        });

      const params: BuildMessagesParams = {
        userId: 'test-user',
        userText: 'Summarize everything',
        intent: 'recall'
      };

      const messages = await buildMessages(params);
      const memoryMessage = messages.find(m => m.role === 'assistant');
      
      expect(memoryMessage).toBeDefined();
      expect(estimateTokens(memoryMessage!.content)).toBeLessThanOrEqual(1200); // MEMORY budget
    });

    it('should handle RAG search errors gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      (supabase.functions.invoke as any).mockResolvedValueOnce({
        data: null,
        error: new Error('Search failed')
      });

      const params: BuildMessagesParams = {
        userId: 'test-user',
        userText: 'What did I do yesterday?',
        intent: 'recall'
      };

      const messages = await buildMessages(params);
      
      // Should still return system + user messages even if RAG fails
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
    });

    it('should pass hints to RAG search', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      (supabase.functions.invoke as any)
        .mockResolvedValueOnce({ data: { results: [] }, error: null })
        .mockResolvedValueOnce({ data: { items: [] }, error: null });

      const params: BuildMessagesParams = {
        userId: 'test-user',
        userText: 'Show me my journal entries',
        intent: 'recall',
        hints: {
          kinds: ['journal'],
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      };

      await buildMessages(params);
      
      expect(supabase.functions.invoke).toHaveBeenCalledWith('rag-search', {
        body: expect.objectContaining({
          kinds: ['journal'],
          startTs: '2024-01-01',
          endTs: '2024-01-31'
        })
      });
    });
  });
});