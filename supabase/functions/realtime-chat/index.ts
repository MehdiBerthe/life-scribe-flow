import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade, connection',
};

serve(async (req) => {
  console.log("Realtime Chat function called:", req.method);
  
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log("CORS preflight request");
      return new Response('ok', { headers: corsHeaders });
    }

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
      console.log("Client WebSocket connected to realtime-chat");
      
      // Send connection ready message
      socket.send(JSON.stringify({
        type: 'connection.ready',
        message: 'Realtime chat service ready'
      }));

      // Simulate session.created event
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
            output_audio_format: 'pcm16'
          }
        }));
      }, 500);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received from client:", data.type);
        
        // Echo back for testing
        socket.send(JSON.stringify({
          type: 'echo',
          original: data,
          timestamp: Date.now()
        }));
        
      } catch (error) {
        console.error("Error processing client message:", error);
        socket.send(JSON.stringify({
          type: 'error',
          error: { message: 'Failed to process message' }
        }));
      }
    };

    socket.onclose = () => {
      console.log("Client WebSocket disconnected from realtime-chat");
    };

    socket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
    };

    return response;
    
  } catch (error) {
    console.error("Realtime chat function error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});