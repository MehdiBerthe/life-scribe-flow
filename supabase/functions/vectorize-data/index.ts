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
      input: text.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding API error: ${await response.text()}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

// Vectorize contacts
async function vectorizeContacts() {
  console.log('Starting contact vectorization...');
  
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', 'single-user');

  if (error) {
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }

  let processed = 0;
  for (const contact of contacts || []) {
    // Create searchable text content
    const content = [
      contact.name,
      contact.email,
      contact.phone,
      contact.company,
      contact.current_situation,
      contact.working_on,
      contact.how_to_add_value,
      contact.notes
    ].filter(Boolean).join(' ');

    if (!content.trim()) continue;

    try {
      const embedding = await getEmbedding(content);
      
      // Check if embedding already exists
      const { data: existing } = await supabase
        .from('embeddings')
        .select('id')
        .eq('content_type', 'contact')
        .eq('content_id', contact.id)
        .single();

      if (existing) {
        // Update existing embedding
        await supabase
          .from('embeddings')
          .update({
            content,
            embedding,
            metadata: {
              name: contact.name,
              segment: contact.segment,
              company: contact.company,
              last_touch: contact.last_touch,
              next_touch: contact.next_touch
            }
          })
          .eq('id', existing.id);
      } else {
        // Insert new embedding
        await supabase
          .from('embeddings')
          .insert({
            content_type: 'contact',
            content_id: contact.id,
            content,
            embedding,
            metadata: {
              name: contact.name,
              segment: contact.segment,
              company: contact.company,
              last_touch: contact.last_touch,
              next_touch: contact.next_touch
            },
            user_id: 'single-user'
          });
      }
      
      processed++;
      console.log(`Processed contact ${processed}/${contacts.length}: ${contact.name}`);
    } catch (error) {
      console.error(`Error processing contact ${contact.name}:`, error);
    }
  }
  
  return { type: 'contacts', processed, total: contacts.length };
}

// Create comprehensive content for different data types
function createContentText(item: any, type: string): string {
  switch (type) {
    case 'journal':
      return `Journal entry from ${item.date}: ${item.title}. ${item.content}. Area: ${item.area}. Energy: ${item.energy_level}`;
    case 'goal':
      return `Goal: ${item.title}. Description: ${item.description}. Category: ${item.category}. Due: ${item.due_date}. Status: ${item.status}`;
    case 'transaction':
      return `Transaction: ${item.description}. Amount: $${item.amount}. Category: ${item.category}. Date: ${item.date}. Account: ${item.account}`;
    case 'reading':
      return `Book: ${item.title} by ${item.author}. Category: ${item.category}. Status: ${item.status}. Progress: ${item.progress}%. Rating: ${item.rating}`;
    case 'physical':
      return `Physical log from ${item.date}: Weight: ${item.weight}kg, Sleep: ${item.sleep_hours}h, Exercise: ${item.exercise_minutes}min. Energy: ${item.energy_level}`;
    default:
      return JSON.stringify(item);
  }
}

// Generic vectorization function for any data type
async function vectorizeDataType(tableName: string, contentType: string) {
  console.log(`Starting ${contentType} vectorization...`);
  
  // Get data from localStorage (since this is a frontend-only app)
  // This function will be called from the frontend with the data
  return { type: contentType, processed: 0, total: 0, note: 'Use frontend data' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data, dataType } = await req.json();

    if (action === 'vectorize_contacts') {
      const result = await vectorizeContacts();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'vectorize_data' && data && dataType) {
      console.log(`Vectorizing ${dataType} data with ${data.length} items`);
      
      let processed = 0;
      for (const item of data) {
        const content = createContentText(item, dataType);
        
        if (!content.trim()) continue;

        try {
          const embedding = await getEmbedding(content);
          
          // Check if embedding already exists
          const { data: existing } = await supabase
            .from('embeddings')
            .select('id')
            .eq('content_type', dataType)
            .eq('content_id', item.id)
            .maybeSingle();

          const embeddingData = {
            content_type: dataType,
            content_id: item.id,
            content,
            embedding,
            metadata: {
              ...item,
              date: item.date || item.created_at || new Date().toISOString().split('T')[0]
            },
            user_id: 'single-user'
          };

          if (existing) {
            await supabase
              .from('embeddings')
              .update(embeddingData)
              .eq('id', existing.id);
          } else {
            await supabase
              .from('embeddings')
              .insert(embeddingData);
          }
          
          processed++;
          console.log(`Processed ${dataType} ${processed}/${data.length}`);
        } catch (error) {
          console.error(`Error processing ${dataType} item:`, error);
        }
      }
      
      return new Response(JSON.stringify({ 
        type: dataType, 
        processed, 
        total: data.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Vectorization error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});