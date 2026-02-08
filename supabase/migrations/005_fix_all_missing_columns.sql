-- Fix: Add all missing columns to bookings table
-- This migration handles all schema cache errors at once

-- Add all potentially missing columns
DO $$ 
BEGIN
    -- service_duration
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'service_duration'
    ) THEN
        ALTER TABLE bookings ADD COLUMN service_duration VARCHAR(50) DEFAULT '60 min';
    END IF;

    -- service_price
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'service_price'
    ) THEN
        ALTER TABLE bookings ADD COLUMN service_price DECIMAL(10, 2) DEFAULT 0.00;
    END IF;

    -- service_name (if missing)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'service_name'
    ) THEN
        ALTER TABLE bookings ADD COLUMN service_name VARCHAR(255) DEFAULT 'Behandeling';
    END IF;

    -- notes (if missing)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'notes'
    ) THEN
        ALTER TABLE bookings ADD COLUMN notes TEXT;
    END IF;

    -- Refresh schema cache
    PERFORM pg_catalog.pg_reload_conf();
END $$;

-- Verify all columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
