import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

async function compressText(content: string, maxTokens: number): Promise<string> {
  console.log(`Compressing text with max tokens: ${maxTokens}`);
  
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
          role: 'user',
          content: `Compress to ≤${maxTokens} tokens, dense bullets, preserve dates/names, remove fluff. Return plain text.\n\n${content}`
        }
      ],
      max_tokens: maxTokens + 50, // Allow some buffer for the response
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { snippets, maxTokens = 150 } = await req.json();

    if (!snippets || !Array.isArray(snippets)) {
      throw new Error('Missing or invalid snippets array');
    }

    console.log(`Processing ${snippets.length} snippets with max tokens: ${maxTokens}`);

    // Process all snippets in parallel
    const compressionPromises = snippets.map(async (snippet: { id: number; content: string }) => {
      if (!snippet.id || !snippet.content) {
        throw new Error('Each snippet must have id and content');
      }

      try {
        const compressedText = await compressText(snippet.content, maxTokens);
        return {
          id: snippet.id,
          text: compressedText
        };
      } catch (error) {
        console.error(`Error compressing snippet ${snippet.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          id: snippet.id,
          text: `Error: ${errorMessage}`
        };
      }
    });

    const items = await Promise.all(compressionPromises);

    console.log(`Successfully compressed ${items.length} snippets`);

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Compress snippets error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});