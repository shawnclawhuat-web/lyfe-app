-- Schedule cron jobs for notification edge functions
-- ============================================================================
-- Requires pg_cron and pg_net extensions (available on Supabase Pro plans).
-- If not available, use an external cron service to call the edge function URLs.

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ── Event reminders: every 5 minutes ─────────────────────────────────────────
SELECT cron.schedule(
    'send-event-reminders',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://nvtedkyjwulkzjeoqjgx.supabase.co/functions/v1/send-event-reminders',
        body := '{}'::jsonb,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
        )
    );
    $$
);

-- ── Interview reminders: every 5 minutes ─────────────────────────────────────
SELECT cron.schedule(
    'send-interview-reminders',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://nvtedkyjwulkzjeoqjgx.supabase.co/functions/v1/send-interview-reminders',
        body := '{}'::jsonb,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
        )
    );
    $$
);

-- ── Stale leads check: daily at 1am UTC (9am SGT) ───────────────────────────
SELECT cron.schedule(
    'check-stale-leads',
    '0 1 * * *',
    $$
    SELECT net.http_post(
        url := 'https://nvtedkyjwulkzjeoqjgx.supabase.co/functions/v1/check-stale-leads',
        body := '{}'::jsonb,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
        )
    );
    $$
);

-- ── Roadshow summary: daily at 2am UTC (10am SGT) ───────────────────────────
SELECT cron.schedule(
    'send-roadshow-summary',
    '0 2 * * *',
    $$
    SELECT net.http_post(
        url := 'https://nvtedkyjwulkzjeoqjgx.supabase.co/functions/v1/send-roadshow-summary',
        body := '{}'::jsonb,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
        )
    );
    $$
);
