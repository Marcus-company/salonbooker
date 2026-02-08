-- Fix: Ensure booking_time column exists in bookings table
-- This migration handles the schema cache error

-- Add booking_time column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'booking_time'
    ) THEN
        ALTER TABLE bookings ADD COLUMN booking_time VARCHAR(10) NOT NULL DEFAULT '09:00';
        
        -- Update existing rows to have a valid time
        UPDATE bookings SET booking_time = '09:00' WHERE booking_time IS NULL;
    END IF;
END $$;

-- Refresh schema cache
COMMENT ON COLUMN bookings.booking_time IS 'Booking time in HH:MM format';

-- Verify column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'booking_time';
