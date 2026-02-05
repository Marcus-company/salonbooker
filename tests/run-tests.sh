#!/bin/bash
#
# Master Test Runner for SalonBooker
# Unified interface for all test suites
#
# Usage: ./tests/run-tests.sh [suite] [options]
#   suite: all|api|db|e2e (default: all)
#   options: --verbose, --ci, --coverage
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
SUITE="${1:-all}"
shift || true

VERBOSE=false
CI_MODE=false
COVERAGE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose) VERBOSE=true ;;
        --ci) CI_MODE=true ;;
        --coverage) COVERAGE=true ;;
        *) echo "Unknown option: $1" ;;
    esac
    shift
done

# Load environment
if [ -f "$PROJECT_DIR/.env.test" ]; then
    set -a
    source "$PROJECT_DIR/.env.test"
    set +a
fi

BASE_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

# Test results
declare -A RESULTS
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_SKIPPED=0

# Helper functions
print_header() {
    echo ""
    echo "========================================"
    echo "$1"
    echo "========================================"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo "----------------------------------------"
}

run_suite() {
    local name="$1"
    local script="$2"
    
    print_section "Running: $name"
    
    local start_time=$(date +%s)
    
    if [ "$VERBOSE" = true ]; then
        bash "$script" "$BASE_URL"
    else
        bash "$script" "$BASE_URL" 2>&1 | grep -E "(✅|❌|📊|📋|📝|📡|🔍|🧪|Error|Failed|PASSED)" || true
    fi
    
    local exit_code=${PIPESTATUS[0]}
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $exit_code -eq 0 ]; then
        RESULTS[$name]="PASS:$duration"
        ((TOTAL_PASSED++))
        echo -e "${GREEN}✅ $name completed in ${duration}s${NC}"
    else
        RESULTS[$name]="FAIL:$duration"
        ((TOTAL_FAILED++))
        echo -e "${RED}❌ $name failed after ${duration}s${NC}"
    fi
}

# Main execution
print_header "SalonBooker Test Runner"

echo "Configuration:"
echo "  Suite: $SUITE"
echo "  Base URL: $BASE_URL"
echo "  Verbose: $VERBOSE"
echo "  CI Mode: $CI_MODE"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not found. Some tests may be limited.${NC}"
fi

if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl not found. Tests cannot run.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"

# Run requested suites
case $SUITE in
    all)
        run_suite "API Tests" "$SCRIPT_DIR/api/run-api-tests.sh"
        run_suite "Database Tests" "$SCRIPT_DIR/db/run-db-tests.sh"
        run_suite "E2E Tests" "$SCRIPT_DIR/e2e/run-e2e-tests.sh"
        ;;
    api)
        run_suite "API Tests" "$SCRIPT_DIR/api/run-api-tests.sh"
        ;;
    db)
        run_suite "Database Tests" "$SCRIPT_DIR/db/run-db-tests.sh"
        ;;
    e2e)
        run_suite "E2E Tests" "$SCRIPT_DIR/e2e/run-e2e-tests.sh"
        ;;
    setup)
        bash "$SCRIPT_DIR/setup-test-db.sh"
        exit 0
        ;;
    cleanup)
        bash "$SCRIPT_DIR/cleanup-test-data.sh"
        exit 0
        ;;
    mock)
        bash "$SCRIPT_DIR/generate-mock-data.sh" "${2:-50}"
        exit 0
        ;;
    *)
        echo "Unknown suite: $SUITE"
        echo "Available suites: all, api, db, e2e, setup, cleanup, mock"
        exit 1
        ;;
esac

# Print summary
print_header "Test Summary"

echo "Results by Suite:"
echo "-----------------"
for suite in "${!RESULTS[@]}"; do
    result="${RESULTS[$suite]}"
    status=$(echo "$result" | cut -d: -f1)
    duration=$(echo "$result" | cut -d: -f2)
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $suite: PASSED (${duration}s)${NC}"
    else
        echo -e "${RED}❌ $suite: FAILED (${duration}s)${NC}"
    fi
done

echo ""
echo "Overall:"
echo "--------"
echo -e "${GREEN}✅ Passed: $TOTAL_PASSED${NC}"
echo -e "${RED}❌ Failed: $TOTAL_FAILED${NC}"
echo -e "${YELLOW}⏭️ Skipped: $TOTAL_SKIPPED${NC}"
echo ""

if [ $TOTAL_FAILED -gt 0 ]; then
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
fi
