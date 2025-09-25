import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateEmbedding(text: string): Promise<number[]> {
  console.log('Generating embedding for query:', text.substring(0, 100) + '...');
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, query, kinds, startTs, endTs, topK = 8 } = await req.json();

    if (!userId || !query) {
      throw new Error('Missing required fields: userId, query');
    }

    console.log('Processing RAG search request:', { userId, query, kinds, startTs, endTs, topK });

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    console.log('Generated query embedding with dimensions:', queryEmbedding.length);

    // Call the RPC function for hybrid search
    const { data, error } = await supabase.rpc('match_rag_docs', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      user_id: userId,
      kinds: kinds || null,
      start_ts: startTs || null,
      end_ts: endTs || null,
      k: topK
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} matching documents`);

    return new Response(JSON.stringify(data || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('RAG search error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});