-- Fix RLS issues by enabling RLS on contacts table
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contacts table
CREATE POLICY "Users can view their own contacts" 
ON public.contacts 
FOR SELECT 
USING (user_id = ('single-user'::text)::uuid);

CREATE POLICY "Users can insert their own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (user_id = ('single-user'::text)::uuid);

CREATE POLICY "Users can update their own contacts" 
ON public.contacts 
FOR UPDATE 
USING (user_id = ('single-user'::text)::uuid);

CREATE POLICY "Users can delete their own contacts" 
ON public.contacts 
FOR DELETE 
USING (user_id = ('single-user'::text)::uuid);