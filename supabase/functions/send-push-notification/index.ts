/**
 * Push notification dispatcher — triggered by DB webhook on notifications INSERT.
 *
 * Receives the new notification row, looks up the user's push token and preferences,
 * and sends an Expo push notification if appropriate.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
    type: 'INSERT';
    table: 'notifications';
    record: {
        id: string;
        user_id: string;
        type: string;
        title: string;
        body: string | null;
        data: Record<string, unknown>;
        is_read: boolean;
        created_at: string;
    };
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload: WebhookPayload = await req.json();

        // Validate webhook payload
        if (payload.type !== 'INSERT' || !payload.record?.user_id) {
            return new Response(JSON.stringify({ skipped: true, reason: 'not an INSERT or missing user_id' }), {
                headers: corsHeaders,
            });
        }

        const { record } = payload;

        // Service-role client for user lookup
        const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

        // Fetch user's push token and notification preferences
        const { data: user } = await supabase
            .from('users')
            .select('push_token, notification_preferences')
            .eq('id', record.user_id)
            .single();

        if (!user?.push_token) {
            return new Response(JSON.stringify({ skipped: true, reason: 'no push token' }), {
                headers: corsHeaders,
            });
        }

        // Check if user opted out of push for this notification type
        const prefs = (user.notification_preferences as Record<string, boolean>) || {};
        if (prefs[record.type] === false) {
            return new Response(JSON.stringify({ skipped: true, reason: 'user opted out' }), {
                headers: corsHeaders,
            });
        }

        // Send Expo push notification
        const pushMessage = {
            to: user.push_token,
            sound: 'default',
            title: record.title,
            body: record.body || undefined,
            data: record.data || {},
        };

        const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pushMessage),
        });

        const pushResult = await pushResponse.json();

        return new Response(JSON.stringify({ sent: true, pushResult }), { headers: corsHeaders });
    } catch (err) {
        console.error('send-push-notification error:', err);
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
    }
});
