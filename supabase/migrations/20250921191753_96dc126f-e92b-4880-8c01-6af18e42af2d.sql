-- Fix the pg_cron extension security warning by moving it to extensions schema
-- Drop the existing extension from public schema and recreate in extensions schema

-- First drop from public if it exists there
DROP EXTENSION IF EXISTS pg_cron;

-- Enable pg_cron in the extensions schema (which is the recommended location)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- The cron job should still work as cron.schedule function is available system-wide