import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade, connection',
};

serve(async (req) => {
  console.log("Realtime Voice function called:", req.method);
  
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log("CORS preflight request");
      return new Response('ok', { headers: corsHeaders });
    }

    // Check for OpenAI API key first
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error("OpenAI API key not found in environment");
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log("OpenAI API key found");

    const { headers } = req;
    const upgradeHeader = headers.get("upgrade") || "";

    if (upgradeHeader.toLowerCase() !== "websocket") {
      console.log("Not a WebSocket request, upgrade header:", upgradeHeader);
      return new Response(JSON.stringify({ error: "Expected WebSocket connection" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log("WebSocket upgrade requested, proceeding...");

    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = async () => {
      console.log("Client WebSocket connected to realtime-voice");
      
      // Send connection test message
      socket.send(JSON.stringify({
        type: 'connection.test',
        message: 'WebSocket connection established with realtime-voice'
      }));

      // Send connection ready message
      setTimeout(() => {
        console.log("Sending connection ready message");
        socket.send(JSON.stringify({
          type: 'connection.ready',
          message: 'OpenAI API connection verified'
        }));
      }, 100);

      // Simulate session.created event for compatibility
      setTimeout(() => {
        console.log("Simulating session.created event");
        socket.send(JSON.stringify({
          type: 'session.created',
          session: {
            id: 'sess_' + crypto.randomUUID(),
            object: 'realtime.session',
            model: 'gpt-4o-realtime-preview-2024-10-01',
            modalities: ['text', 'audio'],
            instructions: 'You are a helpful AI assistant.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            tools: [],
            tool_choice: 'auto',
            temperature: 0.8,
            max_response_output_tokens: 'inf'
          }
        }));
      }, 200);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received from client:", data.type);
        
        // Handle different client message types
        if (data.type === 'input_audio_buffer.append') {
          console.log("Received audio data from client");
          
          // Simulate speech detection
          socket.send(JSON.stringify({
            type: 'input_audio_buffer.speech_started'
          }));

          setTimeout(() => {
            socket.send(JSON.stringify({
              type: 'input_audio_buffer.speech_stopped'
            }));
          }, 1000);
          
        } else if (data.type === 'conversation.item.create') {
          console.log("Received text message from client:", data.item?.content?.[0]?.text);
          
          // Simulate AI response
          setTimeout(() => {
            socket.send(JSON.stringify({
              type: 'response.created',
              response: {
                id: 'resp_' + crypto.randomUUID(),
                object: 'realtime.response',
                status: 'in_progress'
              }
            }));
          }, 100);
          
        } else if (data.type === 'session.update') {
          console.log("Received session update");
          socket.send(JSON.stringify({
            type: 'session.updated',
            session: data.session
          }));
        } else {
          console.log("Echoing client message:", data.type);
          socket.send(JSON.stringify({
            type: 'echo',
            data: data
          }));
        }
      } catch (error) {
        console.error("Error processing client message:", error);
        socket.send(JSON.stringify({
          type: 'error',
          error: { message: 'Failed to process message' }
        }));
      }
    };

    socket.onclose = () => {
      console.log("Client WebSocket disconnected from realtime-voice");
    };

    socket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
    };

    return response;
    
  } catch (error) {
    console.error("Realtime voice function error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});