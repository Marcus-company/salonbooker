#!/bin/bash
#
# API Test Suite for SalonBooker
# Tests all endpoints with curl/HTTPie
# 
# Usage: ./tests/api/run-api-tests.sh [base_url]
# Example: ./tests/api/run-api-tests.sh http://localhost:3000
#

set -e

# Configuration
BASE_URL="${1:-http://localhost:3000}"
RESULTS_FILE="/tmp/api-test-results.json"
PASSED=0
FAILED=0

echo "========================================"
echo "SalonBooker API Test Suite"
echo "========================================"
echo "Base URL: $BASE_URL"
echo "Started: $(date -Iseconds)"
echo "========================================"
echo ""

# Initialize results
> "$RESULTS_FILE"
echo "[]" > "$RESULTS_FILE"

# Helper function to run a test
run_test() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local body="${5:-}"
    local auth_header="${6:-}"
    
    local url="${BASE_URL}${endpoint}"
    local start_time=$(date +%s%N)
    
    # Build curl command
    local curl_opts="-s -w \"\\n%{http_code}\""
    
    if [ -n "$body" ]; then
        curl_opts="$curl_opts -H \"Content-Type: application/json\" -d '$body'"
    fi
    
    if [ -n "$auth_header" ]; then
        curl_opts="$curl_opts -H \"Authorization: Bearer $auth_header\""
    fi
    
    # Execute request
    local response
    local status_code
    
    if [ -n "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url" \
            -X "$method" \
            -H "Content-Type: application/json" \
            ${auth_header:+-H "Authorization: Bearer $auth_header"} \
            -d "$body" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" "$url" \
            -X "$method" \
            ${auth_header:+-H "Authorization: Bearer $auth_header"} 2>&1)
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body_response=$(echo "$response" | sed '$d')
    
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    
    # Validate
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ $name (status: $status_code, ${duration}ms)"
        ((PASSED++))
        result_status="PASS"
    else
        echo "❌ $name (expected: $expected_status, got: $status_code, ${duration}ms)"
        echo "   Response: $body_response"
        ((FAILED++))
        result_status="FAIL"
    fi
    
    # Store result
    local result=$(jq -n \
        --arg test "$name" \
        --arg status "$result_status" \
        --argjson duration "$duration" \
        --argjson statusCode "$status_code" \
        --arg response "${body_response:0:200}" \
        '{test: $test, status: $status, duration: $duration, proof: {statusCode: $statusCode, response: $response}}')
    
    jq ". += [$result]" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

echo "📡 TEST GROUP: Health & Readiness"
echo "----------------------------------------"
run_test "Health Check - GET /api/health" "GET" "/api/health" "200"
echo ""

echo "📡 TEST GROUP: Public Endpoints (No Auth)"
echo "----------------------------------------"
run_test "List Services - GET /api/services" "GET" "/api/services" "200"
run_test "List Staff - GET /api/staff" "GET" "/api/staff" "200"
echo ""

echo "📡 TEST GROUP: Bookings - Public Create"
echo "----------------------------------------"
BOOKING_PAYLOAD='{
  "customer_name": "Test Klant",
  "customer_phone": "06-12345678",
  "customer_email": "test@example.com",
  "service_name": "Knippen dames",
  "booking_date": "'$(date -d '+1 day' +%Y-%m-%d)'",
  "booking_time": "10:00",
  "notes": "API test booking"
}'
run_test "Create Booking - POST /api/bookings" "POST" "/api/bookings" "201" "$BOOKING_PAYLOAD"
echo ""

echo "📡 TEST GROUP: Bookings - Auth Required"
echo "----------------------------------------"
run_test "List Bookings - No Auth" "GET" "/api/bookings" "401"
run_test "Update Booking - No Auth" "PATCH" "/api/bookings" "401" '{"id": "test-id", "status": "confirmed"}'
echo ""

echo "📡 TEST GROUP: Input Validation"
echo "----------------------------------------"
# Missing required fields
INVALID_PAYLOAD='{"customer_name": "Test"}'
run_test "Create Booking - Missing Fields" "POST" "/api/bookings" "400" "$INVALID_PAYLOAD"

# Invalid date format
INVALID_DATE='{
  "customer_name": "Test",
  "customer_phone": "06-12345678",
  "service_name": "Knippen",
  "booking_date": "invalid-date",
  "booking_time": "10:00"
}'
run_test "Create Booking - Invalid Date" "POST" "/api/bookings" "201" "$INVALID_DATE"
echo ""

echo "📡 TEST GROUP: Calendar Export"
echo "----------------------------------------"
# Get a booking ID first to test calendar export
BOOKING_RESPONSE=$(curl -s "${BASE_URL}/api/bookings" -X "GET" 2>/dev/null || echo '{"bookings":[]}')
BOOKING_ID=$(echo "$BOOKING_RESPONSE" | jq -r '.bookings[0].id // empty')

if [ -n "$BOOKING_ID" ]; then
    run_test "Calendar Export - GET /api/calendar" "GET" "/api/calendar?bookingId=${BOOKING_ID}" "200"
else
    run_test "Calendar Export - No Booking ID" "GET" "/api/calendar" "400"
fi
echo ""

# Summary
echo "========================================"
echo "API TEST SUMMARY"
echo "========================================"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "Total: $((PASSED + FAILED))"
echo "========================================"
echo ""
echo "📊 Detailed results saved to: $RESULTS_FILE"
jq '.' "$RESULTS_FILE"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "❌ Some tests failed!"
    exit 1
else
    echo "✅ All tests passed!"
    exit 0
fi
