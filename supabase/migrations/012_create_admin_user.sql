-- Create admin user for Marcus testing
-- Email: test@marcusfdm.com

-- First, check if user already exists in auth.users
-- We'll create the staff record linked to this email

DO $$
DECLARE
    v_salon_id UUID;
    v_user_id UUID;
BEGIN
    -- Get first active salon
    SELECT id INTO v_salon_id FROM salons WHERE is_active = true LIMIT 1;
    
    IF v_salon_id IS NULL THEN
        -- Create default salon if none exists
        INSERT INTO salons (name, slug, address, phone, email, is_active)
        VALUES ('HairsalonX Test', 'hairsalonx-test', 'Teststraat 1', '0612345678', 'test@marcusfdm.com', true)
        RETURNING id INTO v_salon_id;
    END IF;
    
    -- Create staff record for admin (will be linked when user signs up)
    INSERT INTO staff (salon_id, name, email, role, is_active, auth_user_id)
    VALUES (
        v_salon_id,
        'Marcus Admin',
        'test@marcusfdm.com',
        'admin',
        true,
        NULL  -- Will be linked after signup
    )
    ON CONFLICT (email) DO UPDATE 
    SET role = 'admin', is_active = true;
    
    RAISE NOTICE 'Admin staff record created/updated for test@marcusfdm.com';
END $$;

-- Verify
SELECT id, name, email, role, is_active 
FROM staff 
WHERE email = 'test@marcusfdm.com';
