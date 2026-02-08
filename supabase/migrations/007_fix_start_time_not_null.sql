-- URGENT FIX: start_time column with proper default
-- Handles: null value violates not-null constraint

DO $$ 
BEGIN
    -- Add start_time if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'start_time'
    ) THEN
        ALTER TABLE bookings ADD COLUMN start_time TIME NOT NULL DEFAULT '09:00';
    END IF;

    -- Update any null values to default
    UPDATE bookings SET start_time = '09:00' WHERE start_time IS NULL;
    
    -- Also fix end_time if it exists and has issues
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'end_time'
    ) THEN
        UPDATE bookings SET end_time = '10:00' WHERE end_time IS NULL;
    END IF;
END $$;

-- Verify fix
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name IN ('start_time', 'end_time', 'booking_time');
