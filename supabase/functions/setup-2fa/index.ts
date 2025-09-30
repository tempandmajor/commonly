import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { authenticator } from 'npm:otplib@12.0.1';
import QRCode from 'npm:qrcode@1.5.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the request
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, type = 'totp' } = await req.json();

    if (!email || email !== user.email) {
      return new Response(
        JSON.stringify({ error: 'Invalid email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'totp') {
      // Generate a secret for TOTP
      const secret = authenticator.generateSecret();
      
      // Create the service name and account name for the QR code
      const service = 'CommonlyApp';
      const account = email;
      const otpauth = authenticator.keyuri(account, service, secret);
      
      // Generate QR code as SVG
      const qrCodeSvg = await QRCode.toString(otpauth, { 
        type: 'svg',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Generate backup codes (10 codes, 8 characters each)
      const backupCodes: string[] = [];
      for (let i = 0; i < 10; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        backupCodes.push(code);
      }

      // Store the 2FA configuration in the database
      const { error: insertError } = await supabaseClient
        .from('user_2fa_settings')
        .upsert({
          user_id: user.id,
          secret: secret,
          backup_codes: backupCodes,
          is_enabled: false, // Will be enabled after verification
          type: 'totp',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error storing 2FA settings:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to setup 2FA' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          qrCode: qrCodeSvg,
          secret: secret,
          backupCodes: backupCodes,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (type === 'email') {
      // Store email 2FA preference
      const { error: insertError } = await supabaseClient
        .from('user_2fa_settings')
        .upsert({
          user_id: user.id,
          secret: null,
          backup_codes: [],
          is_enabled: true,
          type: 'email',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error storing email 2FA settings:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to setup email 2FA' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid 2FA type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Setup 2FA error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 