#!/bin/bash
# Fix Supabase schema script
# This script fixes the missing columns in the bookings table

echo "🔧 Fixing Supabase schema..."
echo ""
echo "Je moet dit script runnen met je Supabase project URL en service role key."
echo ""
echo "Stap 1: Ga naar https://app.supabase.com/project/_/settings/api"
echo "Stap 2: Kopieer de 'Project URL' en 'service_role secret'"
echo "Stap 3: Run dit script met:"
echo ""
echo "SUPABASE_URL=https://your-project.supabase.co \\"
echo "SUPABASE_SERVICE_KEY=your-service-role-key \\"
echo "./fix-schema.sh"
echo ""

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL en SUPABASE_SERVICE_KEY zijn vereist"
    echo ""
    echo "Voorbeeld:"
    echo "SUPABASE_URL=https://xyzxyzxyzxyz.supabase.co \\"
    echo "SUPABASE_SERVICE_KEY=eyJ... \\"
    echo "./fix-schema.sh"
    exit 1
fi

echo "🔗 Connecting to: $SUPABASE_URL"
echo ""

# Run the SQL fix
curl -X POST "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_time VARCHAR(10) NOT NULL DEFAULT '\''09:00'\''; ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_duration VARCHAR(50) DEFAULT '\'''\''; ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_price DECIMAL(10, 2) DEFAULT 0; ALTER TABLE bookings ADD COLUMN IF NOT EXISTS staff_name VARCHAR(255) DEFAULT '\'''\''; SELECT pg_catalog.pg_reload_conf();"
  }' 2>/dev/null

echo ""
echo "✅ Schema fix uitgevoerd!"
echo ""
echo "Test nu de boeking opnieuw."
