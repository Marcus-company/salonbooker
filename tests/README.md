# SalonBooker Testing Infrastructure

Comprehensive testing suite for the SalonBooker application covering API endpoints, database integrity, and end-to-end workflows.

## 📁 Test Structure

```
tests/
├── api/                      # API endpoint tests
│   ├── run-api-tests.sh      # Main API test suite (curl)
│   └── httpie-tests.sh       # Alternative API tests (HTTPie)
├── db/                       # Database tests
│   ├── run-db-tests.sh       # Database validation (REST API)
│   └── sql-tests.sh          # SQL-based validation (psql)
├── e2e/                      # End-to-end tests
│   └── run-e2e-tests.sh      # Full workflow tests
├── factories/                # Mock data generators
│   └── index.ts              # Factory functions & test data
├── helpers/                  # Test utilities
│   └── config.ts             # Configuration & result formatters
├── setup-test-db.sh          # Test database setup
├── cleanup-test-data.sh      # Test data cleanup
└── generate-mock-data.sh     # Bulk data generator
```

## 🚀 Quick Start

### Run All Tests
```bash
npm test
```

### Run Individual Test Suites
```bash
# API Tests
npm run test:api

# Database Tests
npm run test:db

# E2E Tests
npm run test:e2e
```

### Setup Test Environment
```bash
# 1. Copy environment file
cp .env.test .env.test.local

# 2. Edit with your test database credentials
# NEXT_PUBLIC_SUPABASE_URL=
# SUPABASE_SERVICE_ROLE_KEY=

# 3. Setup test database
npm run test:setup
```

## 📋 Test Suites

### API Tests (`npm run test:api`)

Tests all REST API endpoints using curl.

**Covered Endpoints:**
- `GET /api/health` - Health check
- `GET /api/services` - List services (public)
- `GET /api/staff` - List staff (public)
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings (auth required)
- `PATCH /api/bookings` - Update booking (auth required)
- `GET /api/calendar?bookingId={id}` - Calendar export

**Validation:**
- Status codes (200, 201, 400, 401, 404)
- Response structure
- Input validation
- Authentication checks

**Expected Output:**
```
✅ Health Check - GET /api/health (status: 200, 45ms)
✅ List Services - GET /api/services (status: 200, 123ms)
✅ Create Booking - POST /api/bookings (status: 201, 234ms)
...

========================================
API TEST SUMMARY
========================================
✅ Passed: 12
❌ Failed: 0
```

### Database Tests (`npm run test:db`)

Validates database schema, constraints, and RLS policies.

**Checks:**
- ✅ All required tables exist (salons, services, staff, bookings)
- ✅ Foreign key constraints are valid
- ✅ Row Level Security (RLS) is enabled
- ✅ Required indexes exist
- ✅ Data integrity (no nulls in required fields)
- ✅ Valid status enum values
- ✅ Query performance

**Expected Output:**
```
🔍 TEST GROUP: Schema Validation
----------------------------------------
   ✅ Table 'salons' exists (rows: 1)
   ✅ Table 'services' exists (rows: 8)
   ✅ Table 'staff' exists (rows: 4)
   ✅ Table 'bookings' exists (rows: 4)
...

========================================
DATABASE TEST SUMMARY
========================================
✅ Passed: 15
❌ Failed: 0
```

### E2E Tests (`npm run test:e2e`)

Full workflow testing simulating real user interactions.

**Test Flows:**
1. **Complete Booking Flow**
   - Fetch services
   - Fetch staff
   - Create booking
   - Verify calendar export

2. **Service Catalog Flow**
   - Validate all services have required fields
   - Check response structure

3. **Error Handling Flow**
   - Invalid booking IDs
   - Missing required fields
   - Proper error responses

4. **Health & Performance**
   - Health check
   - Concurrent request handling
   - Response time validation

## 🔧 Environment Configuration

### Environment Files

| File | Purpose |
|------|---------|
| `.env.development` | Local development settings |
| `.env.test` | Test environment |
| `.env.staging` | Staging/acceptance |
| `.env.production` | Production |

### Required Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Test Data Management

### Generate Mock Data
```bash
# Generate 50 mock bookings
npm run test:mock 50

# Generate 1000 bookings for load testing
npm run test:mock 1000
```

### Cleanup Test Data
```bash
# Remove test bookings only
npm run test:cleanup

# Remove ALL data (including seed data)
npm run test:cleanup -- --all
```

### Reset Test Database
```bash
# Full reset: cleanup + setup
npm run test:cleanup -- --all
npm run test:setup
```

## 🔄 CI/CD Integration

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `.github/workflows/test.yml` | PR, Push | Run full test suite |
| `.github/workflows/deploy-staging.yml` | Push to develop | Deploy to staging |
| `.github/workflows/deploy-prod.yml` | Push to main | Deploy to production |

### Test Job Matrix

```yaml
jobs:
  - lint          # ESLint + TypeScript
  - api-tests     # API endpoint tests
  - db-tests      # Database validation
  - e2e-tests     # End-to-end tests
  - summary       # Results aggregation
```

## 📝 Writing New Tests

### API Test Example
```bash
# In tests/api/run-api-tests.sh
run_test "My New Endpoint" \
    "GET" \
    "/api/my-endpoint" \
    "200"
```

### Factory Example
```typescript
// In tests/factories/index.ts
export const factories = {
  myModel: (overrides = {}) => ({
    id: randomUUID(),
    name: 'Test',
    ...overrides,
  }),
};
```

## 📊 Test Reports

Test results are saved to:
- `/tmp/api-test-results.json` - API test details
- `/tmp/e2e-test-results.json` - E2E test details

In CI, these are uploaded as artifacts.

## 🐛 Troubleshooting

### Common Issues

**Tests fail with "Connection refused"**
```bash
# Ensure the server is running
npm run dev
# Then in another terminal:
npm run test:api
```

**Database tests fail with auth errors**
```bash
# Check environment variables
export NEXT_PUBLIC_SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
```

**HTTPie tests fail**
```bash
# Install HTTPie
pip install httpie
```

### Debug Mode
```bash
# Run with verbose output
bash -x ./tests/api/run-api-tests.sh
```

## 🎯 Validation Protocol

Every test must provide proof:

| Test Type | Required Proof |
|-----------|---------------|
| API | Status code, response body snippet |
| Database | Row counts, constraint validation |
| E2E | Full workflow completion, timing |

Example output format:
```
✅ Create Booking (234ms)
   📋 Proof: status: 201, rows: 1
```
