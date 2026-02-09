-- Google Calendar integration tables

-- Table for storing user's Google Calendar connections
CREATE TABLE IF NOT EXISTS user_calendar_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'google',
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, provider)
);

-- Add calendar sync fields to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_synced_at TIMESTAMPTZ;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_calendar_connections_user_id 
ON user_calendar_connections(user_id);

-- RLS policies
ALTER TABLE user_calendar_connections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own connections
CREATE POLICY "Users can view own calendar connections"
    ON user_calendar_connections
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only update their own connections
CREATE POLICY "Users can update own calendar connections"
    ON user_calendar_connections
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can only insert their own connections
CREATE POLICY "Users can insert own calendar connections"
    ON user_calendar_connections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own connections
CREATE POLICY "Users can delete own calendar connections"
    ON user_calendar_connections
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_calendar_connections_updated_at ON user_calendar_connections;
CREATE TRIGGER update_user_calendar_connections_updated_at
    BEFORE UPDATE ON user_calendar_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
