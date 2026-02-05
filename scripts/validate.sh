#!/bin/bash
# SalonBooker Validation Script
# Run this to verify everything works before deployment

echo "🧪 SalonBooker Validation Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
  fi
}

# 1. Check if required files exist
echo "📁 Checking required files..."
[ -f "package.json" ]; check "package.json exists"
[ -f "next.config.mjs" ]; check "next.config.mjs exists"
[ -f ".env.local.example" ]; check ".env.local.example exists"
[ -f "src/middleware.ts" ]; check "middleware.ts exists"
[ -d "supabase/migrations" ]; check "migrations directory exists"
[ -f "supabase/migrations/001_initial_schema.sql" ]; check "schema migration exists"
[ -f "supabase/migrations/002_seed_data.sql" ]; check "seed migration exists"
echo ""

# 2. Check if required directories exist
echo "📂 Checking directory structure..."
[ -d "src/app/admin" ]; check "admin pages directory"
[ -d "src/lib/supabase" ]; check "supabase client directory"
[ -d "src/app/api" ]; check "API routes directory"
[ -d "packages/widget" ]; check "widget package directory"
echo ""

# 3. Check TypeScript compilation
echo "🔨 Checking TypeScript..."
npx tsc --noEmit 2>/dev/null; check "TypeScript compiles without errors"
echo ""

# 4. Check ESLint
echo "🔍 Checking ESLint..."
npm run lint 2>/dev/null; check "ESlint passes"
echo ""

# 5. Check if build works
echo "🏗️  Checking build..."
NEXT_PUBLIC_SUPABASE_URL=http://test.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=test npx next build 2>/dev/null | grep -q "Compiled successfully"; check "Build succeeds"
echo ""

# Summary
echo "================================"
echo "📊 Results: $PASS passed, $FAIL failed"

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some checks failed!${NC}"
  exit 1
fi
