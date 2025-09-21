import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Intent detection logic (simplified version for edge function)
function detectIntent(userText: string): { intent: string; confidence: number; postAction?: boolean } {
  const text = userText.toLowerCase().trim();
  
  const actionKeywords = ['schedule', 'create', 'add', 'send', 'calculate', 'delete', 'remove', 'update', 'edit', 'modify'];
  const recallKeywords = ['summarize', 'what did i', 'recall', 'remember', 'ideas', 'show me', 'find', 'search', 'tell me about'];
  const mixedIndicators = ['then', 'after', 'also', 'and then', 'next', 'followed by'];
  
  const actionMatches = actionKeywords.filter(keyword => text.includes(keyword)).length;
  const recallMatches = recallKeywords.filter(keyword => text.includes(keyword)).length;
  const hasMixed = mixedIndicators.some(indicator => text.includes(indicator));
  
  if (hasMixed || (actionMatches > 0 && recallMatches > 0)) {
    return {
      intent: 'mixed',
      confidence: Math.min(0.9, 0.6 + (actionMatches + recallMatches) * 0.1),
      postAction: actionMatches >= recallMatches
    };
  }
  
  if (actionMatches > recallMatches) {
    return { intent: 'action', confidence: Math.min(0.95, 0.7 + actionMatches * 0.1) };
  }
  
  if (recallMatches > actionMatches) {
    return { intent: 'recall', confidence: Math.min(0.95, 0.7 + recallMatches * 0.1) };
  }
  
  // Check for question patterns
  if (/^(what|who|when|where|why|how|can you|could you|do you|did i|have i)/i.test(text)) {
    return { intent: 'recall', confidence: 0.6 };
  }
  
  return { intent: 'action', confidence: 0.5 };
}

// Build messages preview (simplified)
function buildMessagesPreview(userText: string, intent: string): any[] {
  const messages: any[] = [];
  
  // System message
  messages.push({
    role: 'system',
    content: `AI assistant with ${intent} intent. Response will be ${intent === 'action' ? 'action-focused' : intent === 'recall' ? 'retrieval-focused' : 'hybrid'}`,
    tokens: 25
  });
  
  if (intent === 'recall' || intent === 'mixed') {
    messages.push({
      role: 'assistant', 
      content: '[Retrieved memories would be inserted here]',
      tokens: 150
    });
  }
  
  // User message (truncated preview)
  const userPreview = userText.length > 100 ? userText.substring(0, 100) + '...' : userText;
  messages.push({
    role: 'user',
    content: userPreview,
    tokens: Math.ceil(userText.length / 4)
  });
  
  return messages;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userText, userId } = await req.json();

    if (!userText || !userId) {
      throw new Error('Missing required fields: userText, userId');
    }

    console.log('Processing agent route request:', { userId, textLength: userText.length });

    // Detect intent
    const intentResult = detectIntent(userText);
    
    // Build messages preview
    const messagesPreview = buildMessagesPreview(userText, intentResult.intent);
    
    // Mock retrieval count based on intent
    const retrievalCount = intentResult.intent === 'action' ? 0 : 
                          intentResult.intent === 'recall' ? 5 : 3;

    const response = {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      postAction: intentResult.postAction,
      messagesPreview,
      retrievalCount,
      tokenUsage: {
        system: messagesPreview.find(m => m.role === 'system')?.tokens || 0,
        user: messagesPreview.find(m => m.role === 'user')?.tokens || 0,
        memory: messagesPreview.find(m => m.role === 'assistant')?.tokens || 0,
        total: messagesPreview.reduce((sum, m) => sum + (m.tokens || 0), 0)
      }
    };

    console.log('Agent route response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Agent route error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});