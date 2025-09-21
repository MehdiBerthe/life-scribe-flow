-- Check if pg_cron extension exists in any schema and remove from public
-- Query to check current extension schema
SELECT schemaname FROM pg_extension WHERE extname = 'pg_cron';

-- For this specific use case, let's create the cron job without installing the extension
-- as it might already be available system-wide on Supabase
-- Remove the cron.schedule call and recreate it properly

-- Delete the existing scheduled job first
SELECT cron.unschedule('daily-digests-job');

-- Check if we can use the cron functions without installing the extension
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