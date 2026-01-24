# Testing Instructions for GitHub Login and Date Column Issues

## Issues Reported
1. GitHub login redirecting to old Supabase URL (kyvfnaytfvgkfnccteya)
2. "Tarih" (Date) column not pre-selected in Export page

## Root Cause Analysis

### Issue 1: GitHub Login
**Root Cause**: Browser localStorage cached the old Supabase URL from the previous project
**Evidence**:
- `.env.local` has correct new URL (hirpfdwsnzqgzdfyxriv)
- Source code has correct URL
- Production build has correct URL
- Problem is browser-side cache

### Issue 2: Date Column
**Root Cause**: Browser caching old JavaScript bundle
**Evidence**:
- Source code has 'date' in default selectedColumns (ExportPage.tsx:18)
- Production build has 'date' in the array
- Old dist/ folder may have been served

## Fixes Applied

### 1. Cleared Old Production Build
```bash
rm -rf dist/
npm run build
```

### 2. Restarted Vite Dev Server
```bash
# Killed old process
kill -9 85380
# Started fresh dev server
npm run dev
```

### 3. Created Cache Clearing Tools
- `frontend/public/clear-cache.html` - Browser cache cleaner
- `frontend/public/test-env.html` - Environment variable tester

## Testing Steps for User

### Step 1: Clear Browser Cache and Storage

**Option A: Use Built-in Cache Clearer**
1. Navigate to: `http://localhost:5173/clear-cache.html`
2. Click "Tüm Cache ve Storage'ı Temizle"
3. Wait for automatic redirect

**Option B: Manual Browser Clear**
1. Open Chrome DevTools (Cmd+Option+I or F12)
2. Go to Application tab
3. Clear all data:
   - LocalStorage → Delete all `sb-*` keys
   - SessionStorage → Clear all
   - IndexedDB → Delete all databases
4. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### Step 2: Verify Environment Variables (Optional)
1. Navigate to: `http://localhost:5173/test-env.html`
2. Check that:
   - ✅ VITE_SUPABASE_URL shows: `https://hirpfdwsnzqgzdfyxriv.supabase.co`
   - ✅ No OLD URL detected warning

### Step 3: Test GitHub Login
1. Go to homepage: `http://localhost:5173/`
2. Click "GitHub ile Giriş" button
3. Verify redirect URL starts with: `https://hirpfdwsnzqgzdfyxriv.supabase.co`
4. Complete GitHub OAuth flow
5. Should redirect back to app successfully

### Step 4: Test Date Column Pre-selection
1. Navigate to Export page
2. Look for "Sütun Seçimi" (Column Selection) section
3. Verify these checkboxes are CHECKED by default:
   - ✅ Fon Türü (Fund Type)
   - ✅ Tarih (Date) ← **This should be checked**
   - ✅ Fiyat (Price)
   - ✅ Yatırımcı Sayısı (Investor Count)
   - ✅ Portföy Büyüklüğü (Market Cap)

## Verification Checklist

- [ ] GitHub login redirects to correct Supabase URL (hirpfdwsnzqgzdfyxriv)
- [ ] GitHub OAuth flow completes successfully
- [ ] Date column is pre-selected in Export page
- [ ] No console errors about wrong Supabase URL
- [ ] User can authenticate and access protected features

## Files Modified

1. **Rebuilt Production Bundle**
   - `dist/` - Completely regenerated with correct env vars

2. **Created Testing Tools**
   - `frontend/public/clear-cache.html` - Cache cleaner UI
   - `frontend/public/test-env.html` - Environment variable checker

3. **Verified Source Files** (no changes needed, already correct)
   - `frontend/.env.local` - ✅ Correct URL
   - `frontend/src/lib/supabase.ts` - ✅ Using env vars
   - `frontend/src/pages/ExportPage.tsx:18` - ✅ Has 'date' in array

## Technical Details

### Environment Variable Loading
- Vite loads `.env.local` at build time
- Variables prefixed with `VITE_` are embedded in the bundle
- Browser cache can prevent new bundle from loading

### Supabase Client Initialization
```typescript
// frontend/src/lib/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Default Column Selection
```typescript
// frontend/src/pages/ExportPage.tsx:18
const [selectedColumns, setSelectedColumns] = useState<string[]>([
  'fund_type',
  'date',           // ✅ Date is here
  'price',
  'investor_count',
  'market_cap'
]);
```

## If Issues Persist

1. **Completely close and reopen browser** (not just refresh)
2. **Check browser console** for errors
3. **Verify Vite dev server is running** with correct env:
   ```bash
   ps aux | grep vite
   # Should show process running in frontend directory
   ```
4. **Check .env.local file** still has correct URL:
   ```bash
   cat frontend/.env.local
   # Should show hirpfdwsnzqgzdfyxriv
   ```
5. **Try incognito/private browsing mode** to test with clean state

## Expected Console Output

### Correct Supabase Client Creation
```javascript
// In browser console, you should see:
supabaseUrl: "https://hirpfdwsnzqgzdfyxriv.supabase.co"
```

### GitHub OAuth Flow
```
1. User clicks "GitHub ile Giriş"
2. Browser redirects to: https://hirpfdwsnzqgzdfyxriv.supabase.co/auth/v1/authorize?...
3. Supabase redirects to: https://github.com/login/oauth/authorize?...
4. GitHub redirects back to: https://hirpfdwsnzqgzdfyxriv.supabase.co/auth/v1/callback?...
5. Supabase redirects to: http://localhost:5173/
```

All URLs in step 2 and 4 MUST contain `hirpfdwsnzqgzdfyxriv`, NOT `kyvfnaytfvgkfnccteya`.
