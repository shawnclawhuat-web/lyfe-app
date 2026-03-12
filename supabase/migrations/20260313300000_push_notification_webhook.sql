-- Push notification webhook trigger
-- Uses pg_net to call the send-push-notification edge function on every INSERT into notifications.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_push_dispatcher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://nvtedkyjwulkzjeoqjgx.supabase.co/functions/v1/send-push-notification',
        body := jsonb_build_object(
            'record', jsonb_build_object(
                'id', NEW.id,
                'user_id', NEW.user_id,
                'type', NEW.type,
                'title', NEW.title,
                'body', NEW.body,
                'data', NEW.data
            )
        ),
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
        )
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER push_notification_webhook
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_push_dispatcher();
