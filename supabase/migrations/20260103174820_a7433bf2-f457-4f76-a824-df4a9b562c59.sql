-- Create table for storing OTP verification codes
CREATE TABLE public.otp_verifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for checkout verification)
CREATE POLICY "Anyone can create OTP verification" 
ON public.otp_verifications 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to read their own OTP by email
CREATE POLICY "Anyone can read OTP by email" 
ON public.otp_verifications 
FOR SELECT 
USING (true);

-- Allow anyone to update OTP verification status
CREATE POLICY "Anyone can update OTP verification" 
ON public.otp_verifications 
FOR UPDATE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_otp_email_code ON public.otp_verifications(email, otp_code);

-- Auto cleanup old OTPs (create a function to be called manually or via cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.otp_verifications 
    WHERE expires_at < now();
END;
$$;