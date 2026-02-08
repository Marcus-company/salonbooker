-- Add services_json column to store multiple services per booking

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'services_json'
    ) THEN
        ALTER TABLE bookings ADD COLUMN services_json TEXT;
        
        COMMENT ON COLUMN bookings.services_json IS 'JSON array of multiple services for this booking';
    END IF;
END $$;

-- Verify column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'services_json';
