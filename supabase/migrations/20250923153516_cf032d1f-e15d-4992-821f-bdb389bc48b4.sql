-- Create demartini_docs table for storing reflection sessions
CREATE TABLE public.demartini_docs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT ('single-user'::text)::uuid,
  title TEXT NOT NULL,
  side_c_mode TEXT CHECK (side_c_mode IN ('self', 'relief', 'grief')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  progress JSONB NOT NULL DEFAULT '{"current_column": 1, "completed_columns": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demartini_docs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own demartini docs" 
ON public.demartini_docs 
FOR SELECT 
USING (user_id = ('single-user'::text)::uuid);

CREATE POLICY "Users can create their own demartini docs" 
ON public.demartini_docs 
FOR INSERT 
WITH CHECK (user_id = ('single-user'::text)::uuid);

CREATE POLICY "Users can update their own demartini docs" 
ON public.demartini_docs 
FOR UPDATE 
USING (user_id = ('single-user'::text)::uuid);

CREATE POLICY "Users can delete their own demartini docs" 
ON public.demartini_docs 
FOR DELETE 
USING (user_id = ('single-user'::text)::uuid);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_demartini_docs_updated_at
BEFORE UPDATE ON public.demartini_docs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();