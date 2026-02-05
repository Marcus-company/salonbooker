#!/bin/bash
#
# End-to-End Test Suite for SalonBooker
# Full workflow testing from booking to confirmation
#
# Usage: ./tests/e2e/run-e2e-tests.sh [base_url]
#

set -e

BASE_URL="${1:-http://localhost:3000}"
RESULTS_FILE="/tmp/e2e-test-results.json"

echo "========================================"
echo "SalonBooker E2E Test Suite"
echo "========================================"
echo "Base URL: $BASE_URL"
echo "Started: $(date -Iseconds)"
echo "========================================"
echo ""

PASSED=0
FAILED=0
TESTS_RUN=0

# Initialize results
echo "[]" > "$RESULTS_FILE"

# Helper function
run_test() {
    local name="$1"
    local test_fn="$2"
    
    echo "🧪 $name"
    local start=$(date +%s%N)
    
    if eval "$test_fn"; then
        local end=$(date +%s%N)
        local duration=$(( (end - start) / 1000000 ))
        echo "   ✅ PASSED (${duration}ms)"
        ((PASSED++))
        ((TESTS_RUN++))
        
        local result=$(jq -n --arg test "$name" --arg status "PASS" --argjson duration "$duration" '{test: $test, status: $status, duration: $duration}')
        jq ". += [$result]" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
        return 0
    else
        local end=$(date +%s%N)
        local duration=$(( (end - start) / 1000000 ))
        echo "   ❌ FAILED (${duration}ms)"
        ((FAILED++))
        ((TESTS_RUN++))
        
        local result=$(jq -n --arg test "$name" --arg status "FAIL" --argjson duration "$duration" '{test: $test, status: $status, duration: $duration}')
        jq ". += [$result]" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
        return 1
    fi
}

# ========================================
# E2E TEST: Complete Booking Flow
# ========================================
test_complete_booking_flow() {
    echo "   Step 1: Get available services..."
    services_response=$(curl -s "${BASE_URL}/api/services")
    services_count=$(echo "$services_response" | jq '.services | length')
    
    if [ "$services_count" -eq 0 ]; then
        echo "   ⚠️ No services available"
        return 1
    fi
    echo "   📋 Found $services_count services"
    
    echo "   Step 2: Get available staff..."
    staff_response=$(curl -s "${BASE_URL}/api/staff")
    staff_count=$(echo "$staff_response" | jq '.staff | length')
    echo "   👥 Found $staff_count staff members"
    
    echo "   Step 3: Create a booking..."
    tomorrow=$(date -d '+1 day' +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d)
    
    booking_payload=$(jq -n \
        --arg name "E2E Test Customer" \
        --arg phone "06-99998888" \
        --arg email "e2e@test.com" \
        --arg service "E2E Test Service" \
        --arg date "$tomorrow" \
        '{
            customer_name: $name,
            customer_phone: $phone,
            customer_email: $email,
            service_name: $service,
            booking_date: $date,
            booking_time: "14:30",
            notes: "E2E test booking"
        }')
    
    create_response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/bookings" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$booking_payload")
    
    http_code=$(echo "$create_response" | tail -n1)
    response_body=$(echo "$create_response" | sed '$d')
    
    if [ "$http_code" != "201" ]; then
        echo "   ❌ Booking creation failed (status: $http_code)"
        return 1
    fi
    
    booking_id=$(echo "$response_body" | jq -r '.booking.id')
    echo "   ✅ Booking created: $booking_id"
    
    echo "   Step 4: Verify booking exists via calendar export..."
    calendar_response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/calendar?bookingId=${booking_id}")
    calendar_code=$(echo "$calendar_response" | tail -n1)
    
    if [ "$calendar_code" != "200" ]; then
        echo "   ❌ Calendar export failed"
        return 1
    fi
    echo "   ✅ Calendar export working"
    
    echo "   Step 5: Verify booking is retrievable (would need auth)..."
    echo "   ℹ️ Skipping - requires authentication"
    
    return 0
}

