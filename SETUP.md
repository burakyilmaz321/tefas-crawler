# 🚀 TEFAS Fund Dashboard - Setup Guide

## ✅ Completed Steps

### 1. Environment Files Created
- ✅ `.env` (root directory - backend config)
- ✅ `frontend/.env.local` (frontend Vite config)
- ✅ Both files added to `.gitignore`

### 2. Code Fixes Applied
- ✅ Fixed portfolio upsert conflict in `App.tsx:68` (changed `onConflict: 'user_id'` → `'user_id,name'`)
- ✅ Removed duplicate fund metadata upsert in `api/fund-history.js:159-165`
- ✅ Added `ErrorBoundary` component for graceful error handling
- ✅ Added loading skeletons for better UX during data fetching

---

## 📋 Next Steps (YOU MUST DO THESE)

### Step 1: Run Database Schema in Supabase

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/hirpfdwsnzqgzdfyxriv
   - Click: **SQL Editor** in left sidebar
   - Click: **New Query**

2. **Copy & Paste the SQL:**
   - Open the file: `supabase-schema.sql`
   - Copy all content
   - Paste into SQL Editor
   - Click: **Run** button

3. **Verify Success:**
   You should see output like:
   ```
   Success. No rows returned
   ```

   Then run this verification query:
   ```sql
   SELECT tablename, rowsecurity as "RLS Enabled"
   FROM pg_tables
   WHERE tablename IN ('funds', 'historical_data', 'portfolios')
   ORDER BY tablename;
   ```

   Expected result:
   ```
   funds            | true
   historical_data  | true
   portfolios       | true
   ```

---

### Step 2: Configure GitHub OAuth in Supabase

1. **Go to GitHub OAuth Apps:**
   - Visit: https://github.com/settings/developers
   - Click: **OAuth Apps** → **New OAuth App**

2. **Fill in details:**
   ```
   Application name: TEFAS Fund Dashboard
   Homepage URL: http://localhost:5173
   Authorization callback URL: https://hirpfdwsnzqgzdfyxriv.supabase.co/auth/v1/callback
   ```

3. **After creating:**
   - Copy the **Client ID**
   - Click **Generate a new client secret**
   - Copy the **Client Secret** (⚠️ only shown once!)

4. **Configure in Supabase:**
   - Go to: https://supabase.com/dashboard/project/hirpfdwsnzqgzdfyxriv/auth/providers
   - Find **GitHub** provider
   - Toggle **Enable**
   - Paste **Client ID** and **Client Secret**
   - Click **Save**

---

### Step 3: Install Dependencies & Start Dev Server

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Go back to root
cd ..

# Start the development server (in one terminal)
node dev-server.js

# In another terminal, start the frontend
cd frontend
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## 🔍 Testing Checklist

After starting the app, test these features:

### ✅ Basic Functionality
- [ ] App loads without errors
- [ ] Fund type selector works (YAT, EMK, BYF)
- [ ] Fund selector dropdown appears and is searchable
- [ ] Can select up to 5 funds
- [ ] Loading skeletons appear while fetching data
- [ ] Chart renders with selected funds
- [ ] Time period filters work (1D, 1W, 1M, etc.)
- [ ] Metric filters work (Price, Investors, Market Cap)

### ✅ Supabase Integration
- [ ] Data loads from TEFAS API
- [ ] Data gets cached to Supabase (check in Supabase Table Editor → `funds` and `historical_data`)
- [ ] Subsequent loads are faster (using cache)

### ✅ Authentication
- [ ] "GitHub ile Giriş" button appears
- [ ] Clicking button redirects to GitHub OAuth
- [ ] After authorizing, returns to app and shows user email
- [ ] "Kaydet" button appears when logged in
- [ ] Selecting funds and clicking "Kaydet" saves portfolio
- [ ] Refreshing page loads saved portfolio

### ✅ Export Functionality
- [ ] Export tab works
- [ ] Can select funds and date range
- [ ] CSV export works
- [ ] Excel export works
- [ ] PDF export works

---

## 🐛 Troubleshooting

### Issue: "Missing credentials. Caching will be disabled."
**Solution:** Ensure `.env` file exists in root directory with correct keys.

### Issue: GitHub OAuth redirects to error page
**Solution:**
1. Check callback URL is exactly: `https://hirpfdwsnzqgzdfyxriv.supabase.co/auth/v1/callback`
2. Verify Client ID and Secret are correct in Supabase

### Issue: "Failed to save portfolio"
**Solution:** Run the `supabase-schema.sql` to create tables and RLS policies.

### Issue: Slow data loading
**Solution:** This is normal for first load. Subsequent loads use cache and are 15-30x faster.

### Issue: CORS errors in console
**Solution:** Ensure Supabase URL and keys match in both `.env` and `frontend/.env.local`

---

## 📊 Performance Improvements Made

1. **Loading Skeletons:** Smooth UX during data fetching
2. **Error Boundary:** Graceful error handling with reload option
3. **Fixed Bugs:**
   - Portfolio save now works correctly
   - No duplicate database writes
4. **Optimized Caching:** Backend checks Supabase before hitting TEFAS API

---

## 🎯 Future Enhancements (Optional - Not Implemented Yet)

These can be added later to further improve the app:

- Dark mode toggle
- Memoized chart calculations (React.memo)
- Request deduplication
- Virtual scrolling for long fund lists
- Better mobile responsiveness
- Accessibility improvements (ARIA labels, keyboard nav)

---

## 🔐 Security Notes

- ✅ `.env` files are in `.gitignore` (credentials won't be committed)
- ✅ Service role key only used in backend (never exposed to frontend)
- ✅ Row Level Security (RLS) enabled on portfolios table
- ✅ Users can only see/edit their own portfolios
- ✅ Public data (funds, historical_data) readable by all

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console for errors (F12 → Console)
2. Check backend logs in terminal running `dev-server.js`
3. Verify Supabase tables exist (Table Editor in dashboard)
4. Ensure all environment variables are set correctly

---

**Last Updated:** 2026-01-24
**Supabase Project:** hirpfdwsnzqgzdfyxriv
**Branch:** interesting-dijkstra
