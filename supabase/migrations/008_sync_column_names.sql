-- CRITICAL FIX: Sync database column names with code
-- Issue: Database has 'start_time', code uses 'booking_time'

DO $$ 
BEGIN
    -- If start_time exists but booking_time doesn't, rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'start_time'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'booking_time'
    ) THEN
        -- Rename start_time to booking_time
        ALTER TABLE bookings RENAME COLUMN start_time TO booking_time;
        
        -- Ensure it has proper constraints
        ALTER TABLE bookings ALTER COLUMN booking_time SET NOT NULL;
        ALTER TABLE bookings ALTER COLUMN booking_time SET DEFAULT '09:00';
    END IF;
    
    -- If booking_time doesn't exist at all, create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'booking_time'
    ) THEN
        ALTER TABLE bookings ADD COLUMN booking_time VARCHAR(10) NOT NULL DEFAULT '09:00';
    END IF;
    
    -- Fix any null values
    UPDATE bookings SET booking_time = '09:00' WHERE booking_time IS NULL;
    
    -- Same for end_time if it exists (map to booking_end_time or keep)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'end_time'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'booking_end_time'
    ) THEN
        ALTER TABLE bookings RENAME COLUMN end_time TO booking_end_time;
    END IF;
END $$;

-- Final verification
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
