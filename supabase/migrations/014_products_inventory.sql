-- Producten en voorraad beheer

-- Producten tabel
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT UNIQUE,
    category TEXT,
    purchase_price DECIMAL(10, 2),
    selling_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 5,
    max_stock_level INTEGER,
    unit TEXT DEFAULT 'stuks',
    supplier TEXT,
    barcode TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Voorraad mutaties (history)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'sale')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    reference_type TEXT,
    reference_id UUID,
    staff_id UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexen
CREATE INDEX IF NOT EXISTS idx_products_salon_id ON products(salon_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_product_id ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_created_at ON stock_transactions(created_at);

-- View voor lage voorraad alerts
CREATE OR REPLACE VIEW low_stock_alerts AS
SELECT 
    p.id,
    p.salon_id,
    p.name,
    p.sku,
    p.stock_quantity,
    p.min_stock_level,
    p.max_stock_level,
    p.unit,
    p.selling_price,
    (p.min_stock_level - p.stock_quantity) as shortage_amount,
    CASE 
        WHEN p.stock_quantity = 0 THEN 'critical'
        WHEN p.stock_quantity <= p.min_stock_level THEN 'warning'
        ELSE 'ok'
    END as alert_level
FROM products p
WHERE p.is_active = true
  AND p.stock_quantity <= p.min_stock_level;

-- RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Staff can view products"
    ON products FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM staff s 
        JOIN salons sal ON s.salon_id = sal.id 
        WHERE s.auth_user_id = auth.uid() 
        AND sal.id = products.salon_id
    ));

CREATE POLICY "Admin can manage products"
    ON products FOR ALL
    USING (EXISTS (
        SELECT 1 FROM staff s 
        WHERE s.auth_user_id = auth.uid() 
        AND s.role = 'admin'
    ));

-- Stock transactions policies
CREATE POLICY "Staff can view stock transactions"
    ON stock_transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM products p
        JOIN staff s ON p.salon_id = s.salon_id
        WHERE p.id = stock_transactions.product_id
        AND s.auth_user_id = auth.uid()
    ));

CREATE POLICY "Admin can create stock transactions"
    ON stock_transactions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM staff s 
        WHERE s.auth_user_id = auth.uid() 
        AND s.role = 'admin'
    ));

-- Functie om voorraad bij te werken
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products 
    SET stock_quantity = NEW.new_stock,
        updated_at = now()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger om product stock automatisch bij te werken
DROP TRIGGER IF EXISTS trg_update_product_stock ON stock_transactions;
CREATE TRIGGER trg_update_product_stock
    AFTER INSERT ON stock_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock();

-- Functie voor updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger voor products updated_at
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
