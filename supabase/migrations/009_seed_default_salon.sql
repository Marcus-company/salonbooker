-- Seed data: Create default salon if none exists
-- This ensures signup can create staff records

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM salons LIMIT 1) THEN
        INSERT INTO salons (name, slug, address, phone, email, is_active, opening_hours)
        VALUES (
            'HairsalonX',
            'hairsalonx',
            'Hoofdstraat 123, Roermond',
            '+31612345678',
            'info@hairsalonx.nl',
            true,
            '{
                "monday": {"open": "09:00", "close": "17:00"},
                "tuesday": {"open": "09:00", "close": "17:00"},
                "wednesday": {"open": "09:00", "close": "17:00"},
                "thursday": {"open": "09:00", "close": "17:00"},
                "friday": {"open": "09:00", "close": "17:00"},
                "saturday": {"open": "10:00", "close": "16:00"},
                "sunday": {"open": null, "close": null}
            }'::jsonb
        );
    END IF;
END $$;

-- Verify
SELECT id, name, slug FROM salons WHERE is_active = true LIMIT 1;
