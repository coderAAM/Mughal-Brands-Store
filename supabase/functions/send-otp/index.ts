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
          message: 'Verification code sent to your email',
          otpCode: otpCode // Return OTP for display on website
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

    // Create order server-side after OTP verification
    if (action === 'create-order') {
      const { orderData, items } = requestBody;
      
      console.log('Creating orders for:', email);

      // Verify that OTP was verified recently for this email
      const { data: verifiedOtp, error: otpError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('email', email)
        .eq('verified', true)
        .gt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Within last 30 minutes
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (otpError || !verifiedOtp) {
        return new Response(
          JSON.stringify({ success: false, message: 'Please verify your email first' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Create orders
      const orders = items.map((item: any) => ({
        customer_name: orderData.name,
        customer_email: email,
        customer_phone: orderData.phone,
        customer_address: orderData.address || null,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        product_image_url: item.image_url,
        quantity: item.quantity,
        total_amount: item.price * item.quantity,
        notes: orderData.notes || null,
        status: "pending",
        payment_method: orderData.paymentMethod,
        payment_status: orderData.paymentMethod === "cod" ? "pending" : "awaiting_payment",
      }));

      const { data: createdOrders, error: insertError } = await supabase
        .from("orders")
        .insert(orders)
        .select("tracking_id");

      if (insertError) {
        console.error('Error creating orders:', insertError);
        throw new Error('Failed to create order');
      }

      const trackingIds = createdOrders?.map((order: any) => order.tracking_id).filter(Boolean) || [];
      
      console.log('Orders created with tracking IDs:', trackingIds);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Order created successfully',
          trackingIds
        }),
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

    // Track order by tracking ID - public access
    if (action === 'track-order') {
      const { trackingId } = requestBody;
      
      console.log('Tracking order:', trackingId);

      if (!trackingId) {
        return new Response(
          JSON.stringify({ success: false, message: 'Tracking ID is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_id', trackingId.trim())
        .maybeSingle();

      if (orderError) {
        console.error('Error fetching order:', orderError);
        throw new Error('Failed to fetch order');
      }

      if (!order) {
        return new Response(
          JSON.stringify({ success: false, message: 'Order not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('Order found:', order.tracking_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          order: order
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send order status update notification
    if (action === 'send-status-update') {
      const { orderDetails, newStatus, trackingId } = requestBody;
      
      console.log('Sending status update email to:', email, 'Status:', newStatus);

      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        console.error('RESEND_API_KEY not configured');
        throw new Error('Email service not configured');
      }

      const resend = new Resend(resendApiKey);

      const statusMessages: Record<string, { title: string; message: string; icon: string }> = {
        shipped: {
          title: 'Your Order Has Been Shipped! 🚚',
          message: 'Great news! Your order is on its way to you. You can track your delivery using the tracking ID below.',
          icon: '🚚'
        },
        delivered: {
          title: 'Your Order Has Been Delivered! ✅',
          message: 'Your order has been successfully delivered. Thank you for shopping with us!',
          icon: '✅'
        },
        confirmed: {
          title: 'Your Order Has Been Confirmed! 📦',
          message: 'Your order has been confirmed and is being prepared for shipping.',
          icon: '📦'
        },
        cancelled: {
          title: 'Your Order Has Been Cancelled ❌',
          message: 'Unfortunately, your order has been cancelled. If you have any questions, please contact us.',
          icon: '❌'
        }
      };

      const statusInfo = statusMessages[newStatus] || {
        title: `Order Status Update`,
        message: `Your order status has been updated to: ${newStatus}`,
        icon: '📋'
      };

      const statusUpdateHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 30px; text-align: center; }
            .header h1 { color: #1a1a2e; margin: 0; font-size: 28px; }
            .content { padding: 30px; text-align: center; }
            .status-icon { font-size: 60px; margin-bottom: 20px; }
            h2 { color: #1a1a2e; margin: 0 0 15px; }
            .message { color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px; }
            .tracking-box { background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .tracking-id { font-family: monospace; font-size: 18px; color: #d4af37; font-weight: bold; }
            .order-info { background: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; }
            .order-info p { margin: 8px 0; color: #333; }
            .footer { background: #1a1a2e; color: #999; padding: 20px; text-align: center; font-size: 12px; }
            .btn { display: inline-block; background: #d4af37; color: #1a1a2e; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🕐 MUGHAL BRAND'S</h1>
            </div>
            <div class="content">
              <div class="status-icon">${statusInfo.icon}</div>
              <h2>${statusInfo.title}</h2>
              <p class="message">${statusInfo.message}</p>
              
              <div class="tracking-box">
                <p style="margin: 0 0 8px; color: #666; font-size: 14px;">Tracking ID:</p>
                <span class="tracking-id">${trackingId}</span>
              </div>

              <div class="order-info">
                <p><strong>Product:</strong> ${orderDetails.product_name}</p>
                <p><strong>Quantity:</strong> ${orderDetails.quantity}</p>
                <p><strong>Total:</strong> Rs. ${orderDetails.total_amount?.toLocaleString()}</p>
              </div>

              <a href="https://mughalbrands.com/track" class="btn">Track Your Order</a>
            </div>
            <div class="footer">
              <p>© 2024 MUGHAL BRAND'S - Luxury Timepieces</p>
              <p>Thank you for shopping with us!</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "MUGHAL BRAND'S <orders@mughalbrands.com>",
          to: [email],
          subject: `${statusInfo.title} - ${trackingId}`,
          html: statusUpdateHtml,
        });

        console.log('Status update email sent:', emailResponse);
      } catch (emailError: any) {
        console.error('Error sending status update email:', emailError);
        throw new Error(`Failed to send status update email: ${emailError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Status update email sent' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get order history by email - for customers to view their past orders
    if (action === 'get-order-history') {
      console.log('Fetching order history for:', email);

      if (!email) {
        return new Response(
          JSON.stringify({ success: false, message: 'Email is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', email.toLowerCase().trim())
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw new Error('Failed to fetch orders');
      }

      console.log('Found', orders?.length || 0, 'orders for', email);

      return new Response(
        JSON.stringify({ 
          success: true, 
          orders: orders || []
        }),
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
