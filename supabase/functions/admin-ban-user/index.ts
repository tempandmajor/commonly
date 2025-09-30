import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { userId, bannedUntil, reason } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user ban status using admin API
    if (bannedUntil) {
      // Ban user
      const { data, error: banError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { ban_duration: bannedUntil ? 'none' : '876000h' } // 100 years if permanent
      );

      if (banError) {
        throw banError;
      }

      // Log admin action
      await supabaseAdmin.from('admin_actions').insert({
        admin_id: user.id,
        action_type: 'user_suspend',
        target_type: 'user',
        target_id: userId,
        reason: reason || 'No reason provided',
        metadata: {
          banned_until: bannedUntil,
        },
      });

      // Log security event
      await supabaseAdmin.rpc('log_security_event', {
        p_user_id: userId,
        p_event_type: 'permission_change',
        p_action: 'User suspended by admin',
        p_severity: 'high',
        p_metadata: {
          admin_id: user.id,
          reason: reason || 'No reason provided',
        },
      });

      return new Response(
        JSON.stringify({ success: true, message: 'User suspended successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Unban user
      const { data, error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { ban_duration: 'none' }
      );

      if (unbanError) {
        throw unbanError;
      }

      // Log admin action
      await supabaseAdmin.from('admin_actions').insert({
        admin_id: user.id,
        action_type: 'user_reactivate',
        target_type: 'user',
        target_id: userId,
        reason: reason || 'Reactivated by admin',
      });

      // Log security event
      await supabaseAdmin.rpc('log_security_event', {
        p_user_id: userId,
        p_event_type: 'permission_change',
        p_action: 'User reactivated by admin',
        p_severity: 'info',
        p_metadata: {
          admin_id: user.id,
        },
      });

      return new Response(
        JSON.stringify({ success: true, message: 'User reactivated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error updating user ban status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});