-- Fix the demartini_docs table to use a proper UUID for single-user
-- First, drop the existing table to recreate it properly
DROP TABLE IF EXISTS public.demartini_docs;

-- Create demartini_docs table with proper UUID handling
CREATE TABLE public.demartini_docs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  title TEXT NOT NULL,
  side_c_mode TEXT CHECK (side_c_mode IN ('self', 'relief', 'grief')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  progress JSONB NOT NULL DEFAULT '{"current_column": 1, "completed_columns": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demartini_docs ENABLE ROW LEVEL SECURITY;

-- Create policies using the proper UUID
CREATE POLICY "Users can view their own demartini docs" 
ON public.demartini_docs 
FOR SELECT 
USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Users can create their own demartini docs" 
ON public.demartini_docs 
FOR INSERT 
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Users can update their own demartini docs" 
ON public.demartini_docs 
FOR UPDATE 
USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Users can delete their own demartini docs" 
ON public.demartini_docs 
FOR DELETE 
USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_demartini_docs_updated_at
BEFORE UPDATE ON public.demartini_docs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();