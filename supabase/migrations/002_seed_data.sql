-- Seed data for HairsalonX

-- Insert salon
INSERT INTO salons (id, name, slug, address, phone, email, opening_hours) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'HairsalonX',
  'hairsalonx',
  'Hoofdstraat 123, 6041 AB Roermond',
  '+31 6 12345678',
  'info@hairsalonx.nl',
  '{
    "tuesday": {"open": "09:00", "close": "17:30"},
    "wednesday": {"open": "09:00", "close": "17:30"},
    "thursday": {"open": "09:00", "close": "20:00"},
    "friday": {"open": "09:00", "close": "17:30"},
    "saturday": {"open": "09:00", "close": "16:00"},
    "sunday": null,
    "monday": null
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert services
INSERT INTO services (salon_id, name, description, duration, price, icon) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Knippen dames', 'Inclusief wassen en föhnen', '45 min', 35.00, '✂️'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Knippen heren', 'Inclusief wassen', '30 min', 25.00, '✂️'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Knippen kinderen', 'Tot 12 jaar', '30 min', 18.00, '✂️'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Full color', 'Complete kleurbehandeling', '90 min', 55.00, '🎨'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Highlights', 'Highlights in het haar', '120 min', 65.00, '🎨'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Balayage', 'Natuurlijke balayage', '150 min', 85.00, '🎨'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Curl defining', 'Krullen verzorging', '60 min', 45.00, '💆'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Extensions', 'Haarverlenging', '180 min', 150.00, '💇')
ON CONFLICT DO NOTHING;

-- Insert sample staff (password: admin123 for testing)
-- Note: In production, use Supabase Auth to create users first, then link auth_user_id
INSERT INTO staff (salon_id, name, email, phone, role, bio, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Josje', 'josje@hairsalonx.nl', '+31 6 12345678', 'admin', 'Eigenaar en hoofdstyliste', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'Sarah', 'sarah@hairsalonx.nl', '+31 6 23456789', 'staff', 'Kleurspecialist', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'Lisa', 'lisa@hairsalonx.nl', '+31 6 34567890', 'staff', 'Knipspecialist', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'Emma', 'emma@hairsalonx.nl', '+31 6 45678901', 'staff', 'Krullenspecialist', true)
ON CONFLICT DO NOTHING;

-- Insert sample bookings
INSERT INTO bookings (salon_id, service_id, staff_id, service_name, service_duration, service_price, customer_name, customer_phone, customer_email, booking_date, booking_time, status, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 
   (SELECT id FROM services WHERE name = 'Knippen dames' LIMIT 1),
   (SELECT id FROM staff WHERE name = 'Josje' LIMIT 1),
   'Knippen dames', '45 min', 35.00,
   'Anna de Vries', '06-12345678', 'anna@email.nl',
   CURRENT_DATE, '10:00', 'confirmed', 'Vaste klant'),
   
  ('550e8400-e29b-41d4-a716-446655440000',
   (SELECT id FROM services WHERE name = 'Full color' LIMIT 1),
   (SELECT id FROM staff WHERE name = 'Sarah' LIMIT 1),
   'Full color', '90 min', 55.00,
   'Mark Janssen', '06-87654321', 'mark@email.nl',
   CURRENT_DATE + 1, '14:00', 'pending', 'Eerste keer'),
   
  ('550e8400-e29b-41d4-a716-446655440000',
   (SELECT id FROM services WHERE name = 'Balayage' LIMIT 1),
   (SELECT id FROM staff WHERE name = 'Sarah' LIMIT 1),
   'Balayage', '150 min', 85.00,
   'Lisa Bakker', '06-23456789', 'lisa@email.nl',
   CURRENT_DATE + 2, '09:30', 'confirmed', ''),
   
  ('550e8400-e29b-41d4-a716-446655440000',
   (SELECT id FROM services WHERE name = 'Knippen heren' LIMIT 1),
   (SELECT id FROM staff WHERE name = 'Lisa' LIMIT 1),
   'Knippen heren', '30 min', 25.00,
   'Peter Jansen', '06-34567890', 'peter@email.nl',
   CURRENT_DATE + 1, '11:00', 'confirmed', 'Liever niet te kort')
ON CONFLICT DO NOTHING;
