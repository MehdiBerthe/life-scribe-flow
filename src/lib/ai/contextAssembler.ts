import { supabase } from '@/integrations/supabase/client';

export interface BuildMessagesParams {
  userId: string;
  userText: string;
  intent: 'action' | 'recall' | 'mixed';
  hints?: {
    kinds?: string[];
    startDate?: string;
    endDate?: string;
  };
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Token budget constants
const BUDGETS = {
  SYSTEM: 1500,
  USER: 800,
  MEMORY: 1200,
  TOOLS: 800,
} as const;

// Approximate token counter (text.length / 4)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Truncate text to fit token budget
function truncateToTokens(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(text);
  if (estimatedTokens <= maxTokens) return text;
  
  const ratio = maxTokens / estimatedTokens;
  const targetLength = Math.floor(text.length * ratio * 0.9); // 10% buffer
  
  if (targetLength < text.length) {
    return text.substring(0, targetLength) + '...';
  }
  
  return text;
}

async function searchAndCompress(userId: string, query: string, hints?: BuildMessagesParams['hints']) {
  try {
    // Call rag-search function
    const { data: searchData, error: searchError } = await supabase.functions.invoke('rag-search', {
      body: {
        userId,
        query,
        kinds: hints?.kinds,
        startTs: hints?.startDate,
        endTs: hints?.endDate,
        topK: 12
      }
    });

    if (searchError) {
      console.error('RAG search error:', searchError);
      return [];
    }

    const results = searchData?.results || [];
    if (results.length === 0) return [];

    // Prepare snippets for compression
    const snippets = results.map((result: any, index: number) => ({
      id: index,
      content: `${result.title || ''}\n${result.content}`.trim()
    }));

    // Call compress-snippets function
    const { data: compressData, error: compressError } = await supabase.functions.invoke('compress-snippets', {
      body: {
        snippets,
        maxTokens: 150
      }
    });

    if (compressError) {
      console.error('Compression error:', compressError);
      return results.map((r: any) => r.content.substring(0, 600) + '...');
    }

    return compressData?.items?.map((item: any) => item.text) || [];
  } catch (error) {
    console.error('Search and compress error:', error);
    return [];
  }
}

export async function buildMessages({ userId, userText, intent, hints }: BuildMessagesParams): Promise<Message[]> {
  const messages: Message[] = [];

  // System message (always included)
  const systemMessage = `You are a helpful AI assistant that can access the user's personal data and memories. 
Current context: ${intent} intent detected.
${intent === 'recall' ? 'Focus on retrieving and summarizing relevant information from the user\'s data.' : ''}
${intent === 'action' ? 'Focus on executing the requested action or providing direct assistance.' : ''}
${intent === 'mixed' ? 'Provide relevant context first, then offer to take action if needed.' : ''}

Keep responses concise and helpful.`;

  messages.push({
    role: 'system',
    content: truncateToTokens(systemMessage, BUDGETS.SYSTEM)
  });

  // For action intent, skip RAG and just return system + user
  if (intent === 'action') {
    messages.push({
      role: 'user',
      content: truncateToTokens(userText, BUDGETS.USER)
    });
    return messages;
  }

  // For recall or mixed intent, fetch and include relevant memories
  const compressedMemories = await searchAndCompress(userId, userText, hints);
  
  if (compressedMemories.length > 0) {
    // Pack as many memories as fit in the MEMORY budget
    let memoryContent = '';
    let totalMemoryTokens = 0;
    
    for (const memory of compressedMemories) {
      const memoryTokens = estimateTokens(memory);
      if (totalMemoryTokens + memoryTokens > BUDGETS.MEMORY) break;
      
      memoryContent += memory + '\n\n';
      totalMemoryTokens += memoryTokens;
    }

    if (memoryContent.trim()) {
      messages.push({
        role: 'assistant',
        content: `Here's what I found in your data:\n\n${memoryContent.trim()}`
      });
    }
  }

  // Always add the user message (truncated to budget)
  messages.push({
    role: 'user',
    content: truncateToTokens(userText, BUDGETS.USER)
  });

  return messages;
}