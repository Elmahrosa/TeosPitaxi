# Vercel Deployment Fix Guide

## Current Issues & Solutions

### Issue 1: Import Errors / Module Not Found

**Symptoms:**
- `Cannot find module '@/...'`
- Build fails during `next build`

**Solution:**
\`\`\`bash
# In your local repository:
1. Delete node_modules and lock files
rm -rf node_modules pnpm-lock.yaml package-lock.json yarn.lock

2. Reinstall dependencies
pnpm install

3. Test build locally
pnpm build

4. If successful, commit and push
git add .
git commit -m "Fix dependencies for Vercel deployment"
git push
\`\`\`

### Issue 2: Environment Variables Not Set

**Symptoms:**
- `PI_API_KEY not configured`
- `DATABASE_URL missing`
- Payment errors in production

**Solution:**
1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: `teospitaxi`
3. Go to Settings → Environment Variables
4. Add ALL required variables (see PI_WALLET_SETUP.md)
5. Click Deployments → Redeploy latest

### Issue 3: Crypto Module Error

**Error:**
\`\`\`
Module not found: Can't resolve 'crypto'
\`\`\`

**Solution - Remove crypto dependency:**
