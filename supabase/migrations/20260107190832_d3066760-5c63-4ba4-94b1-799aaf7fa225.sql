-- Remove the public order insert policy since orders are now created via edge function
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create new policy: only service role can insert orders
CREATE POLICY "Orders created via server only"
ON public.orders
FOR INSERT
WITH CHECK (false);