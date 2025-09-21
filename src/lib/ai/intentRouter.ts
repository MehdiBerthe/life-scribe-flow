export type Intent = 'action' | 'recall' | 'mixed';

export interface IntentResult {
  intent: Intent;
  confidence: number;
  postAction?: boolean;
}

// Keywords that indicate action intent
const ACTION_KEYWORDS = [
  'schedule', 'create', 'add', 'send', 'calculate', 'delete', 'remove',
  'update', 'edit', 'modify', 'book', 'reserve', 'order', 'buy',
  'call', 'email', 'message', 'contact', 'remind', 'set', 'plan'
];

// Keywords that indicate recall intent
const RECALL_KEYWORDS = [
  'summarize', 'summary', 'what did i', 'recall', 'remember', 'ideas',
  'show me', 'find', 'search', 'when did', 'how many', 'list',
  'tell me about', 'what are', 'what were', 'review', 'history'
];

// Keywords that often appear in mixed scenarios
const MIXED_INDICATORS = [
  'then', 'after', 'also', 'and then', 'next', 'followed by'
];

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

function countKeywordMatches(text: string, keywords: string[]): number {
  const normalized = normalizeText(text);
  return keywords.filter(keyword => normalized.includes(keyword)).length;
}

function hasMixedIndicators(text: string): boolean {
  const normalized = normalizeText(text);
  return MIXED_INDICATORS.some(indicator => normalized.includes(indicator));
}

export function detectIntent(userText: string): IntentResult {
  if (!userText.trim()) {
    return { intent: 'action', confidence: 0.5 };
  }

  const actionMatches = countKeywordMatches(userText, ACTION_KEYWORDS);
  const recallMatches = countKeywordMatches(userText, RECALL_KEYWORDS);
  const mixedIndicators = hasMixedIndicators(userText);

  // Calculate confidence based on keyword density
  const textWords = userText.split(/\s+/).length;
  const actionDensity = actionMatches / textWords;
  const recallDensity = recallMatches / textWords;

  // Check for mixed intent first
  if (mixedIndicators || (actionMatches > 0 && recallMatches > 0)) {
    return {
      intent: 'mixed',
      confidence: Math.min(0.9, 0.6 + (actionMatches + recallMatches) * 0.1),
      postAction: actionMatches >= recallMatches
    };
  }

  // Pure action intent
  if (actionMatches > recallMatches) {
    return {
      intent: 'action',
      confidence: Math.min(0.95, 0.7 + actionDensity * 2)
    };
  }

  // Pure recall intent
  if (recallMatches > actionMatches) {
    return {
      intent: 'recall',
      confidence: Math.min(0.95, 0.7 + recallDensity * 2)
    };
  }

  // Default to mixed if no clear indicators
  if (actionMatches === 0 && recallMatches === 0) {
    // Check for question patterns that suggest recall
    const questionPattern = /^(what|who|when|where|why|how|can you|could you|do you|did i|have i)/i;
    if (questionPattern.test(userText.trim())) {
      return { intent: 'recall', confidence: 0.6 };
    }
    
    // Default to action for statements
    return { intent: 'action', confidence: 0.5 };
  }

  // Equal matches - default to mixed
  return {
    intent: 'mixed',
    confidence: 0.7,
    postAction: true
  };
}

export function extractDateHints(userText: string): { startDate?: string; endDate?: string } {
  const hints: { startDate?: string; endDate?: string } = {};
  
  const today = new Date();
  const normalized = normalizeText(userText);
  
  // Simple date extraction patterns
  if (normalized.includes('today')) {
    hints.startDate = today.toISOString().split('T')[0];
    hints.endDate = hints.startDate;
  } else if (normalized.includes('yesterday')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    hints.startDate = yesterday.toISOString().split('T')[0];
    hints.endDate = hints.startDate;
  } else if (normalized.includes('this week')) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    hints.startDate = weekStart.toISOString().split('T')[0];
    hints.endDate = today.toISOString().split('T')[0];
  } else if (normalized.includes('last week')) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() - 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    hints.startDate = weekStart.toISOString().split('T')[0];
    hints.endDate = weekEnd.toISOString().split('T')[0];
  } else if (normalized.includes('this month')) {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    hints.startDate = monthStart.toISOString().split('T')[0];
    hints.endDate = today.toISOString().split('T')[0];
  }
  
  return hints;
}