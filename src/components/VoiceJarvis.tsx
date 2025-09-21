import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import '../styles/voice.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface VoiceState {
  idle: 'idle';
  listening: 'listening';
  sending: 'sending';
  speaking: 'speaking';
}

const VoiceJarvis: React.FC = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<keyof VoiceState>('idle');
  const [textInput, setTextInput] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setState('listening');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = async () => {
        setState('sending');
        
        try {
          const recordedAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          
          // Transcribe audio
          const formData = new FormData();
          formData.append('audio', recordedAudioBlob);

          const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('voice-transcribe', {
            body: formData,
          });

          if (transcribeError) throw transcribeError;

          const userText = transcribeData.text.trim();
          if (!userText) {
            toast({
              title: "No speech detected",
              description: "Please try speaking again.",
              variant: "destructive",
            });
            setState('idle');
            resolve();
            return;
          }

          // Add user message
          addMessage('user', userText);

          // Get AI reply
          const { data: replyData, error: replyError } = await supabase.functions.invoke('agent-reply', {
            body: { text: userText, userId: 'single-user' },
          });

          if (replyError) throw replyError;

          const aiReply = replyData.text;
          addMessage('assistant', aiReply);

          // Convert to speech and play
          setState('speaking');
          const { data: speechData, error: speechError } = await supabase.functions.invoke('voice-speak', {
            body: { text: aiReply },
          });

          if (speechError) throw speechError;

          // Play audio
          const audioBytes = atob(speechData.audioContent);
          const audioArray = new Uint8Array(audioBytes.length);
          for (let i = 0; i < audioBytes.length; i++) {
            audioArray[i] = audioBytes.charCodeAt(i);
          }
          const speechAudioBlob = new Blob([audioArray], { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(speechAudioBlob);

          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.onended = () => {
              setState('idle');
              URL.revokeObjectURL(audioUrl);
            };
            await audioRef.current.play();
          }

        } catch (error) {
          console.error('Error processing voice:', error);
          toast({
            title: "Voice Error",
            description: error.message || "An error occurred processing your voice.",
            variant: "destructive",
          });
          setState('idle');
        }
        
        resolve();
      };

      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  }, [addMessage, toast]);

  const handleMicPress = useCallback(() => {
    if (state === 'idle') {
      startRecording();
    } else if (state === 'listening') {
      stopRecording();
    }
  }, [state, startRecording, stopRecording]);

  const handleTextSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || state !== 'idle') return;

    const userText = textInput.trim();
    setTextInput('');
    
    // Add user message
    addMessage('user', userText);
    setState('sending');

    try {
      // Get AI reply
      const { data: replyData, error: replyError } = await supabase.functions.invoke('agent-reply', {
        body: { text: userText, userId: 'single-user' },
      });

      if (replyError) throw replyError;

      const aiReply = replyData.text;
      addMessage('assistant', aiReply);

      // Convert to speech and play
      setState('speaking');
      const { data: speechData, error: speechError } = await supabase.functions.invoke('voice-speak', {
        body: { text: aiReply },
      });

      if (speechError) throw speechError;

      // Play audio
      const audioBytes = atob(speechData.audioContent);
      const audioArray = new Uint8Array(audioBytes.length);
      for (let i = 0; i < audioBytes.length; i++) {
        audioArray[i] = audioBytes.charCodeAt(i);
      }
      const textSpeechBlob = new Blob([audioArray], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(textSpeechBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setState('idle');
          URL.revokeObjectURL(audioUrl);
        };
        await audioRef.current.play();
      }

    } catch (error) {
      console.error('Error processing text:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred processing your message.",
        variant: "destructive",
      });
      setState('idle');
    }
  }, [textInput, state, addMessage, toast]);

  const getMicIcon = () => {
    switch (state) {
      case 'listening':
        return <MicOff className="w-6 h-6" />;
      case 'sending':
      case 'speaking':
        return <div className="w-6 h-6 animate-pulse bg-current rounded-full" />;
      default:
        return <Mic className="w-6 h-6" />;
    }
  };

  const getMicClass = () => {
    const baseClass = "voice-mic-button fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg";
    
    switch (state) {
      case 'listening':
        return `${baseClass} bg-red-500 hover:bg-red-600 voice-mic-listening`;
      case 'sending':
        return `${baseClass} bg-yellow-500 cursor-not-allowed`;
      case 'speaking':
        return `${baseClass} bg-green-500 cursor-not-allowed voice-speaking-pulse`;
      default:
        return `${baseClass} bg-primary hover:bg-primary/90 voice-mic-idle`;
    }
  };

  return (
    <div className="voice-jarvis-container">
      <audio ref={audioRef} />
      
      {/* Chat Messages */}
      {messages.length > 0 && (
        <div className="fixed bottom-24 left-4 right-20 max-h-96 overflow-y-auto space-y-3 voice-chat-container">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[80%] px-4 py-2 rounded-2xl text-sm
                ${message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {message.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Text Input */}
      <form 
        onSubmit={handleTextSubmit}
        className="fixed bottom-6 left-4 right-24 flex gap-2"
      >
        <Input
          type="text"
          placeholder="Type or speak to Lexa..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          disabled={state !== 'idle'}
          className="flex-1 bg-background/80 backdrop-blur-sm border-muted"
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={!textInput.trim() || state !== 'idle'}
          className="h-10 w-10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {/* Voice Button */}
      <button
        onClick={handleMicPress}
        disabled={state === 'sending' || state === 'speaking'}
        className={getMicClass()}
        aria-label={`Voice ${state}`}
      >
        {getMicIcon()}
      </button>
    </div>
  );
};

export default VoiceJarvis;