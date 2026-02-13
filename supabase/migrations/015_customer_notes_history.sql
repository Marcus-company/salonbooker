-- Klant notities en geschiedenis uitbreiding

-- Klant notities tabel
CREATE TABLE IF NOT EXISTS customer_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id),
    note TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Klant favorieten (producten/diensten)
CREATE TABLE IF NOT EXISTS customer_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('service', 'product')),
    service_id UUID REFERENCES services(id),
    product_id UUID REFERENCES products(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(customer_id, type, service_id, product_id)
);

-- Indexen
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_customer_id ON customer_favorites(customer_id);

-- View voor klant geschiedenis (boekingen + notities)
CREATE OR REPLACE VIEW customer_history AS
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
    COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.service_price ELSE 0 END), 0) as total_spent,
    MAX(b.booking_date) as last_visit,
    MIN(b.booking_date) as first_visit,
    COUNT(DISTINCT cn.id) as total_notes,
    COUNT(DISTINCT cf.id) as total_favorites
FROM customers c
LEFT JOIN bookings b ON c.id = b.customer_id
LEFT JOIN customer_notes cn ON c.id = cn.customer_id
LEFT JOIN customer_favorites cf ON c.id = cf.customer_id
GROUP BY c.id, c.name, c.email, c.phone;

-- RLS policies
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

-- Customer notes policies
CREATE POLICY "Staff can view customer notes"
    ON customer_notes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM staff s 
        WHERE s.auth_user_id = auth.uid()
    ));

CREATE POLICY "Staff can create customer notes"
    ON customer_notes FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM staff s 
        WHERE s.auth_user_id = auth.uid()
    ));

CREATE POLICY "Staff can update own notes"
    ON customer_notes FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM staff s 
        WHERE s.id = customer_notes.staff_id 
        AND s.auth_user_id = auth.uid()
    ));

-- Customer favorites policies
CREATE POLICY "Staff can view customer favorites"
    ON customer_favorites FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM staff s 
        WHERE s.auth_user_id = auth.uid()
    ));

CREATE POLICY "Staff can manage customer favorites"
    ON customer_favorites FOR ALL
    USING (EXISTS (
        SELECT 1 FROM staff s 
        WHERE s.auth_user_id = auth.uid()
    ));

-- Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for customer_notes updated_at
DROP TRIGGER IF EXISTS trg_customer_notes_updated_at ON customer_notes;
CREATE TRIGGER trg_customer_notes_updated_at
    BEFORE UPDATE ON customer_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
