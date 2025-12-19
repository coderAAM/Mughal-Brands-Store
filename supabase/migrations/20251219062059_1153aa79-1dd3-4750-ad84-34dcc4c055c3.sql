-- Add tracking_id column to orders table
ALTER TABLE public.orders ADD COLUMN tracking_id TEXT;

-- Create function to generate tracking ID
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tracking_id := 'MG-' || to_char(now(), 'YYYYMMDD') || '-' || substr(NEW.id::text, 1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate tracking_id on insert
CREATE TRIGGER set_tracking_id
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_tracking_id();