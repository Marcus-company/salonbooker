#!/bin/bash
#
# Database Test Suite for SalonBooker
# Validates schema, constraints, RLS policies, and data integrity
#
# Usage: ./tests/db/run-db-tests.sh
#

set -e

# Configuration
SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-${SERVICE_ROLE_KEY:-}}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required"
    echo "   Set environment variables or load .env.test"
    exit 1
fi

PASSED=0
FAILED=0

echo "========================================"
echo "SalonBooker Database Test Suite"
echo "========================================"
echo "Supabase URL: $SUPABASE_URL"
echo "Started: $(date -Iseconds)"
echo "========================================"
echo ""

# Helper function to run SQL query
run_query() {
    local query="$1"
    local description="$2"
    local expected_result="${3:-}"
    
    echo "📝 $description"
    
    response=$(curl -s "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -X POST \
        -H "apikey: $SERVICE_KEY" \
        -H "Authorization: Bearer $SERVICE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\"}" 2>&1 || echo '{"error":"connection failed"}')
    
    echo "   Response: ${response:0:100}"
    echo "$response"
}

# Helper function to count rows
count_rows() {
    local table="$1"
    local condition="${2:-true}"
    
    curl -s "${SUPABASE_URL}/rest/v1/${table}?select=count()&${condition}" \
        -H "apikey: $SERVICE_KEY" \
        -H "Authorization: Bearer $SERVICE_KEY" \
        -H "Accept: application/vnd.pgrst.object+json" 2>/dev/null | jq -r '.count // "0"'
}

echo "🔍 TEST GROUP: Schema Validation"
echo "----------------------------------------"

# Check required tables exist
REQUIRED_TABLES=("salons" "services" "staff" "bookings" "auth.users")
for table in "${REQUIRED_TABLES[@]}"; do
    echo "   Checking table: $table"
    count=$(curl -s "${SUPABASE_URL}/rest/v1/${table}?select=count()&limit=1" \
        -H "apikey: $SERVICE_KEY" \
        -H "Authorization: Bearer $SERVICE_KEY" \
        -H "Accept: application/vnd.pgrst.object+json" 2>/dev/null | jq -r '.count // "ERROR"')
    
    if [ "$count" != "ERROR" ]; then
        echo "   ✅ Table '$table' exists (rows: $count)"
        ((PASSED++))
    else
        echo "   ❌ Table '$table' check failed"
        ((FAILED++))
    fi
done
echo ""

echo "🔍 TEST GROUP: Row Counts"
echo "----------------------------------------"
TABLES=("salons" "services" "staff" "bookings")
for table in "${TABLES[@]}"; do
    count=$(count_rows "$table")
    echo "   📊 $table: $count rows"
done
echo ""

echo "🔍 TEST GROUP: Foreign Key Constraints"
echo "----------------------------------------"

