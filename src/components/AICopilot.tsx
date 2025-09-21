import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, User, Mic, MicOff, Send, Sparkles, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';
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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  
  // Legacy voice states (for non-realtime mode)
  const [legacyIsListening, setLegacyIsListening] = useState(false);
  const [legacyIsSpeaking, setLegacyIsSpeaking] = useState(false);
  
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Realtime voice hook
  const {
    isConnected,
    isListening: realtimeIsListening,
    isSpeaking: realtimeIsSpeaking,
    transcript,
    response,
    connect,
    disconnect,
    sendText,
  } = useRealtimeVoice();

  // Legacy voice recording refs (for non-realtime mode)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Use appropriate state based on modal mode
  const isListening = showVoiceModal ? realtimeIsListening : legacyIsListening;
  const isSpeaking = showVoiceModal ? realtimeIsSpeaking : legacyIsSpeaking;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize audio element for legacy mode
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
  }, []);

  // Add realtime messages to chat
  useEffect(() => {
    if (transcript) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: transcript,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
    }
  }, [transcript]);

  useEffect(() => {
    if (response) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage?.role === 'assistant' && !lastMessage.function_call) {
          // Update the last assistant message
          newMessages[newMessages.length - 1] = assistantMessage;
        } else {
          // Add new assistant message
          newMessages.push(assistantMessage);
        }
        return newMessages;
      });
    }
  }, [response]);

  // Toggle voice modal
  const toggleVoiceModal = useCallback(async () => {
    if (showVoiceModal) {
      disconnect();
      setShowVoiceModal(false);
    } else {
      setShowVoiceModal(true);
      await connect();
    }
  }, [showVoiceModal, connect, disconnect]);

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
      setLegacyIsListening(true);
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
    if (!mediaRecorderRef.current || !legacyIsListening) return;

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = async () => {
        setLegacyIsListening(false);
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
  }, [legacyIsListening, toast]);

  const toggleListening = useCallback(() => {
    if (legacyIsListening) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [legacyIsListening, startRecording, stopRecording]);

  const speakText = useCallback(async (text: string) => {
    try {
      setLegacyIsSpeaking(true);
      
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
          setLegacyIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audioRef.current.play();
      }

    } catch (error) {
      console.error('Error playing speech:', error);
      setLegacyIsSpeaking(false);
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

      // Speak the response (only in legacy mode)
      if (data.message && !data.function_call && !showVoiceModal) {
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
  
  return (
    <div className="h-[calc(100vh-12rem)] w-full max-w-4xl mx-auto flex flex-col bg-background">
      {/* Simple Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">AI Co-Pilot</h2>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 py-4 max-w-3xl mx-auto">
          {messages.map(message => (
            <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-[95%] ${message.role === 'user' ? 'order-first' : ''}`}>
                <div className={`p-6 rounded-2xl ${message.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  
                  {message.function_call && (
                    <div className="mt-3 p-3 bg-background/20 rounded-lg text-xs">
                      <div className="font-medium opacity-80">Action: {message.function_call.name}</div>
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
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm">
              </div>
              <div className="p-4 rounded-2xl bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      {/* Input Area */}
      <div className="border-t bg-background">
        <div className="max-w-3xl mx-auto p-4">
          <div className="relative flex items-center gap-2 bg-muted rounded-full px-4 py-3">
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyPress={handleKeyPress} 
              placeholder="Message Lexa" 
              disabled={isLoading} 
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground" 
            />
            
            {/* Voice Mode Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleVoiceModal} 
              disabled={isLoading}
              className="h-8 w-8 rounded-full hover:bg-background"
            >
              <Mic className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !input.trim()} 
              size="icon" 
              className="h-8 w-8 rounded-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Voice Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background rounded-3xl p-8 max-w-sm w-full mx-4 text-center relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVoiceModal}
              className="absolute top-4 right-4 h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Voice Visualization */}
            <div className="mb-8 mt-4">
              <div className={`w-32 h-32 mx-auto rounded-full transition-all duration-300 ${
                realtimeIsListening 
                  ? 'bg-gradient-to-br from-red-400 to-red-600 animate-pulse scale-110' 
                  : realtimeIsSpeaking 
                  ? 'bg-gradient-to-br from-green-400 to-green-600 animate-pulse scale-105'
                  : 'bg-gradient-to-br from-blue-400 to-blue-600'
              }`} />
            </div>

            {/* Status Text */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">
                {realtimeIsListening ? 'Listening...' : realtimeIsSpeaking ? 'Speaking...' : isConnected ? 'Connected' : 'Connecting...'}
              </h3>
              {transcript && (
                <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3 mb-4">
                  {transcript}
                </p>
              )}
              {response && (
                <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                  {response}
                </p>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button
                variant={realtimeIsListening ? "destructive" : "default"}
                size="lg"
                className="rounded-full w-16 h-16"
                disabled={!isConnected}
              >
                <Mic className="h-6 w-6" />
              </Button>
            </div>

            {/* Text Input for Voice Mode */}
            {isConnected && (
              <div className="mt-6">
                <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
                  <Input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                        e.preventDefault();
                        sendText(input.trim());
                        setInput('');
                      }
                    }}
                    placeholder="Type to Lexa..." 
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground text-sm" 
                  />
                  
                  <Button 
                    onClick={() => {
                      if (input.trim()) {
                        sendText(input.trim());
                        setInput('');
                      }
                    }}
                    disabled={!input.trim()} 
                    size="sm" 
                    className="h-6 w-6 rounded-full p-0"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AICopilot;