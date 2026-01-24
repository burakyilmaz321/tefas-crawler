#!/bin/bash
# Verification script for GitHub login and date column fixes

set -e

echo "🔍 Verifying Fixes for GitHub Login & Date Column Issues"
echo "=========================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Frontend .env.local
echo "📋 Check 1: Frontend .env.local"
if grep -q "hirpfdwsnzqgzdfyxriv" frontend/.env.local; then
    echo -e "${GREEN}✅ PASS${NC}: Frontend .env.local has correct Supabase URL"
else
    echo -e "${RED}❌ FAIL${NC}: Frontend .env.local missing or has wrong URL"
    exit 1
fi

if grep -q "kyvfnaytfvgkfnccteya" frontend/.env.local; then
    echo -e "${RED}❌ FAIL${NC}: Frontend .env.local contains OLD Supabase URL"
    exit 1
fi
echo ""

# Check 2: Backend .env
echo "📋 Check 2: Backend .env"
if grep -q "hirpfdwsnzqgzdfyxriv" .env; then
    echo -e "${GREEN}✅ PASS${NC}: Backend .env has correct Supabase URL"
else
    echo -e "${RED}❌ FAIL${NC}: Backend .env missing or has wrong URL"
    exit 1
fi
echo ""

# Check 3: Source code - ExportPage.tsx
echo "📋 Check 3: ExportPage.tsx has 'date' in default columns"
if grep -q "selectedColumns.*useState.*\[.*'date'" frontend/src/pages/ExportPage.tsx; then
    echo -e "${GREEN}✅ PASS${NC}: ExportPage.tsx has 'date' in selectedColumns array"
else
    echo -e "${RED}❌ FAIL${NC}: ExportPage.tsx missing 'date' in default columns"
    exit 1
fi
echo ""

# Check 4: Source code - No hardcoded old URL
echo "📋 Check 4: No hardcoded old Supabase URL in source"
if grep -r "kyvfnaytfvgkfnccteya" frontend/src/ 2>/dev/null; then
    echo -e "${RED}❌ FAIL${NC}: Found hardcoded old Supabase URL in source"
    exit 1
else
    echo -e "${GREEN}✅ PASS${NC}: No hardcoded old URL in source code"
fi
echo ""

# Check 5: Production build exists and is fresh
echo "📋 Check 5: Production build verification"
if [ -d "frontend/dist" ]; then
    if grep -q "hirpfdwsnzqgzdfyxriv" frontend/dist/assets/index-*.js 2>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}: Production build contains correct Supabase URL"
    else
        echo -e "${YELLOW}⚠️  WARN${NC}: Production build exists but may need rebuild"
    fi

    if grep -q "kyvfnaytfvgkfnccteya" frontend/dist/assets/index-*.js 2>/dev/null; then
        echo -e "${RED}❌ FAIL${NC}: Production build contains OLD Supabase URL - needs rebuild!"
        echo "   Run: cd frontend && rm -rf dist && npm run build"
        exit 1
    fi

    if grep -q "fund_type.*date.*price.*investor_count" frontend/dist/assets/index-*.js 2>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}: Production build has 'date' in default columns"
    else
        echo -e "${YELLOW}⚠️  WARN${NC}: Cannot verify date column in production build"
    fi
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Production build not found (this is OK for dev)"
fi
echo ""

# Check 6: Vite dev server
echo "📋 Check 6: Vite dev server status"
if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}: Vite dev server is running on port 5173"

    # Test if we can reach it
    if curl -s -f http://localhost:5173/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}: Dev server is responding to requests"
    else
        echo -e "${YELLOW}⚠️  WARN${NC}: Dev server is running but not responding"
    fi
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Vite dev server is not running"
    echo "   Start it with: cd frontend && npm run dev"
fi
echo ""

# Check 7: Cache clearing tools exist
echo "📋 Check 7: Cache clearing tools"
if [ -f "frontend/public/clear-cache.html" ]; then
    echo -e "${GREEN}✅ PASS${NC}: clear-cache.html exists"
else
    echo -e "${RED}❌ FAIL${NC}: clear-cache.html missing"
fi

if [ -f "frontend/public/test-env.html" ]; then
    echo -e "${GREEN}✅ PASS${NC}: test-env.html exists"
else
    echo -e "${RED}❌ FAIL${NC}: test-env.html missing"
fi
echo ""

# Check 8: API connectivity
echo "📋 Check 8: API connectivity test"
if curl -s -f "http://localhost:5173/api/funds?kind=YAT" > /dev/null 2>&1; then
    FUND_COUNT=$(curl -s "http://localhost:5173/api/funds?kind=YAT" | jq -r '.funds | length' 2>/dev/null || echo "0")
    if [ "$FUND_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: API is responding (loaded $FUND_COUNT YAT funds)"
    else
        echo -e "${YELLOW}⚠️  WARN${NC}: API responded but returned no funds"
    fi
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Cannot reach API (backend may not be running)"
    echo "   This is OK if you're only testing frontend"
fi
echo ""

# Summary
echo "=========================================================="
echo "✨ Verification Complete!"
echo ""
echo "Next steps for the user:"
echo "1. Visit: http://localhost:5173/clear-cache.html"
echo "2. Click: 'Tüm Cache ve Storage'ı Temizle'"
echo "3. Test GitHub login - should use hirpfdwsnzqgzdfyxriv.supabase.co"
echo "4. Test Export page - 'Tarih' should be pre-selected"
echo ""
echo "For detailed instructions, see: TESTING_INSTRUCTIONS.md"
echo "For quick summary, see: QUICK_FIX_SUMMARY.md"
