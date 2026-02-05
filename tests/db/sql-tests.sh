#!/bin/bash
#
# Database Test Suite using psql (if available)
# More comprehensive SQL-based validation
#

set -e

# Configuration
DB_HOST="${SUPABASE_DB_HOST:-}"
DB_PORT="${SUPABASE_DB_PORT:-5432}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
DB_PASS="${SUPABASE_DB_PASS:-}"

if ! command -v psql &> /dev/null; then
    echo "⚠️  psql not available, falling back to REST API tests"
    echo "   Install PostgreSQL client for full SQL validation"
    exit 0
fi

if [ -z "$DB_HOST" ]; then
    echo "⚠️  Database host not configured"
    echo "   Set SUPABASE_DB_HOST environment variable"
    exit 0
fi

export PGPASSWORD="$DB_PASS"

PASSED=0
FAILED=0

echo "========================================"
echo "SalonBooker Database Tests (SQL)"
echo "========================================"
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_NAME"
echo "========================================"
echo ""

# Run SQL tests
run_sql_test() {
    local name="$1"
    local query="$2"
    local expected="$3"
    
    echo "📝 $name"
    
    result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -tAc "$query" 2>/dev/null || echo "ERROR")
    
    if [ "$result" = "$expected" ]; then
        echo "   ✅ PASSED (result: $result)"
        ((PASSED++))
    else
        echo "   ❌ FAILED (expected: $expected, got: $result)"
        ((FAILED++))
    fi
}

echo "📊 Table Existence Tests"
echo "------------------------"
run_sql_test "Check salons table exists" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'salons'" "1"
run_sql_test "Check services table exists" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'services'" "1"
run_sql_test "Check staff table exists" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'staff'" "1"
run_sql_test "Check bookings table exists" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'bookings'" "1"
echo ""

echo "🔗 Foreign Key Tests"
echo "--------------------"
run_sql_test "Check bookings have FK to services" "SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'bookings' AND constraint_type = 'FOREIGN KEY'" "3"
echo ""

echo "🔒 RLS Policy Tests"
echo "-------------------"
run_sql_test "Check RLS enabled on salons" "SELECT relrowsecurity FROM pg_class WHERE relname = 'salons'" "t"
run_sql_test "Check RLS enabled on services" "SELECT relrowsecurity FROM pg_class WHERE relname = 'services'" "t"
run_sql_test "Check RLS enabled on staff" "SELECT relrowsecurity FROM pg_class WHERE relname = 'staff'" "t"
run_sql_test "Check RLS enabled on bookings" "SELECT relrowsecurity FROM pg_class WHERE relname = 'bookings'" "t"
echo ""

echo "📈 Index Tests"
echo "--------------"
run_sql_test "Check idx_bookings_salon_id exists" "SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'idx_bookings_salon_id'" "1"
run_sql_test "Check idx_bookings_date exists" "SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'idx_bookings_date'" "1"
run_sql_test "Check idx_bookings_status exists" "SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'idx_bookings_status'" "1"
echo ""

# Summary
echo "========================================"
echo "SQL DATABASE TEST SUMMARY"
echo "========================================"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "========================================"

exit $((FAILED > 0 ? 1 : 0))
