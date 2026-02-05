#!/bin/bash
#
# Test Database Setup Script
# Creates test database and applies migrations
#
# Usage: ./tests/setup-test-db.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "SalonBooker Test Database Setup"
echo "========================================"
echo ""

# Load environment
if [ -f "$PROJECT_DIR/.env.test" ]; then
    echo "📋 Loading .env.test..."
    set -a
    source "$PROJECT_DIR/.env.test"
    set +a
else
    echo "⚠️  .env.test not found, using defaults"
fi

# Check for required tools
echo "🔧 Checking prerequisites..."

if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

# Check Supabase CLI (optional but recommended)
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    HAS_SUPABASE_CLI=true
else
    echo "⚠️  Supabase CLI not found. Will use REST API only."
    HAS_SUPABASE_CLI=false
fi

echo ""
echo "📊 Database Configuration"
echo "-------------------------"
echo "Supabase URL: ${NEXT_PUBLIC_SUPABASE_URL:-NOT SET}"
echo "Environment: ${NODE_ENV:-test}"
echo ""

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Required environment variables not set:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "Please set these in .env.test or export them:"
    echo "  export NEXT_PUBLIC_SUPABASE_URL=..."
    echo "  export SUPABASE_SERVICE_ROLE_KEY=..."
    exit 1
fi

echo "🔄 Setting up test database..."

# Apply migrations via SQL
echo "   Running database migrations..."

# Read and execute migrations
MIGRATIONS_DIR="$PROJECT_DIR/supabase/migrations"

if [ -d "$MIGRATIONS_DIR" ]; then
    for migration in "$MIGRATIONS_DIR"/*.sql; do
        if [ -f "$migration" ]; then
            echo "   📄 Applying: $(basename "$migration")"
            
            # Apply via REST API
            sql=$(cat "$migration" | sed 's/"/\\"/g' | tr '\n' ' ')
            
            response=$(curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
                -X POST \
                -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Content-Type: application/json" \
                -d "{\"query\": \"$sql\"}" 2>&1 || echo '{"error":"failed"}')
            
            if echo "$response" | grep -q "error"; then
                echo "   ⚠️  Migration may have already been applied or failed:"
                echo "      ${response:0:100}"
            else
                echo "   ✅ Applied successfully"
            fi
        fi
    done
else
    echo "   ⚠️  No migrations directory found"
fi

echo ""
echo "🌱 Seeding test data..."

# Apply seed data
SEED_FILE="$MIGRATIONS_DIR/002_seed_data.sql"
if [ -f "$SEED_FILE" ]; then
    echo "   📄 Applying seed data..."
    
    sql=$(cat "$SEED_FILE" | sed 's/"/\\"/g' | tr '\n' ' ')
    
    response=$(curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -X POST \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$sql\"}" 2>&1 || echo '{"error":"failed"}')
    
    if echo "$response" | grep -q "error"; then
        echo "   ⚠️  Seed data may already exist: ${response:0:100}"
    else
        echo "   ✅ Seed data applied"
    fi
else
    echo "   ⚠️  No seed file found"
fi

echo ""
echo "📊 Verifying database state..."

# Verify tables
TABLES=("salons" "services" "staff" "bookings")
for table in "${TABLES[@]}"; do
    count=$(curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=count()" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Accept: application/vnd.pgrst.object+json" 2>/dev/null | jq -r '.count // "0"')
    
    if [ "$count" != "ERROR" ] && [ -n "$count" ]; then
        echo "   ✅ $table: $count rows"
    else
        echo "   ❌ $table: check failed"
    fi
done

echo ""
echo "========================================"
echo "Test Database Setup Complete"
echo "========================================"