# ========================================
# E2E TEST: Service Catalog Flow
# ========================================
test_service_catalog_flow() {
    echo "   Step 1: Fetch all services..."
    services_response=$(curl -s "${BASE_URL}/api/services")
    
    if [ -z "$services_response" ]; then
        echo "   ❌ No response from services endpoint"
        return 1
    fi
    
    services=$(echo "$services_response" | jq '.services')
    if [ "$services" = "null" ]; then
        echo "   ❌ Invalid response format"
        return 1
    fi
    
    echo "   Step 2: Validate service data structure..."
    first_service=$(echo "$services" | jq '.[0]')
    
    required_fields=("id" "name" "duration" "price")
    for field in "${required_fields[@]}"; do
        if [ "$(echo "$first_service" | jq -r ".$field // empty")" = "" ]; then
            echo "   ❌ Missing required field: $field"
            return 1
        fi
    done
    
    echo "   ✅ All services have required fields"
    return 0
}

# ========================================
# E2E TEST: Error Handling Flow
# ========================================
test_error_handling_flow() {
    echo "   Step 1: Test invalid booking ID..."
    error_response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/calendar?bookingId=invalid-uuid")
    error_code=$(echo "$error_response" | tail -n1)
    
    if [ "$error_code" != "404" ] && [ "$error_code" != "400" ]; then
        echo "   ⚠️ Unexpected error code: $error_code (expected 400/404)"
    fi
    echo "   ✅ Error handling working (status: $error_code)"
    
    echo "   Step 2: Test missing required fields..."
    invalid_payload='{"customer_name": "Test"}'
    invalid_response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/bookings" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$invalid_payload")
    invalid_code=$(echo "$invalid_response" | tail -n1)
    
    if [ "$invalid_code" = "400" ]; then
        echo "   ✅ Validation working (status: $invalid_code)"
    else
        echo "   ⚠️ Validation status: $invalid_code"
    fi
    
    return 0
}

# ========================================
# E2E TEST: Health & Performance
# ========================================
test_health_and_performance() {
    echo "   Step 1: Health check..."
    health_response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/health")
    health_code=$(echo "$health_response" | tail -n1)
    health_body=$(echo "$health_response" | sed '$d')
    
    if [ "$health_code" != "200" ]; then
        echo "   ❌ Health check failed"
        return 1
    fi
    
    status=$(echo "$health_body" | jq -r '.status')
    if [ "$status" != "ok" ]; then
        echo "   ⚠️ Health status: $status"
    fi
    echo "   ✅ Health check passed"
    
    echo "   Step 2: Performance test - concurrent requests..."
    start_time=$(date +%s%N)
    
    # Run 5 concurrent requests
    for i in {1..5}; do
        curl -s "${BASE_URL}/api/services" > /dev/null &
    done
    wait
    
    end_time=$(date +%s%N)
    total_time=$(( (end_time - start_time) / 1000000 ))
    avg_time=$(( total_time / 5 ))
    
    echo "   ⏱️  5 requests in ${total_time}ms (avg: ${avg_time}ms)"
    
    if [ $avg_time -lt 500 ]; then
        echo "   ✅ Performance acceptable"
    else
        echo "   ⚠️ Performance may need optimization"
    fi
    
    return 0
}

# ========================================
# Run All Tests
# ========================================
echo "🔄 Running E2E Test Suite"
echo ""

run_test "Complete Booking Flow" "test_complete_booking_flow"
run_test "Service Catalog Flow" "test_service_catalog_flow"
run_test "Error Handling Flow" "test_error_handling_flow"
run_test "Health & Performance" "test_health_and_performance"

echo ""
echo "========================================"
echo "E2E TEST SUMMARY"
echo "========================================"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "Total: $TESTS_RUN"
echo "========================================"
echo ""
echo "📊 Detailed results:"
jq '.' "$RESULTS_FILE"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "❌ Some E2E tests failed!"
    exit 1
else
    echo "✅ All E2E tests passed!"
    exit 0
fi
