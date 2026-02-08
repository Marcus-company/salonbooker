-- COMPLETE SCHEMA FIX FOR BOOKINGS TABLE
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- 1. Reload schema cache
SELECT pg_catalog.pg_reload_conf();

-- 2. Add all missing columns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_time VARCHAR(10) NOT NULL DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS service_duration VARCHAR(50) DEFAULT '',
ADD COLUMN IF NOT EXISTS service_price DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS staff_name VARCHAR(255) DEFAULT '';

-- 3. Verify all columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
