-- Webhooks table for storing webhook subscriptions
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- For HMAC signature
  events TEXT[] NOT NULL DEFAULT ARRAY['booking.created', 'booking.updated', 'booking.cancelled'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook deliveries table for tracking delivery attempts
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_salon_id ON webhooks(salon_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhooks (only admins can manage)
CREATE POLICY "Webhooks are viewable by salon staff" ON webhooks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.auth_user_id = auth.uid()
      AND (staff.salon_id = webhooks.salon_id OR staff.role = 'admin')
    )
  );

CREATE POLICY "Webhooks are manageable by admins" ON webhooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.auth_user_id = auth.uid() 
      AND staff.role = 'admin'
    )
  );

-- RLS Policies for webhook deliveries
CREATE POLICY "Webhook deliveries are viewable by salon staff" ON webhook_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM webhooks w
      JOIN staff s ON s.salon_id = w.salon_id
      WHERE w.id = webhook_deliveries.webhook_id
      AND s.auth_user_id = auth.uid()
    )
  );

-- Function to trigger webhooks on booking changes
CREATE OR REPLACE FUNCTION trigger_booking_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_record RECORD;
  event_type TEXT;
  payload JSONB;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    event_type := 'booking.created';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      event_type := 'booking.cancelled';
    ELSE
      event_type := 'booking.updated';
    END IF;
  ELSE
    event_type := 'booking.deleted';
  END IF;

  -- Build payload
  IF TG_OP = 'DELETE' THEN
    payload := jsonb_build_object(
      'event', event_type,
      'timestamp', NOW(),
      'data', row_to_json(OLD)
    );
  ELSE
    payload := jsonb_build_object(
      'event', event_type,
      'timestamp', NOW(),
      'data', row_to_json(NEW)
    );
  END IF;

  -- Queue webhook deliveries (actual HTTP calls will be made by edge function or worker)
  FOR webhook_record IN 
    SELECT id, url, secret 
    FROM webhooks 
    WHERE salon_id = COALESCE(NEW.salon_id, OLD.salon_id)
    AND is_active = true
    AND (events @> ARRAY[event_type] OR events @> ARRAY['*'])
  LOOP
    INSERT INTO webhook_deliveries (webhook_id, event, payload)
    VALUES (webhook_record.id, event_type, payload);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers for booking webhooks
DROP TRIGGER IF EXISTS booking_webhook_trigger ON bookings;
CREATE TRIGGER booking_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION trigger_booking_webhook();

-- Trigger for updated_at on webhooks
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
