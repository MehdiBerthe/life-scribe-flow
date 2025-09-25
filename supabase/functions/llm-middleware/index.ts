import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Token budget limits
const TOKEN_BUDGETS = {
  SYSTEM: 1500,
  USER: 800,
  MEMORY: 1200,
  TOOLS: 800
};

// Estimate tokens (approximation: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

interface ProcessedRequest {
  systemPrompt: string;
  userMessage: string;
  memoryContext: string;
  toolResults: string;
  totalTokens: number;
  memoryItems: number;
  topScore: number;
  intent: string;
}

async function callRagSearch(userId: string, query: string, topK: number = 8) {
  console.log('Calling RAG search with query:', query.substring(0, 100));
  
  const { data, error } = await supabase.functions.invoke('rag-search', {
    body: {
      userId,
      query,
      topK
    }
  });

  if (error) {
    console.error('RAG search error:', error);
    return [];
  }

  return data || [];
}

async function compressSnippets(snippets: { id: number; content: string }[], maxTokens: number) {
  console.log(`Compressing ${snippets.length} snippets with max tokens: ${maxTokens}`);
  
  const { data, error } = await supabase.functions.invoke('compress-snippets', {
    body: {
      snippets,
      maxTokens
    }
  });

  if (error) {
    console.error('Compress snippets error:', error);
    return snippets.map((s, i) => ({ id: i, text: s.content.substring(0, maxTokens * 4) }));
  }

  return data?.items || [];
}

function detectIntent(userText: string): string {
  const normalized = userText.toLowerCase();
  
  const actionKeywords = ['create', 'add', 'schedule', 'send', 'update', 'track', 'set', 'make'];
  const recallKeywords = ['what', 'when', 'show', 'tell', 'find', 'search', 'remember', 'recall'];
  
  const actionMatches = actionKeywords.some(keyword => normalized.includes(keyword));
  const recallMatches = recallKeywords.some(keyword => normalized.includes(keyword));
  
  if (actionMatches && recallMatches) return 'mixed';
  if (actionMatches) return 'action';
  if (recallMatches) return 'recall';
  
  return 'mixed'; // Default
}