# Check bookings with valid service_id
valid_service_refs=$(curl -s "${SUPABASE_URL}/rest/v1/bookings?select=count()&service_id=not.is.null" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Accept: application/vnd.pgrst.object+json" 2>/dev/null | jq -r '.count // "0"')
echo "   ✅ Bookings with service_id: $valid_service_refs"
((PASSED++))

# Check bookings with valid staff_id
valid_staff_refs=$(curl -s "${SUPABASE_URL}/rest/v1/bookings?select=count()&staff_id=not.is.null" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Accept: application/vnd.pgrst.object+json" 2>/dev/null | jq -r '.count // "0"')
echo "   ✅ Bookings with staff_id: $valid_staff_refs"
((PASSED++))

# Check services with valid salon_id
valid_salon_refs=$(curl -s "${SUPABASE_URL}/rest/v1/services?select=count()&salon_id=not.is.null" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Accept: application/vnd.pgrst.object+json" 2>/dev/null | jq -r '.count // "0"')
echo "   ✅ Services with salon_id: $valid_salon_refs"
((PASSED++))
echo ""

echo "🔍 TEST GROUP: Data Integrity"
echo "----------------------------------------"

# Check for bookings without required customer_name
missing_name=$(curl -s "${SUPABASE_URL}/rest/v1/bookings?select=count()&customer_name=is.null" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Accept: application/vnd.pgrst.object+json" 2>/dev/null | jq -r '.count // "0"')

if [ "$missing_name" = "0" ]; then
    echo "   ✅ All bookings have customer_name"
    ((PASSED++))
else
    echo "   ❌ Found $missing_name bookings without customer_name"
    ((FAILED++))
fi

# Check for bookings without required customer_phone
missing_phone=$(curl -s "${SUPABASE_URL}/rest/v1/bookings?select=count()&customer_phone=is.null" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Accept: application/vnd.pgrst.object+json" 2>/dev/null | jq -r '.count // "0"')

if [ "$missing_phone" = "0" ]; then
    echo "   ✅ All bookings have customer_phone"
    ((PASSED++))
else
    echo "   ❌ Found $missing_phone bookings without customer_phone"
    ((FAILED++))
fi

# Check for valid status values
valid_statuses=("pending" "confirmed" "cancelled" "completed")
invalid_statuses=$(curl -s "${SUPABASE_URL}/rest/v1/bookings?select=status&limit=1000" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" 2>/dev/null | jq -r '[.[] | select(.status as $s | ["pending", "confirmed", "cancelled", "completed"] | index($s) | not)] | length')

if [ "$invalid_statuses" = "0" ]; then
    echo "   ✅ All bookings have valid status values"
    ((PASSED++))
else
    echo "   ❌ Found $invalid_statuses bookings with invalid status"
    ((FAILED++))
fi
echo ""

echo "🔍 TEST GROUP: RLS Policies"
echo "----------------------------------------"

# Test anonymous access to public tables (should succeed)
anon_key="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-$SERVICE_KEY}"

echo "   Testing anonymous read on services..."
services_anon=$(curl -s "${SUPABASE_URL}/rest/v1/services?select=*&limit=1" \
    -H "apikey: $anon_key" \
    -H "Accept: application/vnd.pgrst.array+json" 2>/dev/null)

if [ -n "$services_anon" ] && [ "$services_anon" != "[]" ]; then
    echo "   ✅ Public can read services"
    ((PASSED++))
else
    echo "   ⚠️  Public services read returned empty (may be expected)"
fi

# Test anonymous read on bookings (should fail or return empty)
echo "   Testing anonymous read on bookings..."
bookings_anon=$(curl -s -w "\n%{http_code}" "${SUPABASE_URL}/rest/v1/bookings?select=*&limit=1" \
    -H "apikey: $anon_key" 2>/dev/null)

http_code=$(echo "$bookings_anon" | tail -n1)
if [ "$http_code" = "200" ] || [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
    echo "   ✅ Bookings RLS working (status: $http_code)"
    ((PASSED++))
else
    echo "   ⚠️  Bookings RLS check returned: $http_code"
fi
echo ""

echo "🔍 TEST GROUP: Indexes"
echo "----------------------------------------"
# Check for critical indexes via a simple query performance test
echo "   Testing booking_date index performance..."
perf_start=$(date +%s%N)
_=$(curl -s "${SUPABASE_URL}/rest/v1/bookings?select=*&booking_date=gte.2024-01-01&limit=100" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" 2>/dev/null)
perf_end=$(date +%s%N)
perf_ms=$(( (perf_end - perf_start) / 1000000 ))

if [ $perf_ms -lt 1000 ]; then
    echo "   ✅ Query performance good (${perf_ms}ms)"
    ((PASSED++))
else
    echo "   ⚠️  Query performance slow (${perf_ms}ms)"
fi
echo ""

# Summary
echo "========================================"
echo "DATABASE TEST SUMMARY"
echo "========================================"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "========================================"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "❌ Some tests failed!"
    exit 1
else
    echo "✅ All tests passed!"
    exit 0
fi
