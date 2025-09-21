import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, User, Mic, MicOff, Send, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import '../styles/voice.css';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  function_call?: {
    name: string;
    arguments: any;
    result: any;
  };
  timestamp: Date;
}
interface AICopilotProps {
  isOpen?: boolean;
  onClose?: () => void;
}
const AICopilot: React.FC<AICopilotProps> = ({
  isOpen = true,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'assistant',
    content: "Hi! I'm Lexa, your AI assistant. I can help you manage your contacts, analyze your data, schedule reminders, and provide insights based on your journal, goals, and activities. What would you like to do today?",
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
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
      setIsListening(true);
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
    if (!mediaRecorderRef.current || !isListening) return;

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsLoading(true);
        
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
            setIsLoading(false);
            resolve();
            return;
          }

          // Set the transcribed text in the input
          setInput(userText);
          setIsLoading(false);

        } catch (error) {
          console.error('Error processing voice:', error);
          toast({
            title: "Voice Error",
            description: error.message || "An error occurred processing your voice.",
            variant: "destructive",
          });
          setIsLoading(false);
        }
        
        resolve();
      };

      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  }, [isListening, toast]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isListening, startRecording, stopRecording]);

  const speakText = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      
      const { data: speechData, error: speechError } = await supabase.functions.invoke('voice-speak', {
        body: { text },
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
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audioRef.current.play();
      }

    } catch (error) {
      console.error('Error playing speech:', error);
      setIsSpeaking(false);
      toast({
        title: "Speech Error",
        description: "Could not play audio response.",
        variant: "destructive",
      });
    }
  }, [toast]);
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('ai-copilot', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          conversationId
        }
      });
      if (error) throw error;
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        function_call: data.function_call,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response
      if (data.message && !data.function_call) {
        speakText(data.message);
      }

      // If this is the first conversation, save it
      if (!conversationId && messages.length === 1) {
        const {
          data: conversation
        } = await supabase.from('conversations').insert({
          messages: JSON.stringify([...messages, userMessage, assistantMessage]),
          user_id: 'single-user'
        }).select().single();
        if (conversation) {
          setConversationId(conversation.id);
        }
      } else if (conversationId) {
        // Update existing conversation
        await supabase.from('conversations').update({
          messages: JSON.stringify([...messages, userMessage, assistantMessage]),
          updated_at: new Date().toISOString()
        }).eq('id', conversationId);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  if (!isOpen) {
    return null;
  }
  return <div className="h-[calc(100vh-12rem)] w-full max-w-4xl mx-auto flex flex-col bg-background">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 py-4 max-w-3xl mx-auto">
          {messages.map(message => <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant'}
              
              <div className={`max-w-[95%] ${message.role === 'user' ? 'order-first' : ''}`}>
                <div className={`p-6 rounded-2xl ${message.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  
                  {message.function_call && <div className="mt-3 p-3 bg-background/20 rounded-lg text-xs">
                      <div className="font-medium opacity-80">Action: {message.function_call.name}</div>
                      {message.function_call.result && <div className="opacity-60 mt-1">
                          Result: {JSON.stringify(message.function_call.result, null, 2)}
                        </div>}
                    </div>}
                </div>
              </div>

              {message.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>}
            </div>)}
          
          {isLoading && <div className="flex gap-4 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm">
              </div>
              <div className="p-4 rounded-2xl bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      {/* Input Area */}
      <div className="border-t bg-background">
        <div className="max-w-3xl mx-auto p-4">
          <div className="relative flex items-center gap-2 bg-muted rounded-full px-4 py-3">
            <Input value={input} onChange={e => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Message Lexa" disabled={isLoading} className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground" />
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleListening} 
              disabled={isLoading || isSpeaking} 
              className={`h-8 w-8 rounded-full transition-colors ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'hover:bg-background'
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !input.trim() || isSpeaking} 
              size="icon" 
              className="h-8 w-8 rounded-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default AICopilot;