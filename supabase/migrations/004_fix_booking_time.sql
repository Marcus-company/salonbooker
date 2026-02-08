-- Fix: Refresh schema cache for bookings table
-- Run this in Supabase SQL Editor

-- 1. Refresh the schema cache
SELECT pg_catalog.pg_reload_conf();

-- 2. Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings';

-- 3. If booking_time doesn't exist, add it:
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_time VARCHAR(10) NOT NULL DEFAULT '09:00';

-- 4. Update RLS policies to ensure access
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 5. Recreate policies
DROP POLICY IF EXISTS "Bookings are insertable by everyone" ON bookings;
CREATE POLICY "Bookings are insertable by everyone" ON bookings
  FOR INSERT WITH CHECK (true);

-- 6. Grant permissions
GRANT ALL ON bookings TO anon;
GRANT ALL ON bookings TO authenticated;
GRANT ALL ON bookings TO service_role;
