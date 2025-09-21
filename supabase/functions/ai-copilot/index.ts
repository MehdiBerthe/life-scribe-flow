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

// Initialize Supabase client with service role for backend operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Available functions that the AI can call
const availableFunctions = [
  {
    type: "function",
    function: {
      name: "create_contact",
      description: "Create a new contact in the CRM",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Contact's full name" },
          email: { type: "string", description: "Contact's email address" },
          phone: { type: "string", description: "Contact's phone number" },
          company: { type: "string", description: "Contact's company" },
          segment: { type: "string", enum: ["TOP5", "WEEKLY15", "MONTHLY100"], description: "Contact segment" },
          notes: { type: "string", description: "Additional notes about the contact" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function", 
    function: {
      name: "search_contacts",
      description: "Search for contacts in the CRM",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query for contacts" },
          segment: { type: "string", enum: ["TOP5", "WEEKLY15", "MONTHLY100"], description: "Filter by contact segment" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_recent_activity",
      description: "Get recent activity summary from journal, goals, and other data",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of days to look back", default: 7 },
          categories: { type: "array", items: { type: "string" }, description: "Categories to include (journal, contacts, goals, etc.)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "schedule_reminder",
      description: "Schedule a reminder for the user",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Reminder message" },
          due_date: { type: "string", description: "When to remind (ISO date string)" },
          type: { type: "string", enum: ["contact", "goal", "task", "general"], description: "Type of reminder" }
        },
        required: ["message", "due_date"]
      }
    }
  }
];

// Function to get embeddings from OpenAI
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limit input length
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding API error: ${await response.text()}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

// Function to perform semantic search using vector similarity
async function semanticSearch(query: string, limit: number = 10): Promise<any[]> {
  const queryEmbedding = await getEmbedding(query);
  
  const { data, error } = await supabase.rpc('match_embeddings', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit
  });

  if (error) {
    console.error('Semantic search error:', error);
    return [];
  }

  return data || [];
}

// Function implementations
async function createContact(params: any) {
  console.log('Creating contact with params:', params);
  
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      name: params.name,
      email: params.email,
      phone: params.phone,
      company: params.company,
      segment: params.segment || 'MONTHLY100',
      notes: params.notes,
      next_touch: new Date().toISOString().split('T')[0],
      user_id: 'single-user'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create contact: ${error.message}`);
  }

  return { success: true, contact: data };
}

async function searchContacts(params: any) {
  console.log('Searching contacts with params:', params);
  
  let query = supabase
    .from('contacts')
    .select('*')
    .eq('user_id', 'single-user');

  if (params.segment) {
    query = query.eq('segment', params.segment);
  }

  if (params.query) {
    query = query.or(`name.ilike.%${params.query}%,email.ilike.%${params.query}%,company.ilike.%${params.query}%`);
  }

  const { data, error } = await query.limit(20);

  if (error) {
    throw new Error(`Failed to search contacts: ${error.message}`);
  }

  return { contacts: data || [] };
}

async function getRecentActivity(params: any) {
  const days = params.days || 7;
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  console.log('Getting recent activity for last', days, 'days');
  
  // Get recent contacts activity
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .gte('updated_at', since.toISOString())
    .limit(10);

  // Search for relevant context using semantic search
  const contextQuery = `Recent activity in the last ${days} days`;
  const relevantContext = await semanticSearch(contextQuery, 20);

  return {
    recent_contacts: contacts || [],
    relevant_context: relevantContext,
    summary: `Found ${contacts?.length || 0} recent contact updates and ${relevantContext.length} relevant context items`
  };
}

async function scheduleReminder(params: any) {
  console.log('Scheduling reminder:', params);
  
  const { data, error } = await supabase
    .from('ai_actions')
    .insert({
      action_type: 'schedule_reminder',
      action_data: {
        message: params.message,
        due_date: params.due_date,
        type: params.type || 'general'
      },
      user_id: 'single-user'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to schedule reminder: ${error.message}`);
  }

  return { success: true, reminder: data };
}

// Main chat function
async function processChat(messages: any[], conversationId?: string) {
  console.log('Processing chat with', messages.length, 'messages');
  
  // Get relevant context from the last user message
  const lastMessage = messages[messages.length - 1];
  const context = await semanticSearch(lastMessage.content, 15);
  
  // Build system prompt with context
  const contextText = context
    .map(item => `[${item.content_type}] ${item.content} (${item.metadata?.date || 'no date'})`)
    .join('\n');
    
  const systemPrompt = `You are an AI Co-Pilot for a personal productivity and life management system. You have access to the user's data through embeddings and can take actions on their behalf.

CONTEXT FROM USER'S DATA:
${contextText}

You can help with:
- Managing contacts and CRM activities
- Analyzing patterns in their journal, goals, and activities
- Scheduling reminders and follow-ups
- Providing insights based on their data
- Taking actions like creating contacts, searching data, etc.

Be conversational, helpful, and proactive. Use the available functions when appropriate to help the user accomplish their goals.

Current date: ${new Date().toISOString().split('T')[0]}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      functions: availableFunctions.map(f => f.function),
      function_call: 'auto',
      max_completion_tokens: 1500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const result = await response.json();
  const choice = result.choices[0];

  // Handle function calls
  if (choice.message.function_call) {
    const functionName = choice.message.function_call.name;
    const functionArgs = JSON.parse(choice.message.function_call.arguments);
    
    console.log('Executing function:', functionName, 'with args:', functionArgs);
    
    let functionResult;
    switch (functionName) {
      case 'create_contact':
        functionResult = await createContact(functionArgs);
        break;
      case 'search_contacts':
        functionResult = await searchContacts(functionArgs);
        break;
      case 'get_recent_activity':
        functionResult = await getRecentActivity(functionArgs);
        break;
      case 'schedule_reminder':
        functionResult = await scheduleReminder(functionArgs);
        break;
      default:
        functionResult = { error: `Unknown function: ${functionName}` };
    }

    // Get final response with function result
    const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          choice.message,
          { role: 'function', name: functionName, content: JSON.stringify(functionResult) }
        ],
        max_completion_tokens: 1000,
      }),
    });

    const followUpResult = await followUpResponse.json();
    return {
      message: followUpResult.choices[0].message.content,
      function_call: {
        name: functionName,
        arguments: functionArgs,
        result: functionResult
      }
    };
  }

  return {
    message: choice.message.content
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    const result = await processChat(messages, conversationId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Co-Pilot error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "I'm sorry, I encountered an error. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});