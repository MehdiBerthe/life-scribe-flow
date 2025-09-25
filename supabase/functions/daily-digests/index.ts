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
  console.log('Generating embedding for text:', text.substring(0, 100) + '...');
  
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

async function buildAreaDigest(userId: string, area: string, date: Date): Promise<string | null> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all content for this area from the last day
  const { data: ragDocs, error } = await supabase
    .from('rag_docs')
    .select('title, content, metadata')
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())
    .or(`metadata->>area.eq.${area},kind.eq.${area.toLowerCase()}`);

  if (error) {
    console.error('Error fetching RAG docs for digest:', error);
    return null;
  }

  if (!ragDocs || ragDocs.length === 0) {
    return null;
  }

  // Build digest content
  const contentPieces = ragDocs.map(doc => {
    const title = doc.title ? `${doc.title}: ` : '';
    return `${title}${doc.content}`;
  });

  if (contentPieces.length === 0) {
    return null;
  }

  // Summarize content into a paragraph
  const combinedContent = contentPieces.join('\n\n');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Create a concise daily digest paragraph for the ${area} area. Summarize the key themes, insights, and activities from the user's entries. Focus on patterns, progress, and significant events. Keep it under 200 words.`
          },
          {
            role: 'user',
            content: combinedContent
          }
        ],
        max_tokens: 250,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      console.error('OpenAI digest generation failed:', response.status, await response.text());
      return combinedContent.substring(0, 500) + '...'; // Fallback to truncated content
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating digest summary:', error);
    return combinedContent.substring(0, 500) + '...'; // Fallback
  }
}

async function extractStableFacts(userId: string, content: string): Promise<void> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract stable, factual information about the user that could be useful for future reference. Focus on:
- Regular habits and routines (wake time, workout days, etc.)
- Preferences and patterns
- Consistent goals or values
- Personal constraints or requirements

Return only clear, objective facts in the format: "key: value"
Each fact should be on a new line. Only include facts that seem stable/consistent.`
          },
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: 300,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      console.error('OpenAI fact extraction failed:', response.status);
      return;
    }

    const data = await response.json();
    const factsText = data.choices[0].message.content;
    
    // Parse facts and upsert to memories table
    const factLines = factsText.split('\n').filter((line: string) => line.includes(':'));
    
    for (const line of factLines) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const cleanKey = key.trim().toLowerCase();
        const value = valueParts.join(':').trim();
        
        if (cleanKey && value) {
          await supabase
            .from('memories')
            .upsert({
              user_id: userId,
              key: cleanKey,
              value: value,
              confidence: 0.8,
              last_seen_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,key'
            });
        }
      }
    }
  } catch (error) {
    console.error('Error extracting stable facts:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting daily digest processing...');
    
    // Get all unique user IDs from recent RAG docs
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const { data: userIds, error: userError } = await supabase
      .from('rag_docs')
      .select('user_id')
      .gte('created_at', yesterday.toISOString());

    if (userError) {
      throw new Error(`Error fetching user IDs: ${userError.message}`);
    }

    const uniqueUserIds = [...new Set(userIds?.map(row => row.user_id) || [])];
    console.log(`Processing digests for ${uniqueUserIds.length} users`);

    const areas = ['Physical', 'Mental', 'Emotional', 'Spiritual', 'Social', 'Professional', 'Financial'];
    let digestsCreated = 0;
    let factsExtracted = 0;

    for (const userId of uniqueUserIds) {
      let allDayContent = '';
      
      for (const area of areas) {
        const digest = await buildAreaDigest(userId, area, yesterday);
        
        if (digest) {
          // Generate embedding for the digest
          const embedding = await generateEmbedding(digest);
          
          // Upsert digest into rag_docs
          await supabase
            .from('rag_docs')
            .upsert({
              user_id: userId,
              kind: `${area.toLowerCase()}_digest`,
              title: `Daily ${area} Digest - ${yesterday.toLocaleDateString()}`,
              content: digest,
              metadata: { area, digest_date: yesterday.toISOString().split('T')[0] },
              embedding: `[${embedding.join(',')}]`
            }, {
              onConflict: 'user_id,kind,metadata->digest_date'
            });
          
          digestsCreated++;
          allDayContent += `${area}: ${digest}\n\n`;
        }
      }
      
      // Extract stable facts from all day's content
      if (allDayContent) {
        await extractStableFacts(userId, allDayContent);
        factsExtracted++;
      }
    }

    console.log(`Daily digest processing complete. Created ${digestsCreated} digests, extracted facts for ${factsExtracted} users.`);

    return new Response(JSON.stringify({
      success: true,
      digestsCreated,
      factsExtracted,
      usersProcessed: uniqueUserIds.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Daily digest error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});