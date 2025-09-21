import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RealtimeMessage {
  type: string;
  [key: string]: any;
}

interface AudioQueue {
  chunks: Uint8Array[];
  isPlaying: boolean;
}

export const useRealtimeVoice = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue>({ chunks: [], isPlaying: false });
  const streamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Convert Float32Array to PCM16 and encode as base64
  const encodeAudioForAPI = useCallback((float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }, []);

  // Create WAV header for PCM16 audio
  const createWavHeader = useCallback((pcmLength: number, sampleRate = 24000) => {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
    // WAV header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + pcmLength, true); // File size
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, 1, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, pcmLength, true); // Subchunk2Size
    
    return new Uint8Array(buffer);
  }, []);

  // Play audio chunk
  const playAudioChunk = useCallback(async (audioData: Uint8Array) => {
    if (!audioContextRef.current) return;

    try {
      // Create WAV file with proper header
      const wavHeader = createWavHeader(audioData.length);
      const wavFile = new Uint8Array(wavHeader.length + audioData.length);
      wavFile.set(wavHeader, 0);
      wavFile.set(audioData, wavHeader.length);

      // Decode and play
      const audioBuffer = await audioContextRef.current.decodeAudioData(wavFile.buffer.slice());
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        // Check if there are more chunks to play
        if (audioQueueRef.current.chunks.length > 0) {
          const nextChunk = audioQueueRef.current.chunks.shift()!;
          playAudioChunk(nextChunk);
        } else {
          audioQueueRef.current.isPlaying = false;
          setIsSpeaking(false);
        }
      };
      
      source.start(0);
    } catch (error) {
      console.error('Error playing audio chunk:', error);
      audioQueueRef.current.isPlaying = false;
      setIsSpeaking(false);
    }
  }, [createWavHeader]);

  // Queue audio for playback
  const queueAudio = useCallback((audioData: Uint8Array) => {
    audioQueueRef.current.chunks.push(audioData);
    
    if (!audioQueueRef.current.isPlaying) {
      audioQueueRef.current.isPlaying = true;
      setIsSpeaking(true);
      const chunk = audioQueueRef.current.chunks.shift()!;
      playAudioChunk(chunk);
    }
  }, [playAudioChunk]);

  // Handle WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: RealtimeMessage = JSON.parse(event.data);
      console.log('Received realtime message:', data.type);
      
      switch (data.type) {
        case 'session.created':
          console.log('Session created successfully');
          break;
          
        case 'session.updated':
          console.log('Session updated successfully');
          setConnectionAttempts(0); // Reset on successful session
          break;
          
        case 'input_audio_buffer.speech_started':
          setIsListening(true);
          break;
          
        case 'input_audio_buffer.speech_stopped':
          setIsListening(false);
          break;
          
        case 'conversation.item.input_audio_transcription.completed':
          setTranscript(data.transcript || '');
          break;
          
        case 'response.audio.delta':
          // Convert base64 audio to bytes and queue for playback
          const audioBytes = atob(data.delta);
          const audioArray = new Uint8Array(audioBytes.length);
          for (let i = 0; i < audioBytes.length; i++) {
            audioArray[i] = audioBytes.charCodeAt(i);
          }
          queueAudio(audioArray);
          break;
          
        case 'response.audio_transcript.delta':
          setResponse(prev => prev + (data.delta || ''));
          break;
          
        case 'response.audio_transcript.done':
          // Response complete
          break;
          
        case 'response.done':
          setResponse('');
          break;
          
        case 'error':
          console.error('Realtime API error:', data);
          toast({
            title: "Voice Error",
            description: data.error?.message || data.message || "An error occurred during voice interaction",
            variant: "destructive",
          });
          break;
      }
    } catch (error) {
      console.error('Error parsing realtime message:', error);
    }
  }, [toast, queueAudio]);

  // Auto-reconnect function
  const attemptReconnect = useCallback(async () => {
    if (connectionAttempts >= 3) {
      console.log('Max reconnection attempts reached');
      toast({
        title: "Connection Failed",
        description: "Unable to maintain voice connection after multiple attempts. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    console.log(`Attempting reconnection ${connectionAttempts + 1}/3`);
    setConnectionAttempts(prev => prev + 1);
    
    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (streamRef.current) {
      connectWebSocket();
    }
  }, [connectionAttempts]);

  // Connect WebSocket only
  const connectWebSocket = useCallback(() => {
    const wsUrl = `wss://gqwymmauiijshudgstva.supabase.co/functions/v1/realtime-voice`;
    console.log('Connecting WebSocket to:', wsUrl);
    
    socketRef.current = new WebSocket(wsUrl);
    
    // Set up connection timeout
    const connectionTimeout = setTimeout(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING) {
        console.log('WebSocket connection timeout');
        socketRef.current.close();
        toast({
          title: "Connection Timeout",
          description: "Could not connect to voice service. Please try again.",
          variant: "destructive",
        });
      }
    }, 10000); // 10 second timeout
    
    socketRef.current.onopen = () => {
      console.log('WebSocket connected successfully');
      clearTimeout(connectionTimeout);
      setIsConnected(true);
      setConnectionAttempts(0);
      
      toast({
        title: "Voice Connected",
        description: "You can now speak to Lexa",
      });
      
      // Set up audio processing if we have a stream
      if (streamRef.current && audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
        const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const audioBase64 = encodeAudioForAPI(new Float32Array(inputData));
          
          // Send audio to OpenAI via edge function
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: audioBase64
            }));
          }
        };
        
        source.connect(processor);
        processor.connect(audioContextRef.current.destination);
        mediaRecorderRef.current = processor as any;
      }
    };
    
    socketRef.current.onmessage = handleMessage;
    
    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      clearTimeout(connectionTimeout);
      setIsConnected(false);
      setIsListening(false);
      setIsSpeaking(false);
      
      toast({
        title: "Connection Error",
        description: "Failed to connect to voice service. Please check your internet connection.",
        variant: "destructive",
      });
    };
    
    socketRef.current.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      clearTimeout(connectionTimeout);
      setIsConnected(false);
      setIsListening(false);
      setIsSpeaking(false);
      
      // Only show error and try to reconnect if it wasn't a manual close
      if (event.code !== 1000 && streamRef.current) {
        console.log('Connection lost, attempting to reconnect...');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(attemptReconnect, 1000);
      }
    };
  }, [handleMessage, encodeAudioForAPI, toast, attemptReconnect]);

  // Connect to realtime voice
  const connect = useCallback(async () => {
    try {
      console.log('Starting voice connection...');
      
      // Skip the HTTP test and go directly to WebSocket connection
      console.log('Skipping HTTP test, connecting directly to WebSocket...');
      
      // Get microphone access
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 24000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        
        console.log('Microphone access granted');
        streamRef.current = stream;
      }

      // Reset connection state
      setConnectionAttempts(0);
      
      // Connect WebSocket
      connectWebSocket();

    } catch (error) {
      console.error('Error connecting to realtime voice:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions and try again.",
        variant: "destructive",
      });
    }
  }, [connectWebSocket, toast]);

  // Disconnect from realtime voice
  const disconnect = useCallback(() => {
    console.log('Disconnecting voice service...');
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect'); // Normal closure
      socketRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      try {
        (mediaRecorderRef.current as any).disconnect();
      } catch (e) {
        // Ignore cleanup errors
      }
      mediaRecorderRef.current = null;
    }
    
    // Clear audio queue
    audioQueueRef.current.chunks = [];
    audioQueueRef.current.isPlaying = false;
    
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setTranscript('');
    setResponse('');
    setConnectionAttempts(0);
  }, []);

  // Send text message
  const sendText = useCallback((text: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    
    const message = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: text
        }]
      }
    };
    
    socketRef.current.send(JSON.stringify(message));
    socketRef.current.send(JSON.stringify({ type: 'response.create' }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isListening,
    isSpeaking,
    transcript,
    response,
    connect,
    disconnect,
    sendText,
  };
};