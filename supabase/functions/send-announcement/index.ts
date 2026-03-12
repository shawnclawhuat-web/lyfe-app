/**
 * User-initiated edge function: admin sends an agency-wide announcement.
 *
 * Auth: Verifies caller is admin role.
 * Input: { title: string, body: string }
 * Creates a notification row for every active user.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // ── Auth check ───────────────────────────────────────────────
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401,
                headers: corsHeaders,
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
            global: { headers: { Authorization: `Bearer ${token}` } },
        });

        const {
            data: { user: caller },
            error: authError,
        } = await userClient.auth.getUser();
        if (authError || !caller) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        // Service-role client for data lookups
        const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

        // Verify caller is admin
        const { data: callerProfile } = await supabase.from('users').select('role').eq('id', caller.id).single();

        if (callerProfile?.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Only admins can send announcements' }), {
                status: 403,
                headers: corsHeaders,
            });
        }

        // ── Input validation ─────────────────────────────────────────
        const { title, body } = await req.json();
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return new Response(JSON.stringify({ error: 'title is required' }), { status: 400, headers: corsHeaders });
        }
        if (body !== undefined && typeof body !== 'string') {
            return new Response(JSON.stringify({ error: 'body must be a string' }), {
                status: 400,
                headers: corsHeaders,
            });
        }

        // ── Fetch all users ──────────────────────────────────────────
        const { data: users } = await supabase.from('users').select('id');

        if (!users || users.length === 0) {
            return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders });
        }

        // Bulk insert in batches of 500
        const BATCH_SIZE = 500;
        let totalSent = 0;

        for (let i = 0; i < users.length; i += BATCH_SIZE) {
            const batch = users.slice(i, i + BATCH_SIZE);
            const rows = batch.map((u: { id: string }) => ({
                user_id: u.id,
                type: 'agency_announcement',
                title: title.trim(),
                body: body?.trim() || null,
                data: { route: '/(tabs)/home/notifications' },
            }));

            await supabase.from('notifications').insert(rows);
            totalSent += rows.length;
        }

        return new Response(JSON.stringify({ sent: totalSent }), { headers: corsHeaders });
    } catch (err) {
        console.error('send-announcement error:', err);
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
    }
});
