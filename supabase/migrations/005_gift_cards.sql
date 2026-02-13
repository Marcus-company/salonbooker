-- Gift Cards / Vouchers Database Schema

CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  initial_amount DECIMAL(10, 2) NOT NULL,
  balance DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  recipient_name TEXT,
  recipient_email TEXT,
  sender_name TEXT,
  message TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Gift card usage tracking
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  gift_card_id UUID REFERENCES gift_cards(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('redeem', 'refund')),
  reference_type TEXT, -- 'booking', 'transaction', etc
  reference_id UUID,
  staff_id UUID REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gift cards
CREATE POLICY "Gift cards are viewable by salon staff"
  ON gift_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.salon_id = gift_cards.salon_id 
      AND staff.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Gift cards are editable by salon admins"
  ON gift_cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.salon_id = gift_cards.salon_id 
      AND staff.auth_user_id = auth.uid()
      AND staff.role = 'admin'
    )
  );

-- RLS Policies for gift card transactions
CREATE POLICY "Gift card transactions are viewable by salon staff"
  ON gift_card_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gift_cards gc
      JOIN staff s ON s.salon_id = gc.salon_id
      WHERE gc.id = gift_card_transactions.gift_card_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Gift card transactions can be created by salon staff"
  ON gift_card_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gift_cards gc
      JOIN staff s ON s.salon_id = gc.salon_id
      WHERE gc.id = gift_card_transactions.gift_card_id
      AND s.auth_user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_gift_cards_salon ON gift_cards(salon_id);
CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_status ON gift_cards(status);
CREATE INDEX idx_gift_card_transactions_card ON gift_card_transactions(gift_card_id);

-- Function to redeem gift card
CREATE OR REPLACE FUNCTION redeem_gift_card(
  p_card_code TEXT,
  p_amount DECIMAL,
  p_reference_type TEXT,
  p_reference_id UUID,
  p_staff_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card_id UUID;
  v_balance DECIMAL;
BEGIN
  -- Get card details
  SELECT id, balance INTO v_card_id, v_balance
  FROM gift_cards
  WHERE code = p_card_code
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_card_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Update card balance
  UPDATE gift_cards
  SET balance = balance - p_amount,
      status = CASE WHEN balance - p_amount <= 0 THEN 'used' ELSE 'active' END,
      updated_at = NOW()
  WHERE id = v_card_id;

  -- Record transaction
  INSERT INTO gift_card_transactions (
    gift_card_id, amount, transaction_type, 
    reference_type, reference_id, staff_id
  ) VALUES (
    v_card_id, p_amount, 'redeem',
    p_reference_type, p_reference_id, p_staff_id
  );

  RETURN TRUE;
END;
$$;
