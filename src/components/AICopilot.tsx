import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Send, Mic, MicOff, Sparkles, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Message {
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
  className?: string;
}

export const AICopilot: React.FC<AICopilotProps> = ({ className }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageContent?: string) => {
    const messageText = messageContent || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-copilot', {
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

      // If this is the first conversation, save it
      if (!conversationId && messages.length === 0) {
        const { data: conversation } = await supabase
          .from('conversations')
          .insert({
            messages: JSON.stringify([userMessage, assistantMessage]),
            user_id: 'single-user'
          })
          .select()
          .single();
        
        if (conversation) {
          setConversationId(conversation.id);
        }
      } else if (conversationId) {
        // Update existing conversation
        await supabase
          .from('conversations')
          .update({
            messages: JSON.stringify([...messages, userMessage, assistantMessage]),
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (base64Audio) {
          const { data, error } = await supabase.functions.invoke('voice-transcribe', {
            body: { audio: base64Audio }
          });

          if (error) throw error;
          
          if (data.text && data.text.trim()) {
            await sendMessage(data.text);
          }
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={`h-full w-full flex flex-col bg-background ${className || ''}`}>
      {/* Welcome Message - only show when no messages */}
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">How can I help you today?</h1>
            <p className="text-muted-foreground max-w-md">
              I'm your AI assistant. Ask me anything or use the microphone to speak with me.
            </p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      {messages.length > 0 && (
        <ScrollArea className="flex-1 px-4 md:px-8 lg:px-16">
          <div className="max-w-4xl mx-auto space-y-6 py-8">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`p-4 rounded-2xl ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    
                    {message.function_call && (
                      <div className="mt-3 p-3 bg-background/20 rounded-lg text-xs">
                        <div className="font-medium opacity-80">
                          Action: {message.function_call.name}
                        </div>
                        {message.function_call.result && (
                          <div className="opacity-60 mt-1">
                            Result: {JSON.stringify(message.function_call.result, null, 2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="p-4 rounded-2xl bg-muted">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t bg-background">
        <div className="max-w-4xl mx-auto p-4">
          <div className="relative flex items-center gap-3 bg-muted rounded-full px-6 py-4">
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyPress={handleKeyPress} 
              placeholder="Type your message..." 
              disabled={isLoading || isRecording} 
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground text-base" 
            />
            
            <Button 
              onClick={toggleRecording} 
              disabled={isLoading} 
              size="icon" 
              variant={isRecording ? "destructive" : "ghost"}
              className={`h-10 w-10 rounded-full transition-colors ${
                isRecording 
                  ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                  : 'hover:bg-accent'
              }`}
            >
              {isRecording ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
            
            <Button 
              onClick={() => sendMessage()} 
              disabled={isLoading || !input.trim() || isRecording} 
              size="icon" 
              className="h-10 w-10 rounded-full"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {isRecording && (
            <div className="text-center mt-3">
              <p className="text-sm text-muted-foreground">
                🎤 Recording... Click the microphone again to stop
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AICopilot;