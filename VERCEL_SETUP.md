# Vercel Deployment Setup

## Issue Fixed
Vercel build was failing with: `npm error Missing script: "build"`

**Root Cause**: Root `package.json` didn't have a "build" script.

**Solution**: Added build script to root package.json:
```json
{
  "scripts": {
    "build": "cd frontend && npm install && npm run build"
  }
}
```

## Required Environment Variables in Vercel

You MUST configure these environment variables in your Vercel project settings:

### Frontend Environment Variables
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

**Note:** Get these values from your `.env.local` file or Supabase Dashboard → Project Settings → API

### Backend Environment Variables (for API routes)
```
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

**Note:** Get these values from your `.env` file or Supabase Dashboard → Project Settings → API

## Important Notes

### 1. Environment Variable Scope
Set all variables for:
- ✅ Production
- ✅ Preview
- ✅ Development

### 2. Redeploy After Adding Variables
After adding environment variables, you need to trigger a new deployment:
- Option A: Push a new commit
- Option B: Go to Deployments → Click ⋮ menu → "Redeploy"

### 3. GitHub OAuth Configuration
Make sure your Supabase GitHub OAuth is configured with the Vercel deployment URL:

In Supabase Dashboard → Authentication → Providers → GitHub:
- **Site URL**: `https://your-vercel-app.vercel.app`
- **Redirect URLs**:
  - `https://hirpfdwsnzqgzdfyxriv.supabase.co/auth/v1/callback`
  - `https://your-vercel-app.vercel.app`

### 4. Vercel Configuration
The `vercel.json` file configures:
- Build command: `npm run build`
- Output directory: `frontend/dist`
- API rewrites for serverless functions

### 5. Testing Deployment

After deployment, test:
1. **Homepage loads**: Should show fund dashboard
2. **GitHub login**: Should redirect to correct Supabase URL
3. **API endpoints**: `/api/funds?kind=YAT` should return data
4. **Export page**: Date column should be pre-selected

### 6. Common Issues

**Issue**: "GitHub login redirects to wrong Supabase URL"
- **Cause**: Old environment variables cached
- **Fix**: Update Vercel env vars and redeploy

**Issue**: "Date column not pre-selected"
- **Cause**: Old build cached
- **Fix**: Clear Vercel build cache and redeploy

**Issue**: "API endpoints return 500 errors"
- **Cause**: Missing backend environment variables
- **Fix**: Add SUPABASE_* variables to Vercel

## Verification Steps

### 1. Check Build Logs
- Go to Vercel Dashboard → Deployments → Click deployment
- Check "Build Logs" section
- Should show: ✅ Build completed successfully

### 2. Test Environment Variables
Visit: `https://your-vercel-app.vercel.app/test-env.html`
- Should show correct Supabase URL
- Should NOT show old URL

### 3. Test GitHub Login
- Click "GitHub ile Giriş"
- Check URL in browser address bar
- Should contain: `hirpfdwsnzqgzdfyxriv.supabase.co`

### 4. Test API
Visit: `https://your-vercel-app.vercel.app/api/funds?kind=YAT`
- Should return JSON with ~1983 funds
- Should NOT return errors

## Deployment Checklist

- [ ] Added build script to root package.json
- [ ] Set VITE_SUPABASE_URL in Vercel env vars
- [ ] Set VITE_SUPABASE_ANON_KEY in Vercel env vars
- [ ] Set SUPABASE_URL in Vercel env vars (for API)
- [ ] Set SUPABASE_ANON_KEY in Vercel env vars (for API)
- [ ] Set SUPABASE_SERVICE_ROLE_KEY in Vercel env vars (for API)
- [ ] Configured all env vars for Production/Preview/Development
- [ ] Updated Supabase GitHub OAuth with Vercel URL
- [ ] Triggered new deployment
- [ ] Tested homepage loads
- [ ] Tested GitHub login works
- [ ] Tested API endpoints return data
- [ ] Tested Export page date column pre-selected

## Troubleshooting

### Build Fails with "Missing script: build"
✅ Fixed by adding build script to root package.json

### Build Succeeds but App Shows Blank Page
- Check browser console for errors
- Verify VITE_* environment variables are set
- Check Vercel build logs for warnings

### GitHub Login Fails
- Verify Vercel env vars have correct Supabase URL
- Check Supabase OAuth redirect URLs
- Clear browser cache and test again

### API Endpoints Return Errors
- Verify backend SUPABASE_* env vars are set
- Check Vercel function logs for errors
- Test API locally first to verify it works

## Quick Command Reference

### Test Build Locally
```bash
npm run build
# Should succeed and create frontend/dist/
```

### Test Production Build Locally
```bash
cd frontend
npm run preview
# Opens production build on local server
```

### Check Environment Variables (Vercel CLI)
```bash
vercel env ls
```

### Trigger Manual Deployment
```bash
vercel --prod
```
