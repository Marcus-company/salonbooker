#!/bin/bash
#
# Test Data Cleanup Script
# Removes test data while preserving structure
#
# Usage: ./tests/cleanup-test-data.sh [--all]
#   --all: Also remove seed data (not just test bookings)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

REMOVE_ALL="${1:-}"

echo "========================================"
echo "SalonBooker Test Data Cleanup"
echo "========================================"
echo ""

# Load environment
if [ -f "$PROJECT_DIR/.env.test" ]; then
    set -a
    source "$PROJECT_DIR/.env.test"
    set +a
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Required environment variables not set"
    exit 1
fi

echo "⚠️  This will remove test data from the database"
if [ "$REMOVE_ALL" = "--all" ]; then
    echo "⚠️  WARNING: --all flag set - will remove ALL data including seed data"
fi
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "🧹 Cleaning up test data..."

# Delete test bookings (bookings with test-related data)
echo "   🗑️  Removing test bookings..."

# Remove bookings created by tests
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bookings?customer_email=like.*test*" \
    -X DELETE \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" 2>/dev/null

curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bookings?customer_email=like.*e2e*" \
    -X DELETE \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null

curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bookings?notes=like.*API test*" \
    -X DELETE \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null

curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bookings?notes=like.*E2E*" \
    -X DELETE \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null

echo "   ✅ Test bookings removed"

if [ "$REMOVE_ALL" = "--all" ]; then
    echo ""
    echo "   🗑️  Removing all data (seed data)..."
    
    # Delete in order to respect FK constraints
    curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bookings" \
        -X DELETE \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null
    
    curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/services" \
        -X DELETE \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null
    
    curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/staff" \
        -X DELETE \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null
    
    curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/salons" \
        -X DELETE \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null
    
    echo "   ✅ All data removed"
fi

echo ""
echo "📊 Remaining data counts:"
TABLES=("salons" "services" "staff" "bookings")
for table in "${TABLES[@]}"; do
    count=$(curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=count()" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Accept: application/vnd.pgrst.object+json" 2>/dev/null | jq -r '.count // "0"')
    echo "   $table: $count rows"
done

echo ""
echo "========================================"
echo "Cleanup Complete"
echo "========================================"
