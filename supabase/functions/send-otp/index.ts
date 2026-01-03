import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { email, phone, action } = await req.json();
    
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

      // Use Lovable AI to generate a friendly email message
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      let emailBody = `Your MUGHAL BRAND'S verification code is: ${otpCode}. This code will expire in 10 minutes.`;
      
      if (LOVABLE_API_KEY) {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                { 
                  role: "system", 
                  content: "You are a friendly customer service assistant for MUGHAL BRAND'S luxury watch store. Generate a short, professional email body for OTP verification. Keep it under 50 words. Do not include subject line." 
                },
                { 
                  role: "user", 
                  content: `Generate an email body for OTP verification. The OTP code is ${otpCode} and it expires in 10 minutes.` 
                }
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            emailBody = aiData.choices?.[0]?.message?.content || emailBody;
          }
        } catch (aiError) {
          console.log('AI generation skipped, using default message:', aiError);
        }
      }

      console.log(`OTP ${otpCode} generated for ${email}. In production, this would be sent via email.`);
      
      // For now, we'll just return success. In production, integrate with Resend or similar
      // The OTP is stored in the database and can be verified
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent successfully',
          // Remove in production - only for testing
          debug_otp: otpCode 
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
