import { describe, it, expect } from 'vitest';
import { detectIntent, extractDateHints } from '../intentRouter';

describe('intentRouter', () => {
  describe('detectIntent', () => {
    it('should detect action intent for action keywords', () => {
      const actionTexts = [
        'Schedule a meeting for tomorrow',
        'Create a new task',
        'Send an email to John',
        'Calculate my expenses',
        'Add this to my todo list'
      ];

      actionTexts.forEach(text => {
        const result = detectIntent(text);
        expect(result.intent).toBe('action');
        expect(result.confidence).toBeGreaterThan(0.6);
      });
    });

    it('should detect recall intent for recall keywords', () => {
      const recallTexts = [
        'Summarize my notes from last week',
        'What did I discuss in the meeting?',
        'Show me my ideas about the project',
        'Find my contacts in sales',
        'Tell me about my goals'
      ];

      recallTexts.forEach(text => {
        const result = detectIntent(text);
        expect(result.intent).toBe('recall');
        expect(result.confidence).toBeGreaterThan(0.6);
      });
    });

    it('should detect mixed intent for combined keywords', () => {
      const mixedTexts = [
        'Show me my tasks and then create a new one',
        'Find my notes and schedule a follow-up',
        'What are my goals and add a new milestone'
      ];

      mixedTexts.forEach(text => {
        const result = detectIntent(text);
        expect(result.intent).toBe('mixed');
        expect(result.confidence).toBeGreaterThan(0.6);
        expect(result.postAction).toBeDefined();
      });
    });

    it('should detect mixed intent with mixed indicators', () => {
      const result = detectIntent('Review my progress then plan next steps');
      expect(result.intent).toBe('mixed');
      expect(result.postAction).toBe(true);
    });

    it('should default to recall for question patterns', () => {
      const questionTexts = [
        'What happened yesterday?',
        'Who did I meet with?',
        'When was my last review?',
        'How many tasks do I have?'
      ];

      questionTexts.forEach(text => {
        const result = detectIntent(text);
        expect(result.intent).toBe('recall');
      });
    });

    it('should default to action for statements without keywords', () => {
      const result = detectIntent('This is a random statement');
      expect(result.intent).toBe('action');
      expect(result.confidence).toBeLessThanOrEqual(0.6);
    });

    it('should handle empty text', () => {
      const result = detectIntent('');
      expect(result.intent).toBe('action');
      expect(result.confidence).toBe(0.5);
    });

    it('should set postAction based on keyword dominance', () => {
      const actionDominant = detectIntent('Find my tasks and create schedule add send');
      expect(actionDominant.intent).toBe('mixed');
      expect(actionDominant.postAction).toBe(true);

      const recallDominant = detectIntent('Create a task but first show summarize find list');
      expect(recallDominant.intent).toBe('mixed');
      expect(recallDominant.postAction).toBe(false);
    });
  });

  describe('extractDateHints', () => {
    it('should extract "today" date hint', () => {
      const hints = extractDateHints('Show me my tasks for today');
      const today = new Date().toISOString().split('T')[0];
      
      expect(hints.startDate).toBe(today);
      expect(hints.endDate).toBe(today);
    });

    it('should extract "yesterday" date hint', () => {
      const hints = extractDateHints('What did I do yesterday?');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const expectedDate = yesterday.toISOString().split('T')[0];
      
      expect(hints.startDate).toBe(expectedDate);
      expect(hints.endDate).toBe(expectedDate);
    });

    it('should extract "this week" date hint', () => {
      const hints = extractDateHints('Summarize this week');
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      
      expect(hints.startDate).toBe(weekStart.toISOString().split('T')[0]);
      expect(hints.endDate).toBe(today.toISOString().split('T')[0]);
    });

    it('should extract "last week" date hint', () => {
      const hints = extractDateHints('Show me last week data');
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() - 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      expect(hints.startDate).toBe(weekStart.toISOString().split('T')[0]);
      expect(hints.endDate).toBe(weekEnd.toISOString().split('T')[0]);
    });

    it('should extract "this month" date hint', () => {
      const hints = extractDateHints('Review this month progress');
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      expect(hints.startDate).toBe(monthStart.toISOString().split('T')[0]);
      expect(hints.endDate).toBe(today.toISOString().split('T')[0]);
    });

    it('should return empty hints for text without date references', () => {
      const hints = extractDateHints('Create a new task');
      expect(hints.startDate).toBeUndefined();
      expect(hints.endDate).toBeUndefined();
    });
  });
});