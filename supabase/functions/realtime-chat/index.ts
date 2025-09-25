import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openAISocket: WebSocket | null = null;

  socket.onopen = () => {
    console.log("Client WebSocket connected");
    
    // Connect to OpenAI Realtime API
    openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", [], {
      headers: {
        "Authorization": `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    openAISocket.onopen = () => {
      console.log("Connected to OpenAI Realtime API");
      
      // Send session configuration after connection
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
      
      openAISocket.send(JSON.stringify(sessionConfig));
    };

    openAISocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("OpenAI message:", data.type);
      
      // Forward all messages to client
      socket.send(event.data);
    };

    openAISocket.onclose = () => {
      console.log("OpenAI WebSocket closed");
      socket.close();
    };

    openAISocket.onerror = (error) => {
      console.error("OpenAI WebSocket error:", error);
      socket.close();
    };
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
});