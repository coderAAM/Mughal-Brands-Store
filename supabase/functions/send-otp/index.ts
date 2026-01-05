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
    
    console.log('Received request:', { email, phone, action });
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'send') {
      // Check cooldown - prevent sending OTP if one was sent in the last 60 seconds
      const { data: recentOtp } = await supabase
        .from('otp_verifications')
        .select('created_at')
        .eq('email', email)
        .gt('created_at', new Date(Date.now() - 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentOtp) {
        const timeSinceLastOtp = Math.floor((Date.now() - new Date(recentOtp.created_at).getTime()) / 1000);
        const remainingCooldown = 60 - timeSinceLastOtp;
        console.log('Cooldown active, seconds remaining:', remainingCooldown);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Please wait ${remainingCooldown} seconds before requesting a new code`,
            cooldownRemaining: remainingCooldown
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log('Generated OTP for:', email);
      
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
        console.log('Sending email to:', email);
        const emailResponse = await resend.emails.send({
          from: "MUGHAL BRAND'S <orders@mughalbrands.com>",
          to: [email],
          subject: "Your Order Verification Code - MUGHAL BRAND'S",
          html: emailHtml,
        });

        console.log('Email sent successfully:', emailResponse);
      } catch (emailError: any) {
        console.error('Error sending email:', emailError);
        throw new Error(`Failed to send verification email: ${emailError.message}`);
      }

      console.log(`OTP generated and sent to ${email}`);
      
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
      console.log('Verifying OTP for:', email, 'with code:', otp);
      
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

      console.log('OTP verification result:', { data, error });

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

      console.log('OTP verified successfully for:', email);

      return new Response(
        JSON.stringify({ success: true, message: 'OTP verified successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'send-confirmation') {
      const { orderItems, trackingIds, paymentMethod, customerName, customerAddress } = requestBody;
      
      console.log('Sending order confirmation to:', email);

      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        console.error('RESEND_API_KEY not configured');
        throw new Error('Email service not configured');
      }

      const resend = new Resend(resendApiKey);

      const itemsHtml = orderItems.map((item: any) => `
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid #eee;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <img src="${item.image_url || ''}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />
              <div>
                <p style="margin: 0; font-weight: bold; color: #333;">${item.name}</p>
                <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Qty: ${item.quantity}</p>
              </div>
            </div>
          </td>
          <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #d4af37;">
            Rs. ${(item.price * item.quantity).toLocaleString()}
          </td>
        </tr>
      `).join('');

      const trackingIdsHtml = trackingIds.map((id: string) => `
        <div style="background: #f4f4f4; padding: 10px 15px; border-radius: 8px; margin: 5px 0; font-family: monospace; font-size: 16px; color: #d4af37; font-weight: bold;">
          ${id}
        </div>
      `).join('');

      const totalAmount = orderItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

      const confirmationHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 30px; text-align: center; }
            .header h1 { color: #1a1a2e; margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .success-icon { text-align: center; margin-bottom: 20px; }
            .success-icon span { font-size: 60px; }
            h2 { color: #1a1a2e; text-align: center; margin: 0 0 20px; }
            .section { margin: 25px 0; padding: 20px; background: #fafafa; border-radius: 8px; }
            .section-title { font-weight: bold; color: #1a1a2e; margin-bottom: 15px; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; }
            .total-row { font-size: 18px; font-weight: bold; }
            .footer { background: #1a1a2e; color: #999; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🕐 MUGHAL BRAND'S</h1>
            </div>
            <div class="content">
              <div class="success-icon">
                <span>✅</span>
              </div>
              <h2>Order Confirmed!</h2>
              <p style="text-align: center; color: #666;">Thank you for your order, ${customerName}!</p>
              
              <div class="section">
                <p class="section-title">📦 Your Tracking ID${trackingIds.length > 1 ? 's' : ''}:</p>
                ${trackingIdsHtml}
                <p style="font-size: 12px; color: #666; margin-top: 10px;">Use ${trackingIds.length > 1 ? 'these IDs' : 'this ID'} to track your order on our website.</p>
              </div>

              <div class="section">
                <p class="section-title">🛒 Order Items:</p>
                <table>
                  ${itemsHtml}
                  <tr class="total-row">
                    <td style="padding: 15px;">Total</td>
                    <td style="padding: 15px; text-align: right; color: #d4af37;">Rs. ${totalAmount.toLocaleString()}</td>
                  </tr>
                </table>
              </div>

              <div class="section">
                <p class="section-title">📍 Delivery Details:</p>
                <p style="margin: 5px 0; color: #333;">${customerName}</p>
                <p style="margin: 5px 0; color: #666;">${customerAddress || 'Address not provided'}</p>
                <p style="margin: 10px 0 0; color: #666;"><strong>Payment:</strong> ${paymentMethod}</p>
              </div>

              <p style="text-align: center; color: #666; font-size: 14px; margin-top: 25px;">
                We'll notify you when your order ships. If you have any questions, feel free to contact us!
              </p>
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
          from: "MUGHAL BRAND'S <orders@mughalbrands.com>",
          to: [email],
          subject: `Order Confirmed - ${trackingIds.join(', ')} - MUGHAL BRAND'S`,
          html: confirmationHtml,
        });

        console.log('Order confirmation email sent:', emailResponse);
      } catch (emailError: any) {
        console.error('Error sending confirmation email:', emailError);
        throw new Error(`Failed to send confirmation email: ${emailError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Order confirmation sent' }),
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
