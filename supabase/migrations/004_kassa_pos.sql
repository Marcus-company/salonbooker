-- Kassa/POS System Database Schema
-- Add products and transactions tables

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  category TEXT,
  barcode TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  items JSONB NOT NULL, -- Array of {id, type, name, price, quantity}
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'card', 'other'
  staff_id UUID REFERENCES staff(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Products are viewable by salon staff"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.salon_id = products.salon_id 
      AND staff.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Products are editable by salon admins"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.salon_id = products.salon_id 
      AND staff.auth_user_id = auth.uid()
      AND staff.role = 'admin'
    )
  );

-- RLS Policies for transactions
CREATE POLICY "Transactions are viewable by salon staff"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.salon_id = transactions.salon_id 
      AND staff.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Transactions can be created by salon staff"
  ON transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.salon_id = transactions.salon_id 
      AND staff.auth_user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_products_salon ON products(salon_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_transactions_salon ON transactions(salon_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);

-- Add some sample products (optional)
-- INSERT INTO products (salon_id, name, price, stock, category) VALUES
--   ((SELECT id FROM salons WHERE is_active = true LIMIT 1), 'Shampoo', 15.99, 50, 'Haarverzorging'),
--   ((SELECT id FROM salons WHERE is_active = true LIMIT 1), 'Conditioner', 15.99, 50, 'Haarverzorging'),
--   ((SELECT id FROM salons WHERE is_active = true LIMIT 1), 'Haarwax', 12.50, 30, 'Styling');
