-- Staff Availability Table (for roster/schedule management)
-- This migration adds the ability for staff to set their working hours

-- Staff availability table
CREATE TABLE IF NOT EXISTS staff_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  
  -- Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Working hours
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  
  -- Is staff working this day?
  is_working BOOLEAN DEFAULT true,
  
  -- Break time (optional)
  break_start TIME,
  break_end TIME,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each staff member can only have one entry per day
  UNIQUE(staff_id, day_of_week)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_id ON staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_salon_id ON staff_availability(salon_id);

-- Enable RLS
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff availability is viewable by everyone" ON staff_availability
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage own availability" ON staff_availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.id = staff_availability.staff_id
      AND staff.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all availability" ON staff_availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.auth_user_id = auth.uid() 
      AND staff.role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_staff_availability_updated_at 
  BEFORE UPDATE ON staff_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get staff availability for a date range
CREATE OR REPLACE FUNCTION get_staff_availability(
  p_staff_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  is_working BOOLEAN,
  break_start TIME,
  break_end TIME
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.date,
    EXTRACT(DOW FROM d.date)::INTEGER as day_of_week,
    sa.start_time,
    sa.end_time,
    sa.is_working,
    sa.break_start,
    sa.break_end
  FROM generate_series(p_start_date, p_end_date, '1 day'::INTERVAL) AS d(date)
  LEFT JOIN staff_availability sa ON 
    sa.staff_id = p_staff_id 
    AND sa.day_of_week = EXTRACT(DOW FROM d.date)::INTEGER;
END;
$$ LANGUAGE plpgsql;
