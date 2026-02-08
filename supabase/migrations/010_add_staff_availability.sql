-- Add availability column to staff table
-- Stores JSON array of availability slots per staff member

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'availability'
    ) THEN
        ALTER TABLE staff ADD COLUMN availability JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN staff.availability IS 'Staff availability schedule as JSON array';
    END IF;
END $$;

-- Verify column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'staff' AND column_name = 'availability';
