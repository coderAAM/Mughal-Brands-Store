import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const requestBody = await req.json();
    const { email, phone, action, otp } = requestBody;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'send') {
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in database
      const { error: insertError } = await supabase
        .from('otp_verifications')
        .insert({
          email,
          phone,
          otp_code: otpCode,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        });

      if (insertError) {
        console.error('Error storing OTP:', insertError);
        throw new Error('Failed to generate OTP');
      }

      // Send email via Resend
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      
      if (!resendApiKey) {
        console.error('RESEND_API_KEY not configured');
        throw new Error('Email service not configured');
      }

      const resend = new Resend(resendApiKey);

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 30px; text-align: center; }
            .header h1 { color: #1a1a2e; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; text-align: center; }
            .otp-code { background: #1a1a2e; color: #d4af37; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 20px 40px; border-radius: 8px; display: inline-block; margin: 20px 0; }
            .message { color: #333; font-size: 16px; line-height: 1.6; }
            .footer { background: #1a1a2e; color: #999; padding: 20px; text-align: center; font-size: 12px; }
            .expiry { color: #e74c3c; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🕐 MUGHAL BRAND'S</h1>
            </div>
            <div class="content">
              <p class="message">Thank you for your order! Please use the verification code below to complete your purchase:</p>
              <div class="otp-code">${otpCode}</div>
              <p class="message">This code will <span class="expiry">expire in 10 minutes</span>.</p>
              <p class="message">If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2024 MUGHAL BRAND'S - Luxury Timepieces</p>
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "MUGHAL BRAND'S <onboarding@resend.dev>",
          to: [email],
          subject: "Your Order Verification Code - MUGHAL BRAND'S",
          html: emailHtml,
        });

        console.log('Email sent successfully:', emailResponse);
      } catch (emailError: any) {
        console.error('Error sending email:', emailError);
        throw new Error('Failed to send verification email');
      }

      console.log(`OTP ${otpCode} generated and sent to ${email}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification code sent to your email'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    if (action === 'verify') {
      const { otp } = await req.json();
      
      // Check OTP in database
      const { data, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otp)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid or expired OTP' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Mark OTP as verified
      await supabase
        .from('otp_verifications')
        .update({ verified: true })
        .eq('id', data.id);

      return new Response(
        JSON.stringify({ success: true, message: 'OTP verified successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
