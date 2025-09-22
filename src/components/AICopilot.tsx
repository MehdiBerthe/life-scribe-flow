import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Send, X, Mic, Sparkles, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import VoiceAssistant from './VoiceAssistant';

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
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'assistant',
    content: "Hi! I'm Lexa, your AI assistant. I can help you manage your contacts, analyze your data, schedule reminders, and provide insights based on your journal, goals, and activities. What would you like to do today?",
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      if (!conversationId && messages.length === 1) {
        const { data: conversation } = await supabase
          .from('conversations')
          .insert({
            messages: JSON.stringify([...messages, userMessage, assistantMessage]),
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

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 ${className || ''}`}>
      {/* Text Chat Interface */}
      <Card className="h-[600px] flex flex-col bg-background border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Chat with Lexa
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVoiceMode(!showVoiceMode)}
            className="text-primary hover:bg-primary/10"
          >
            <Mic className="h-4 w-4" />
            Voice Mode
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-6 py-4">
              {messages.map(message => (
                <div 
                  key={message.id} 
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] ${message.role === 'user' ? 'order-first' : ''}`}>
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
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
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
          <div className="border-t border-primary/10 bg-background">
            <div className="p-4">
              <div className="relative flex items-center gap-2 bg-muted rounded-full px-4 py-3">
                <Input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyPress={handleKeyPress} 
                  placeholder="Message Lexa..." 
                  disabled={isLoading} 
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground" 
                />
                
                <Button 
                  onClick={() => sendMessage()} 
                  disabled={isLoading || !input.trim()} 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Assistant Section */}
      {showVoiceMode && (
        <Card className="bg-background border-primary/20">
          <CardHeader className="pb-4 border-b border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Voice Assistant
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVoiceMode(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <VoiceAssistant className="w-full" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AICopilot;