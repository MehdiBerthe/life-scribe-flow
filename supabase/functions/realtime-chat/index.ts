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

    socket.onopen = () => {
      console.log("Client WebSocket connected, testing OpenAI API...");
      
      // Send a simple connection test message first
      socket.send(JSON.stringify({
        type: 'connection.test',
        message: 'WebSocket connection established'
      }));
      
      // Test basic OpenAI connectivity
      fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        }
      })
      .then(testResponse => {
        if (!testResponse.ok) {
          console.error("OpenAI API test failed:", testResponse.status);
          socket.send(JSON.stringify({
            type: 'error',
            error: {
              message: `OpenAI API authentication failed: ${testResponse.status}. Please check your API key and billing status.`
            }
          }));
          return;
        }
        
        console.log("OpenAI API test successful");
        socket.send(JSON.stringify({
          type: 'connection.ready',
          message: 'OpenAI API connection verified'
        }));
      })
      .catch(error => {
        console.error("OpenAI API test error:", error);
        socket.send(JSON.stringify({
          type: 'error',
          error: {
            message: `OpenAI API connection failed: ${error.message}`
          }
        }));
      });
    };

    socket.onmessage = (event) => {
      console.log("Received message from client:", event.data);
      // For now, just echo back
      socket.send(JSON.stringify({
        type: 'echo',
        data: JSON.parse(event.data)
      }));
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