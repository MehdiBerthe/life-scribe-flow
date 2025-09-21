-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table for vectorized data
CREATE TABLE public.embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT ('single-user'::text)::uuid,
  content_type TEXT NOT NULL, -- 'journal', 'contact', 'transaction', 'goal', etc.
  content_id UUID NOT NULL, -- Reference to the original record
  content TEXT NOT NULL, -- The actual text content
  metadata JSONB, -- Additional context (date, category, etc.)
  embedding vector(1536), -- OpenAI ada-002 embedding size
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient vector similarity search
CREATE INDEX ON public.embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON public.embeddings (user_id);
CREATE INDEX ON public.embeddings (content_type);
CREATE INDEX ON public.embeddings (created_at);

-- Enable RLS
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own embeddings" 
ON public.embeddings 
FOR SELECT 
USING (user_id = ('single-user'::text)::uuid);

CREATE POLICY "Users can insert their own embeddings" 
ON public.embeddings 
FOR INSERT 
WITH CHECK (user_id = ('single-user'::text)::uuid);

CREATE POLICY "Users can update their own embeddings" 
ON public.embeddings 
FOR UPDATE 
USING (user_id = ('single-user'::text)::uuid);

CREATE POLICY "Users can delete their own embeddings" 
ON public.embeddings 
FOR DELETE 
USING (user_id = ('single-user'::text)::uuid);

-- Create conversations table for chat history
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT ('single-user'::text)::uuid,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  context_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Users can manage their own conversations" 
ON public.conversations 
FOR ALL 
USING (user_id = ('single-user'::text)::uuid);

-- Create trigger for updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create AI actions table for tracking actions taken by the AI
CREATE TABLE public.ai_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT ('single-user'::text)::uuid,
  conversation_id UUID REFERENCES public.conversations(id),
  action_type TEXT NOT NULL, -- 'send_message', 'schedule_reminder', 'create_contact', etc.
  action_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_actions
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_actions
CREATE POLICY "Users can manage their own ai_actions" 
ON public.ai_actions 
FOR ALL 
USING (user_id = ('single-user'::text)::uuid);