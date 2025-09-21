import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Request received:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  // Handle regular HTTP requests (for testing)
  if (req.method === 'POST') {
    console.log('Regular HTTP POST request - service health check');
    try {
      const body = await req.json();
      console.log('Request body:', body);
      
      // Check if OpenAI API key is available
      const openAIKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIKey) {
        return new Response(JSON.stringify({ 
          status: 'error', 
          message: 'OpenAI API key not configured' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        status: 'ok', 
        message: 'Voice service is running and ready' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    console.log('Not a WebSocket request, upgrade header:', upgradeHeader);
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  console.log('WebSocket upgrade request');
  const { socket, response } = Deno.upgradeWebSocket(req);
  let openAISocket: WebSocket | null = null;
  let heartbeatInterval: number | null = null;

  socket.onopen = () => {
    console.log('Client connected to realtime voice');
    
    // Set up heartbeat to keep connection alive
    heartbeatInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    }, 30000); // Every 30 seconds
    
    try {
      // Check if OpenAI API key is available
      const openAIKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIKey) {
        console.error('OpenAI API key not found');
        socket.send(JSON.stringify({
          type: 'error',
          message: 'OpenAI API key not configured'
        }));
        socket.close();
        return;
      }
      
      // Connect to OpenAI Realtime API with retry logic
      const connectToOpenAI = () => {
        const openAIUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
        console.log('Connecting to OpenAI:', openAIUrl);
        
        openAISocket = new WebSocket(openAIUrl, [], {
          headers: {
            "Authorization": `Bearer ${openAIKey}`,
            "OpenAI-Beta": "realtime=v1",
          },
        });

        openAISocket.onopen = () => {
          console.log('Connected to OpenAI Realtime API');
          
          // Send session configuration after connection
          const sessionConfig = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: "You are Lexa, a helpful AI assistant. Keep responses concise and conversational, suitable for voice interaction. Be friendly and natural in your responses.",
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
              temperature: 0.7,
              max_response_output_tokens: 500
            }
          };
          
          console.log('Sending session config');
          openAISocket!.send(JSON.stringify(sessionConfig));
        };

        openAISocket.onmessage = (event) => {
          // Forward all messages to client
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };

        openAISocket.onerror = (error) => {
          console.error('OpenAI WebSocket error:', error);
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Connection to OpenAI failed'
            }));
          }
        };

        openAISocket.onclose = (event) => {
          console.log('OpenAI connection closed:', event.code, event.reason);
          
          // Try to reconnect to OpenAI if client is still connected
          if (socket.readyState === WebSocket.OPEN && event.code !== 1000) {
            console.log('Attempting to reconnect to OpenAI...');
            setTimeout(connectToOpenAI, 2000);
          }
        };
      };

      connectToOpenAI();
      
    } catch (error) {
      console.error('Error setting up OpenAI connection:', error);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Failed to connect to OpenAI: ' + error.message
        }));
      }
    }
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      
      // Forward client messages to OpenAI
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(JSON.stringify(message));
      } else {
        console.error('OpenAI socket not ready, state:', openAISocket?.readyState);
      }
    } catch (error) {
      console.error('Error parsing client message:', error);
    }
  };

  socket.onclose = (event) => {
    console.log('Client disconnected:', event.code, event.reason);
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    if (openAISocket) {
      openAISocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error('Client WebSocket error:', error);
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    if (openAISocket) {
      openAISocket.close();
    }
  };

  return response;
});