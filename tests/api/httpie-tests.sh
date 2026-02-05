#!/bin/bash
#
# API Test Suite using HTTPie
# Alternative to curl with better formatting
#
# Prerequisites: pip install httpie
#

set -e

BASE_URL="${1:-http://localhost:3000}"

echo "========================================"
echo "SalonBooker API Tests (HTTPie)"
echo "========================================"
echo "Base URL: $BASE_URL"
echo ""

# Check if httpie is installed
if ! command -v http &> /dev/null; then
    echo "❌ HTTPie not found. Install with: pip install httpie"
    exit 1
fi

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Helper to extract status code from httpie output
get_status() {
    echo "$1" | grep -oP 'HTTP/[0-9.]+ \K[0-9]+' || echo "000"
}

echo "📡 Testing Health Endpoint"
echo "--------------------------"
response=$(http GET "${BASE_URL}/api/health" 2>&1 || true)
status=$(get_status "$response")
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✅ Health Check PASSED${NC} (status: $status)"
    ((PASSED++))
else
    echo -e "${RED}❌ Health Check FAILED${NC} (status: $status)"
    ((FAILED++))
fi
echo ""

echo "📡 Testing Public Endpoints"
echo "--------------------------"
response=$(http GET "${BASE_URL}/api/services" 2>&1 || true)
status=$(get_status "$response")
if [ "$status" = "200" ]; then
    count=$(echo "$response" | jq '.services | length' 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ List Services PASSED${NC} (status: $status, count: $count)"
    ((PASSED++))
else
    echo -e "${RED}❌ List Services FAILED${NC} (status: $status)"
    ((FAILED++))
fi

response=$(http GET "${BASE_URL}/api/staff" 2>&1 || true)
status=$(get_status "$response")
if [ "$status" = "200" ]; then
    count=$(echo "$response" | jq '.staff | length' 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ List Staff PASSED${NC} (status: $status, count: $count)"
    ((PASSED++))
else
    echo -e "${RED}❌ List Staff FAILED${NC} (status: $status)"
    ((FAILED++))
fi
echo ""

echo "📡 Testing Booking Creation"
echo "--------------------------"
tomorrow=$(date -d '+1 day' +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d)

response=$(http POST "${BASE_URL}/api/bookings" \
    customer_name="HTTPie Test" \
    customer_phone="06-99999999" \
    customer_email="httpie@test.com" \
    service_name="Knippen dames" \
    booking_date="$tomorrow" \
    booking_time="14:00" \
    notes="Test via HTTPie" 2>&1 || true)

status=$(get_status "$response")
if [ "$status" = "201" ]; then
    booking_id=$(echo "$response" | jq -r '.booking.id' 2>/dev/null || echo "N/A")
    echo -e "${GREEN}✅ Create Booking PASSED${NC} (status: $status, id: $booking_id)"
    ((PASSED++))
else
    echo -e "${RED}❌ Create Booking FAILED${NC} (status: $status)"
    ((FAILED++))
fi
echo ""

echo "📡 Testing Auth-Required Endpoints (No Auth)"
echo "------------------------------------------"
response=$(http GET "${BASE_URL}/api/bookings" 2>&1 || true)
status=$(get_status "$response")
if [ "$status" = "401" ]; then
    echo -e "${GREEN}✅ Auth Check PASSED${NC} (status: $status as expected)"
    ((PASSED++))
else
    echo -e "${RED}❌ Auth Check FAILED${NC} (expected: 401, got: $status)"
    ((FAILED++))
fi
echo ""

echo "========================================"
echo "HTTPie Test Summary"
echo "========================================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo "========================================"

exit $((FAILED > 0 ? 1 : 0))
