import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade, connection',
};

serve(async (req) => {
  try {
    console.log(`${req.method} request received`);
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Check for OpenAI API key first
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error("OpenAI API key not found in environment");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log("OpenAI API key found, length:", openAIApiKey.length);

    const { headers } = req;
    const upgradeHeader = headers.get("upgrade") || "";

    if (upgradeHeader.toLowerCase() !== "websocket") {
      console.log("Non-WebSocket request, upgrade header:", upgradeHeader);
      return new Response(JSON.stringify({ error: "Expected WebSocket connection" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log("WebSocket upgrade requested");

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openAISocket: WebSocket | null = null;

  socket.onopen = async () => {
    console.log("Client WebSocket connected");
    
    // Connect to OpenAI Realtime API
    try {
      console.log("Attempting to connect to OpenAI Realtime API...");
      
      // Test OpenAI API connectivity first
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        }
      });
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error("OpenAI API test failed:", testResponse.status, errorText);
        socket.send(JSON.stringify({
          type: 'error',
          error: {
            message: `OpenAI API authentication failed: ${testResponse.status} - ${errorText.slice(0, 200)}`
          }
        }));
        socket.close();
        return;
      }
      
      console.log("OpenAI API test successful, connecting to realtime...");
      
      // Connect to OpenAI Realtime API with authorization header
      openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", [
        `Bearer ${openAIApiKey}`
      ]);
      
      openAISocket.onopen = () => {
        console.log("Connected to OpenAI Realtime API");
      };

      openAISocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("OpenAI message:", data.type);
        
        // Send session configuration after session.created
        if (data.type === 'session.created') {
          const sessionConfig = {
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: "You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise but helpful.",
              voice: "alloy",
              input_audio_format: "pcm16",
              output_audio_format: "pcm16", 
              input_audio_transcription: {
                model: "whisper-1"
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              temperature: 0.8,
              max_response_output_tokens: "inf"
            }
          };
          
          openAISocket?.send(JSON.stringify(sessionConfig));
          console.log("Session configuration sent");
        }
        
        // Forward all messages to client
        socket.send(event.data);
      };

      openAISocket.onclose = () => {
        console.log("OpenAI WebSocket closed");
        socket.close();
      };

      openAISocket.onerror = (error) => {
        console.error("OpenAI WebSocket error:", error);
        socket.send(JSON.stringify({
          type: 'error',
          error: {
            message: 'OpenAI WebSocket connection failed'
          }
        }));
        socket.close();
      };
    } catch (error) {
      console.error("Failed to create OpenAI WebSocket:", error);
      socket.send(JSON.stringify({
        type: 'error',
        error: {
          message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
      socket.close();
    }
  };

  socket.onmessage = (event) => {
    if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
      console.log("Forwarding to OpenAI:", JSON.parse(event.data).type);
      openAISocket.send(event.data);
    }
  };

  socket.onclose = () => {
    console.log("Client WebSocket disconnected");
    if (openAISocket) {
      openAISocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
    if (openAISocket) {
      openAISocket.close();
    }
  };

  return response;
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});