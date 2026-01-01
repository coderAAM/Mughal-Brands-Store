-- Add payment_method column to orders table
ALTER TABLE public.orders ADD COLUMN payment_method text DEFAULT 'cod';

-- Add payment_status column to track if payment is confirmed
ALTER TABLE public.orders ADD COLUMN payment_status text DEFAULT 'pending';