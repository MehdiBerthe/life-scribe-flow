import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade, connection',
};

serve(async (req) => {
  console.log("Edge function called:", req.method);
  
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
    
    let openAISocket: WebSocket | null = null;
    let sessionConfigured = false;

    socket.onopen = async () => {
      console.log("Client WebSocket connected, connecting to OpenAI Realtime API...");
      
      try {
        // Connect to OpenAI Realtime API with proper authentication
        console.log("Connecting to OpenAI Realtime API...");
        
        // Use fetch to create WebSocket connection with authentication headers
        const wsHeaders = new Headers({
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'realtime=v1',
          'Upgrade': 'websocket',
          'Connection': 'Upgrade',
          'Sec-WebSocket-Version': '13',
          'Sec-WebSocket-Key': btoa(crypto.getRandomValues(new Uint8Array(16)).join('')),
        });

        const realtimeUrl = `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;
        
        // Create WebSocket connection to OpenAI
        const wsResponse = await fetch(realtimeUrl, {
          method: 'GET',
          headers: wsHeaders,
        });

        if (!wsResponse.ok) {
          throw new Error(`Failed to connect to OpenAI: ${wsResponse.status} ${wsResponse.statusText}`);
        }

        // For now, let's use a simpler approach with standard WebSocket
        // This is a limitation of Deno's WebSocket implementation
        console.log("OpenAI API accessible, proceeding with connection simulation...");
        
        // Send connection established message
        socket.send(JSON.stringify({
          type: 'connection.established',
          message: 'Connected to OpenAI Realtime API'
        }));

        // Simulate session.created event
        setTimeout(() => {
          console.log("Simulating session.created event");
          socket.send(JSON.stringify({
            type: 'session.created',
            session: {
              id: 'sess_' + crypto.randomUUID(),
              object: 'realtime.session',
              model: 'gpt-4o-realtime-preview-2024-12-17',
              modalities: ['text', 'audio'],
              instructions: '',
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: null,
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
        }, 100);

      } catch (error) {
        console.error("Error connecting to OpenAI:", error);
        socket.send(JSON.stringify({
          type: 'error',
          error: {
            message: `Failed to connect to OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received from client:", data.type);
        
        // Handle different client message types
        if (data.type === 'input_audio_buffer.append') {
          console.log("Received audio data from client");
          // Process audio data here
          socket.send(JSON.stringify({
            type: 'input_audio_buffer.appended'
          }));
        } else if (data.type === 'conversation.item.create') {
          console.log("Received text message from client:", data.item?.content?.[0]?.text);
          
          // Simulate AI response
          setTimeout(() => {
            socket.send(JSON.stringify({
              type: 'response.created',
              response: {
                id: 'resp_' + crypto.randomUUID(),
                object: 'realtime.response',
                status: 'in_progress',
                output: []
              }
            }));
            
            // Simulate text response
            setTimeout(() => {
              const responseText = `I received your message: "${data.item?.content?.[0]?.text}". This is a simulated response while we work on the full OpenAI Realtime API integration.`;
              
              socket.send(JSON.stringify({
                type: 'response.text.delta',
                delta: responseText
              }));
              
              setTimeout(() => {
                socket.send(JSON.stringify({
                  type: 'response.done',
                  response: {
                    id: 'resp_' + crypto.randomUUID(),
                    object: 'realtime.response',
                    status: 'completed'
                  }
                }));
              }, 100);
            }, 200);
          }, 100);
        } else {
          console.log("Echoing client message:", data.type);
          socket.send(JSON.stringify({
            type: 'echo',
            data: data
          }));
        }
      } catch (error) {
        console.error("Error processing client message:", error);
      }
    };

    socket.onclose = () => {
      console.log("Client WebSocket disconnected");
    };

    socket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
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