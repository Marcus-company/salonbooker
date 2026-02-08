-- EMERGENCY COMPLETE SCHEMA FIX
-- Run this in Supabase SQL Editor to fix ALL missing columns

-- 1. Reload schema cache
SELECT pg_catalog.pg_reload_conf();

-- 2. Check current columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- 3. Add ALL possible columns that might be missing
-- (Supporting both old and new column names)

-- Core booking columns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_time VARCHAR(10) DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS start_time VARCHAR(10) DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS end_time VARCHAR(10) DEFAULT '10:00',
ADD COLUMN IF NOT EXISTS service_duration VARCHAR(50) DEFAULT '60 min',
ADD COLUMN IF NOT EXISTS service_price DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS staff_name VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS staff_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS service_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS salon_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- 4. Make sure all columns are nullable (for backwards compatibility)
ALTER TABLE bookings 
ALTER COLUMN booking_time DROP NOT NULL,
ALTER COLUMN start_time DROP NOT NULL,
ALTER COLUMN end_time DROP NOT NULL;

-- 5. Add salon_id foreign key if missing (but allow null for now)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_salon_id_fkey'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_salon_id_fkey 
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add salon_id foreign key: %', SQLERRM;
END $$;

-- 6. Add service_id foreign key if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_service_id_fkey'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_service_id_fkey 
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add service_id foreign key: %', SQLERRM;
END $$;

-- 7. Add staff_id foreign key if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_staff_id_fkey'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_staff_id_fkey 
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add staff_id foreign key: %', SQLERRM;
END $$;

-- 8. Grant permissions to all roles
GRANT ALL ON bookings TO anon;
GRANT ALL ON bookings TO authenticated;
GRANT ALL ON bookings TO service_role;

-- 9. Refresh schema cache again
SELECT pg_catalog.pg_reload_conf();

-- 10. Verify final schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
