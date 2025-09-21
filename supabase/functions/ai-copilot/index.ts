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
  },
  {
    type: "function",
    function: {
      name: "trigger_n8n_workflow",
      description: "Trigger an n8n workflow for external integrations (WhatsApp, Calendar, Email, etc.)",
      parameters: {
        type: "object",
        properties: {
          workflow_type: { type: "string", enum: ["whatsapp_message", "calendar_event", "email_notification", "reminder"], description: "Type of workflow to trigger" },
          data: { type: "object", description: "Data to send to the workflow" }
        },
        required: ["workflow_type", "data"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_calendar_event",
      description: "Add an event to the user's calendar",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title" },
          start_time: { type: "string", description: "Start time (ISO string)" },
          end_time: { type: "string", description: "End time (ISO string)" },
          description: { type: "string", description: "Event description" },
          location: { type: "string", description: "Event location" },
          attendees: { type: "array", items: { type: "string" }, description: "List of attendee emails" }
        },
        required: ["title", "start_time"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_calendar_events",
      description: "Get upcoming calendar events",
      parameters: {
        type: "object",
        properties: {
          days_ahead: { type: "number", description: "Number of days to look ahead", default: 7 },
          limit: { type: "number", description: "Maximum number of events to return", default: 10 }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_goal_progress",
      description: "Update progress on a goal",
      parameters: {
        type: "object",
        properties: {
          goal_title: { type: "string", description: "Goal title or identifier" },
          progress_update: { type: "string", description: "Progress description" },
          completion_percentage: { type: "number", description: "Completion percentage (0-100)" }
        },
        required: ["goal_title", "progress_update"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_journal_entry",
      description: "Add a new journal entry",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "Journal entry content" },
          mood: { type: "string", description: "User's mood (happy, neutral, sad, etc.)" },
          tags: { type: "array", items: { type: "string" }, description: "Tags for the entry" }
        },
        required: ["content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "track_physical_activity",
      description: "Track a physical activity or exercise",
      parameters: {
        type: "object",
        properties: {
          activity_type: { type: "string", description: "Type of activity (running, gym, walking, etc.)" },
          duration_minutes: { type: "number", description: "Duration in minutes" },
          intensity: { type: "string", enum: ["low", "medium", "high"], description: "Activity intensity" },
          notes: { type: "string", description: "Additional notes about the activity" }
        },
        required: ["activity_type", "duration_minutes"]
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

async function triggerN8nWorkflow(params: any) {
  console.log('Triggering n8n workflow:', params);
  
  const { workflow_type, data } = params;
  
  // Get n8n webhook URL from environment
  const n8nBaseUrl = Deno.env.get('N8N_WEBHOOK_URL') || 'http://localhost:5678/webhook';
  const webhookUrl = `${n8nBaseUrl}/${workflow_type}`;
  
  // Prepare payload
  const payload = {
    user_id: 'single-user',
    workflow_type,
    data,
    timestamp: new Date().toISOString()
  };

  // Log the action to database first
  const { data: actionLog, error: logError } = await supabase
    .from('ai_actions')
    .insert({
      action_type: workflow_type,
      action_data: payload,
      user_id: 'single-user',
      status: 'pending'
    })
    .select()
    .single();

  if (logError) {
    throw new Error(`Failed to log n8n action: ${logError.message}`);
  }

  // Try to trigger n8n workflow
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }

    // Update action status to completed
    await supabase
      .from('ai_actions')
      .update({ status: 'completed' })
      .eq('id', actionLog.id);

    return { 
      success: true, 
      message: `Successfully triggered ${workflow_type} workflow via n8n`,
      action_id: actionLog.id,
      webhook_url: webhookUrl
    };
  } catch (fetchError) {
    // Update action status to failed but don't throw - allow fallback
    await supabase
      .from('ai_actions')
      .update({ 
        status: 'failed',
        action_data: { ...payload, error: fetchError.message }
      })
      .eq('id', actionLog.id);

    return { 
      success: false, 
      message: `n8n workflow trigger failed: ${fetchError.message}. Action logged for manual processing.`,
      action_id: actionLog.id,
      fallback: true
    };
  }
}

async function addCalendarEvent(params: any) {
  console.log('Adding calendar event:', params);
  
  const { data, error } = await supabase
    .from('ai_actions')
    .insert({
      action_type: 'add_calendar_event',
      action_data: {
        title: params.title,
        start_time: params.start_time,
        end_time: params.end_time,
        description: params.description,
        location: params.location,
        attendees: params.attendees
      },
      user_id: 'single-user'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }

  return { 
    success: true, 
    message: `Calendar event "${params.title}" scheduled for ${new Date(params.start_time).toLocaleString()}`,
    event: data 
  };
}

async function getCalendarEvents(params: any) {
  console.log('Getting calendar events for next', params.days_ahead || 7, 'days');
  
  // For now, return upcoming reminders as calendar events
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (params.days_ahead || 7));
  
  const { data, error } = await supabase
    .from('ai_actions')
    .select('*')
    .eq('action_type', 'schedule_reminder')
    .eq('user_id', 'single-user')
    .gte('action_data->due_date', startDate.toISOString())
    .lte('action_data->due_date', endDate.toISOString())
    .order('action_data->due_date', { ascending: true })
    .limit(params.limit || 10);

  if (error) {
    console.error('Error getting calendar events:', error);
    return { events: [] };
  }

  const events = (data || []).map(item => ({
    title: item.action_data.message,
    start_time: item.action_data.due_date,
    type: item.action_data.type || 'reminder',
    id: item.id
  }));

  return { events };
}

async function updateGoalProgress(params: any) {
  console.log('Updating goal progress:', params);
  
  const { data, error } = await supabase
    .from('ai_actions')
    .insert({
      action_type: 'update_goal',
      action_data: {
        goal_title: params.goal_title,
        progress_update: params.progress_update,
        completion_percentage: params.completion_percentage,
        date: new Date().toISOString()
      },
      user_id: 'single-user'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update goal progress: ${error.message}`);
  }

  return { 
    success: true, 
    message: `Progress updated for "${params.goal_title}": ${params.progress_update}`,
    update: data 
  };
}

async function addJournalEntry(params: any) {
  console.log('Adding journal entry:', params);
  
  const { data, error } = await supabase
    .from('ai_actions')
    .insert({
      action_type: 'add_journal_entry',
      action_data: {
        content: params.content,
        mood: params.mood,
        tags: params.tags,
        date: new Date().toISOString()
      },
      user_id: 'single-user'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add journal entry: ${error.message}`);
  }

  return { 
    success: true, 
    message: `Journal entry added for ${new Date().toLocaleDateString()}`,
    entry: data 
  };
}

async function trackPhysicalActivity(params: any) {
  console.log('Tracking physical activity:', params);
  
  const { data, error } = await supabase
    .from('ai_actions')
    .insert({
      action_type: 'track_activity',
      action_data: {
        activity_type: params.activity_type,
        duration_minutes: params.duration_minutes,
        intensity: params.intensity,
        notes: params.notes,
        date: new Date().toISOString()
      },
      user_id: 'single-user'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to track activity: ${error.message}`);
  }

  return { 
    success: true, 
    message: `Tracked ${params.duration_minutes} minutes of ${params.activity_type}`,
    activity: data 
  };
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
- Managing contacts and CRM activities (create, search)
- External integrations via n8n workflows (WhatsApp, Calendar, Email, etc.)
- Goal tracking and progress updates
- Journal entries and mood tracking
- Physical activity and exercise logging
- Scheduling reminders and follow-ups
- Analyzing patterns in their journal, goals, and activities
- Providing insights based on their data
- Taking specific actions in the app on their behalf

AVAILABLE ACTIONS:
- Trigger n8n workflows for external integrations (WhatsApp messages, calendar sync, email notifications)
- Add calendar events and view upcoming schedule (via internal tracking or n8n)
- Update goal progress and track achievements
- Add journal entries with mood and tags
- Track physical activities and exercises
- Schedule reminders for any purpose
- Search and manage contacts
- Analyze recent activity patterns

When users request external integrations like WhatsApp messages or calendar events, use the trigger_n8n_workflow function with appropriate workflow_type and data. This allows for real integrations with external services through n8n automation.

Be conversational, helpful, and proactive. Use the available functions when appropriate to help the user accomplish their goals. When taking actions, confirm what you're doing and provide helpful feedback about the results.

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
      case 'trigger_n8n_workflow':
        functionResult = await triggerN8nWorkflow(functionArgs);
        break;
      case 'add_calendar_event':
        functionResult = await addCalendarEvent(functionArgs);
        break;
      case 'get_calendar_events':
        functionResult = await getCalendarEvents(functionArgs);
        break;
      case 'update_goal_progress':
        functionResult = await updateGoalProgress(functionArgs);
        break;
      case 'add_journal_entry':
        functionResult = await addJournalEntry(functionArgs);
        break;
      case 'track_physical_activity':
        functionResult = await trackPhysicalActivity(functionArgs);
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