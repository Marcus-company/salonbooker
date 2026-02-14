-- Subscriptions / Strippenkaarten Database Schema

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  total_sessions INTEGER NOT NULL DEFAULT 10,
  price DECIMAL(10, 2) NOT NULL,
  service_ids UUID[] DEFAULT '{}',
  valid_months INTEGER DEFAULT 12,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer subscriptions (purchased subscriptions)
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  subscription_id UUID REFERENCES subscriptions(id),
  subscription_name TEXT NOT NULL,
  total_sessions INTEGER NOT NULL,
  used_sessions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used')),
  valid_until TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track subscription usage
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_subscription_id UUID REFERENCES customer_subscriptions(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  used_at TIMESTAMP DEFAULT NOW(),
  staff_id UUID REFERENCES staff(id)
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Subscriptions are viewable by salon staff"
  ON subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM staff 
    WHERE staff.salon_id = subscriptions.salon_id 
    AND staff.auth_user_id = auth.uid()
  ));

CREATE POLICY "Subscriptions are editable by salon admins"
  ON subscriptions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM staff 
    WHERE staff.salon_id = subscriptions.salon_id 
    AND staff.auth_user_id = auth.uid()
    AND staff.role = 'admin'
  ));

CREATE POLICY "Customer subscriptions viewable by salon staff"
  ON customer_subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM staff 
    WHERE staff.salon_id = customer_subscriptions.salon_id 
    AND staff.auth_user_id = auth.uid()
  ));

CREATE POLICY "Customer subscriptions editable by salon staff"
  ON customer_subscriptions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM staff 
    WHERE staff.salon_id = customer_subscriptions.salon_id 
    AND staff.auth_user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_subscriptions_salon ON subscriptions(salon_id);
CREATE INDEX idx_customer_subs_salon ON customer_subscriptions(salon_id);
CREATE INDEX idx_customer_subs_status ON customer_subscriptions(status);
CREATE INDEX idx_customer_subs_customer ON customer_subscriptions(customer_phone);
