import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { AudioRecorder, encodeAudioForAPI, playAudioData } from '@/utils/RealtimeAudio';
import { useToast } from '@/hooks/use-toast';

interface VoiceModeProps {
  onClose: () => void;
}

// Animated soundwave component
const SoundWave = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex items-center justify-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-white rounded-full transition-all duration-300 ease-in-out ${
            isActive ? 'animate-pulse' : ''
          }`}
          style={{
            height: isActive ? `${20 + Math.sin(Date.now() * 0.01 + i) * 10}px` : '4px',
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.8s'
          }}
        />
      ))}
    </div>
  );
};

export const VoiceMode: React.FC<VoiceModeProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    initializeVoiceMode();
    return () => {
      cleanup();
    };
  }, []);

  const initializeVoiceMode = async () => {
    try {
      setIsConnecting(true);
      
      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Connect to WebSocket - try multiple connection formats
      console.log("Attempting WebSocket connection...");
      
      try {
        // Try the realtime-voice function first if it exists
        wsRef.current = new WebSocket(`wss://gqwymmauiijshudgstva.supabase.co/functions/v1/realtime-voice`);
        console.log("Trying realtime-voice function...");
      } catch (error) {
        console.log("realtime-voice failed, trying realtime-chat...");
        // Fallback to realtime-chat
        wsRef.current = new WebSocket(`wss://gqwymmauiijshudgstva.supabase.co/functions/v1/realtime-chat`);
      }
      
    wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully!');
        setIsConnected(true);
        setIsConnecting(false);
        
        toast({
          title: "Connected",
          description: "Voice service is ready!",
        });
        
        startListening();
      };

      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data.type, data);
        
        switch (data.type) {
          case 'connection.test':
            console.log('WebSocket connection test:', data.message);
            break;
            
          case 'connection.ready':
            console.log('OpenAI API verified:', data.message);
            toast({
              title: "Connection Ready",
              description: "OpenAI API connection verified successfully"
            });
            break;
            
          case 'echo':
            console.log('Echo received:', data.data);
            break;
            
          case 'error':
            console.error('Voice service error:', data.error);
            toast({
              title: "Voice Service Error",
              description: data.error?.message || "An error occurred with the voice service",
              variant: "destructive"
            });
            break;
            
          case 'session.created':
            console.log('Session created');
            break;
            
          case 'session.updated':
            console.log('Session updated');
            break;
            
          case 'input_audio_buffer.speech_started':
            setIsListening(true);
            break;
            
          case 'input_audio_buffer.speech_stopped':
            setIsListening(false);
            break;
            
          case 'response.audio.delta':
            if (data.delta && audioContextRef.current) {
              setIsSpeaking(true);
              // Convert base64 to Uint8Array
              const binaryString = atob(data.delta);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              await playAudioData(audioContextRef.current, bytes);
            }
            break;
            
          case 'response.audio.done':
            setIsSpeaking(false);
            setResponse('');
            break;
            
          case 'response.audio_transcript.delta':
            setResponse(prev => prev + (data.delta || ''));
            break;
            
          case 'conversation.item.input_audio_transcription.completed':
            setTranscript(data.transcript || '');
            break;
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket connection failed. Trying alternative approach...');
        setIsConnecting(false);
        
        // Try a different connection method
        setTimeout(() => {
          console.log("Retrying with different WebSocket URL...");
          setIsConnecting(true);
          
          // Alternative connection without query params
          wsRef.current = new WebSocket(`wss://gqwymmauiijshudgstva.supabase.co/functions/v1/realtime-chat`);
          setupWebSocketEvents();
        }, 1000);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsConnecting(false);
      };

      // Setup WebSocket event handlers
      setupWebSocketEvents();

    } catch (error) {
      console.error('Failed to initialize voice mode:', error);
      setIsConnecting(false);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize voice mode",
        variant: "destructive"
      });
    }
  };

  const setupWebSocketEvents = () => {
    if (!wsRef.current) return;
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected successfully!');
      setIsConnected(true);
      setIsConnecting(false);
      
      toast({
        title: "Connected",
        description: "Voice service is ready!",
      });
      
      startListening();
    };

    wsRef.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data.type, data);
      
      switch (data.type) {
        case 'connection.test':
          console.log('WebSocket connection test:', data.message);
          break;
          
        case 'connection.ready':
          console.log('OpenAI API verified:', data.message);
          toast({
            title: "Connection Ready",
            description: "OpenAI API connection verified successfully"
          });
          break;
          
        case 'echo':
          console.log('Echo received:', data.data);
          break;
          
        case 'error':
          console.error('Voice service error:', data.error);
          toast({
            title: "Voice Service Error",
            description: data.error?.message || "An error occurred with the voice service",
            variant: "destructive"
          });
          break;
          
        case 'session.created':
          console.log('Session created');
          break;
          
        case 'session.updated':
          console.log('Session updated');
          break;
          
        case 'input_audio_buffer.speech_started':
          setIsListening(true);
          break;
          
        case 'input_audio_buffer.speech_stopped':
          setIsListening(false);
          break;
          
        case 'response.audio.delta':
          if (data.delta && audioContextRef.current) {
            setIsSpeaking(true);
            // Convert base64 to Uint8Array
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            await playAudioData(audioContextRef.current, bytes);
          }
          break;
          
        case 'response.audio.done':
          setIsSpeaking(false);
          setResponse('');
          break;
          
        case 'response.audio_transcript.delta':
          setResponse(prev => prev + (data.delta || ''));
          break;
          
        case 'conversation.item.input_audio_transcription.completed':
          setTranscript(data.transcript || '');
          break;
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setIsConnecting(false);
    };
  };

  const startListening = async () => {
    try {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
      }

      audioRecorderRef.current = new AudioRecorder((audioData) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const encodedAudio = encodeAudioForAPI(audioData);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      });

      await audioRecorderRef.current.start();
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const cleanup = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex flex-col items-center justify-center text-white z-50">
      {/* Close button */}
      <Button
        onClick={onClose}
        variant="ghost"
        size="icon"
        className="absolute top-6 right-6 text-white hover:bg-white/10 h-12 w-12 rounded-full"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center space-y-8 max-w-md mx-auto px-6">
        {/* Status indicator */}
        <div className="relative">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            isConnecting ? 'bg-white/10' : 
            !isConnected ? 'bg-white/5' :
            isSpeaking ? 'bg-white/20 scale-110' : 
            isListening ? 'bg-white/15 scale-105' : 
            'bg-white/10'
          }`}>
            {isConnecting ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <SoundWave isActive={isConnected && (isListening || isSpeaking)} />
            )}
          </div>
          
          {/* Pulse animation when active */}
          {isConnected && (isListening || isSpeaking) && (
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          )}
        </div>

        {/* Status text */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">
            {isConnecting && "Connecting..."}
            {!isConnected && !isConnecting && "Connection Failed"}
            {isConnected && isSpeaking && "Speaking..."}
            {isConnected && isListening && "Listening..."}
            {isConnected && !isListening && !isSpeaking && "I'm listening"}
          </h1>
          
          <p className="text-white/70 text-lg">
            {isConnecting && "Setting up voice connection"}
            {!isConnected && !isConnecting && "Unable to connect to voice service"}
            {isConnected && !isListening && !isSpeaking && "Start speaking anytime"}
            {isConnected && (isListening || isSpeaking) && "Voice conversation active"}
          </p>
        </div>

        {/* Transcript display */}
        {transcript && (
          <div className="bg-white/10 rounded-lg p-4 max-w-full">
            <p className="text-sm opacity-90">You said:</p>
            <p className="text-white">{transcript}</p>
          </div>
        )}

        {/* Response display */}
        {response && (
          <div className="bg-white/10 rounded-lg p-4 max-w-full">
            <p className="text-sm opacity-90">AI response:</p>
            <p className="text-white">{response}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-white/60 text-sm">
          {isConnected ? "Just start talking naturally" : "Please wait..."}
        </p>
      </div>
    </div>
  );
};

export default VoiceMode;