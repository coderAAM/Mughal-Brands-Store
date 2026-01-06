-- Fix security issues by restricting OTP table access
-- OTP verification should only happen server-side via edge function

-- Drop existing permissive policies on otp_verifications
DROP POLICY IF EXISTS "Anyone can create OTP verification" ON public.otp_verifications;
DROP POLICY IF EXISTS "Anyone can read OTP by email" ON public.otp_verifications;
DROP POLICY IF EXISTS "Anyone can update OTP verification" ON public.otp_verifications;

-- Create restrictive policies - only service role can access OTP table
-- This means all OTP operations must go through the edge function
CREATE POLICY "Service role only for OTP insert"
ON public.otp_verifications
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Service role only for OTP select"
ON public.otp_verifications
FOR SELECT
USING (false);

CREATE POLICY "Service role only for OTP update"
ON public.otp_verifications
FOR UPDATE
USING (false);

-- Add policy for users to SELECT their own recently created orders (for tracking_id)
CREATE POLICY "Users can view their own orders by email"
ON public.orders
FOR SELECT
USING (
  customer_email = current_setting('request.headers', true)::json->>'x-customer-email'
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
  )
);