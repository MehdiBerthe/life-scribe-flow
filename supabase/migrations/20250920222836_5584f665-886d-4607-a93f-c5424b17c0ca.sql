-- Update contacts table to work without authentication
-- Make user_id optional and set a default value for single-user setup
ALTER TABLE public.contacts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.contacts ALTER COLUMN user_id SET DEFAULT 'single-user'::text::uuid;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;

-- Disable RLS since we're removing authentication
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;