async function enforceTokenBudgets(
  userId: string,
  systemPrompt: string,
  userMessage: string,
  toolResults?: any[]
): Promise<ProcessedRequest> {
  console.log('Enforcing token budgets...');
  
  const intent = detectIntent(userMessage);
  
  // Truncate user message if over budget
  let truncatedUser = userMessage;
  const userTokens = estimateTokens(userMessage);
  if (userTokens > TOKEN_BUDGETS.USER) {
    const maxChars = TOKEN_BUDGETS.USER * 4;
    truncatedUser = userMessage.substring(0, maxChars) + '...';
    console.log(`Truncated user message from ${userTokens} to ${TOKEN_BUDGETS.USER} tokens`);
  }
  
  // Truncate system prompt if over budget
  let truncatedSystem = systemPrompt;
  const systemTokens = estimateTokens(systemPrompt);
  if (systemTokens > TOKEN_BUDGETS.SYSTEM) {
    const maxChars = TOKEN_BUDGETS.SYSTEM * 4;
    truncatedSystem = systemPrompt.substring(0, maxChars) + '...';
    console.log(`Truncated system prompt from ${systemTokens} to ${TOKEN_BUDGETS.SYSTEM} tokens`);
  }
  
  // Get memory context with budget enforcement
  const ragResults = await callRagSearch(userId, truncatedUser, 20);
  console.log(`Retrieved ${ragResults.length} RAG results`);
  
  let memoryContext = '';
  let memoryItems = 0;
  let topScore = 0;
  
  if (ragResults.length > 0) {
    // Sort by score and track top score
    const sortedResults = ragResults.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    topScore = sortedResults[0]?.score || 0;
    
    // Build memory context
    const snippets = sortedResults.map((item: any, index: number) => ({
      id: index,
      content: `[${item.kind}] ${item.title || ''}: ${item.content} (score: ${item.score?.toFixed(2)})`
    }));
    
    const initialMemoryText = snippets.map((s: any) => s.content).join('\n\n');
    const initialTokens = estimateTokens(initialMemoryText);
    
    if (initialTokens > TOKEN_BUDGETS.MEMORY) {
      console.log(`Memory context ${initialTokens} tokens > budget ${TOKEN_BUDGETS.MEMORY}, compressing...`);
      
      // Try compression first
      const targetTokensPerItem = Math.floor(TOKEN_BUDGETS.MEMORY / snippets.length);
      const compressedSnippets = await compressSnippets(snippets, targetTokensPerItem);
      
      let compressedText = compressedSnippets.map((s: any) => s.text).join('\n\n');
      let compressedTokens = estimateTokens(compressedText);
      
      // If still over budget, drop lowest-ranked items
      if (compressedTokens > TOKEN_BUDGETS.MEMORY) {
        console.log(`Still over budget after compression (${compressedTokens}), dropping items...`);
        const allowedChars = TOKEN_BUDGETS.MEMORY * 4;
        compressedText = compressedText.substring(0, allowedChars);
        compressedTokens = TOKEN_BUDGETS.MEMORY;
      }
      
      memoryContext = compressedText;
      memoryItems = compressedSnippets.length;
    } else {
      memoryContext = initialMemoryText;
      memoryItems = snippets.length;
    }
  }
  
  // Handle tool results budget
  let processedToolResults = '';
  if (toolResults && toolResults.length > 0) {
    const toolText = JSON.stringify(toolResults);
    const toolTokens = estimateTokens(toolText);
    
    if (toolTokens > TOKEN_BUDGETS.TOOLS) {
      console.log(`Tool results ${toolTokens} tokens > budget ${TOKEN_BUDGETS.TOOLS}, truncating...`);
      const maxChars = TOKEN_BUDGETS.TOOLS * 4;
      processedToolResults = toolText.substring(0, maxChars) + '...}';
    } else {
      processedToolResults = toolText;
    }
  }
  
  const totalTokens = 
    estimateTokens(truncatedSystem) + 
    estimateTokens(truncatedUser) + 
    estimateTokens(memoryContext) + 
    estimateTokens(processedToolResults);
  
  console.log(`Token budget summary - System: ${estimateTokens(truncatedSystem)}, User: ${estimateTokens(truncatedUser)}, Memory: ${estimateTokens(memoryContext)}, Tools: ${estimateTokens(processedToolResults)}, Total: ${totalTokens}`);
  
  return {
    systemPrompt: truncatedSystem,
    userMessage: truncatedUser,
    memoryContext,
    toolResults: processedToolResults,
    totalTokens,
    memoryItems,
    topScore,
    intent
  };
}

async function logTelemetry(
  userId: string, 
  totalTokens: number, 
  memoryItems: number, 
  topScore: number, 
  intent: string
) {
  console.log('Logging telemetry:', { userId, totalTokens, memoryItems, topScore, intent });
  
  try {
    const { error } = await supabase
      .from('llm_stats')
      .insert({
        user_id: userId,
        tokens_total: totalTokens,
        mem_items: memoryItems,
        top_score: topScore,
        intent
      });
    
    if (error) {
      console.error('Telemetry logging error:', error);
    }
  } catch (error) {
    console.error('Telemetry logging failed:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userId, 
      systemPrompt, 
      userMessage, 
      toolResults 
    } = await req.json();

    if (!userId || !systemPrompt || !userMessage) {
      throw new Error('Missing required fields: userId, systemPrompt, userMessage');
    }

    // Process request with token budget enforcement
    const processedRequest = await enforceTokenBudgets(
      userId,
      systemPrompt,
      userMessage,
      toolResults
    );

    // Log telemetry
    await logTelemetry(
      userId,
      processedRequest.totalTokens,
      processedRequest.memoryItems,
      processedRequest.topScore,
      processedRequest.intent
    );

    return new Response(JSON.stringify(processedRequest), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('LLM middleware error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});