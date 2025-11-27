# TEOSPITAXI - Deployment Guide

Complete guide to deploy your Pi-native mobility dApp to production.

## Prerequisites

1. **Pi Developer Account**: Create at [develop.pi](https://develop.pi)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Supabase Project**: Create at [supabase.com](https://supabase.com)

## Step 1: Pi Network Setup

### Register Your App

1. Go to [Pi Developer Portal](https://develop.pi)
2. Create new app: **TEOSPITAXI**
3. Set app type: **Web App**
4. Note your **App ID** and **API Key**

### Configure Pi App Settings

\`\`\`
App Name: TEOSPITAXI
App URL: https://your-domain.vercel.app
Redirect URL: https://your-domain.vercel.app
Sandbox Mode: Enabled (for testing)
\`\`\`

### Treasury Wallet Setup

1. **Founder Wallet**: `aams1969` (configured as treasury receiver)
2. All treasury payments (10% platform fee) route to this Pi wallet
3. Keep private keys secure (never commit to git)

## Step 2: Database Setup (Supabase)

### Run SQL Scripts

Execute the following scripts in Supabase SQL Editor (in order):

1. `scripts/001_create_tables.sql` - Creates all tables
2. `scripts/002_seed_data.sql` - Seeds initial data
3. `scripts/004_add_founder_config.sql` - Adds founder configuration

### Enable Row Level Security (RLS)

\`\`\`sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies (examples)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own trips" ON trips
  FOR SELECT USING (rider_id = auth.uid() OR driver_id = auth.uid());
\`\`\`

### Get Database Credentials

From Supabase project settings:
- Database URL (for server-side queries)
- Anon/Public Key (for client-side queries)
- Service Role Key (for admin operations)

## Step 3: Environment Variables

Create `.env.local` file with the following:

\`\`\`bash
# Pi Network Configuration
PI_API_KEY=your_pi_api_key_here
NEXT_PUBLIC_PI_APP_ID=your_pi_app_id_here

# TEOS Treasury Configuration
NEXT_PUBLIC_TEOS_TREASURY_ADDRESS=aams1969

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production

# Social Channels
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/teospitaxi
NEXT_PUBLIC_WHATSAPP_URL=https://wa.me/message/TEOSPITAXI
\`\`\`

## Step 4: Deploy to Vercel

### Option 1: Using Vercel CLI

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
\`\`\`

### Option 2: Using GitHub Integration

1. Push code to GitHub repository
2. Import project in Vercel dashboard
3. Add environment variables in Vercel project settings
4. Deploy automatically on push

### Configure Vercel Project Settings

In Vercel dashboard:

1. **Environment Variables**: Add all variables from `.env.local`
2. **Build Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. **Domain**: Add custom domain (optional)

## Step 5: Post-Deployment Configuration

### Update Pi App Settings

1. Go back to Pi Developer Portal
2. Update **App URL** with your Vercel deployment URL
3. Update **Redirect URL** to match
4. Test authentication flow

### Verify Database Connection

1. Open your deployed app
2. Check browser console for database errors
3. Test creating a test trip
4. Verify data appears in Supabase

### Test Payment Flow

1. Enable **Sandbox Mode** in Pi Developer Portal
2. Sign in with Pi testnet account
3. Create a test ride booking
4. Complete test payment
5. Verify escrow creation in database
6. Check payment distribution logs

## Step 6: Go Live

### Production Checklist

- [ ] Pi App approved by Pi Network team
- [ ] Sandbox mode disabled
- [ ] Real Pi wallet addresses configured
- [ ] Database RLS policies tested
- [ ] Payment flows tested end-to-end
- [ ] Error logging setup (Sentry, etc.)
- [ ] Analytics configured
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Terms of service and privacy policy pages added

### Switch to Production Mode

1. Update Pi app settings to production mode
2. Replace sandbox wallet addresses with real ones
3. Update `PI_API_KEY` to production key
4. Redeploy on Vercel

### Monitor Launch

- Watch Vercel logs for errors
- Monitor Supabase database activity
- Check Pi payment transactions
- Test all user flows (rider, driver, admin)

## Step 7: Scaling & Maintenance

### Performance Optimization

- Enable Vercel Edge Functions for API routes
- Add caching for fare calculator
- Optimize database queries with indexes
- Use Vercel Image Optimization

### Security Best Practices

- Rotate API keys monthly
- Monitor for suspicious transactions
- Keep dependencies updated
- Regular security audits
- Implement rate limiting

### Backup Strategy

- Enable Supabase point-in-time recovery
- Export transaction logs daily
- Backup Pi payment records
- Document treasury wallet recovery process

## Support & Resources

- **Pi Network Docs**: https://developers.minepi.com
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **TEOSPITAXI Issues**: [Your GitHub Issues URL]

## Troubleshooting

### Pi Authentication Not Working

- Verify `NEXT_PUBLIC_PI_APP_ID` is correct
- Check Pi SDK is loaded in browser console
- Ensure app URL matches Pi app settings

### Payment Failures

- Check `PI_API_KEY` is valid
- Verify user has sufficient Pi balance
- Check payment approval endpoint logs
- Ensure database connection is stable

### Database Connection Errors

- Verify Supabase credentials
- Check RLS policies aren't blocking queries
- Ensure service role key for admin operations
- Review Supabase connection pooling settings

---

## Quick Start Commands

\`\`\`bash
# Local development
npm install
npm run dev

# Run database migrations
npm run migrate

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
\`\`\`

**Ready to launch TEOSPITAXI!** 🚖⭐️
