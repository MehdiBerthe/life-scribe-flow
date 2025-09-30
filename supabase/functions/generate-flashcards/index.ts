import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { noteContent, bookTitle } = await req.json();
    console.log(`Generating flashcards for: ${bookTitle}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a helpful AI assistant that creates educational flashcards from reading notes. 
Generate 10 high-quality flashcards that test understanding of the key concepts from the notes.
Each flashcard should have a clear question and a comprehensive answer.
Focus on the most important concepts, insights, and learnings from the material.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Create 10 flashcards from these notes about "${bookTitle}":\n\n${noteContent}` 
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_flashcards",
              description: "Generate flashcards from reading notes",
              parameters: {
                type: "object",
                properties: {
                  flashcards: {
                    type: "array",
                    description: "Array of flashcard objects",
                    items: {
                      type: "object",
                      properties: {
                        question: {
                          type: "string",
                          description: "The question for the flashcard"
                        },
                        answer: {
                          type: "string",
                          description: "The answer to the flashcard question"
                        }
                      },
                      required: ["question", "answer"],
                      additionalProperties: false
                    },
                    minItems: 10,
                    maxItems: 10
                  }
                },
                required: ["flashcards"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_flashcards" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    // Extract flashcards from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const flashcardsData = JSON.parse(toolCall.function.arguments);
    console.log(`Generated ${flashcardsData.flashcards.length} flashcards`);

    return new Response(
      JSON.stringify({ flashcards: flashcardsData.flashcards }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-flashcards function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
