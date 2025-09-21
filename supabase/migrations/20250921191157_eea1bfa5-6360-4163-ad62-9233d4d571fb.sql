-- Setup cron job for daily digests (requires pg_cron extension)
-- This should be run manually after the edge function is deployed

-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily digest processing to run every day at 2 AM UTC
SELECT cron.schedule(
  'daily-digests-job',           -- job name
  '0 2 * * *',                  -- cron schedule: every day at 2 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://gqwymmauiijshudgstva.supabase.co/functions/v1/daily-digests',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd3ltbWF1aWlqc2h1ZGdzdHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDI2MzQsImV4cCI6MjA3Mzk3ODYzNH0.GXQ7X4-4ICoSSl7q1-5gtrzv7T8UQ77SaqpdMqCQahk"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);