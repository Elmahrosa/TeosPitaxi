# TeosPiTaxi - Go Live Deployment Steps

## Pi Wallet Configuration Answer

**Good News:** You CAN use your personal Pi wallet (aams1969) for TeosPiTaxi. Here's how Pi Network handles it:

- **User-to-App Payments (Rides):** Riders pay TO your app wallet automatically
- **Your Treasury Wallet:** Your personal Pi wallet (aams1969) receives the 10% platform fee
- **Driver/Agent Payouts:** Use Pi SDK's server-to-user transfer API to send Pi from your app wallet to drivers (85%) and agents (5%)
- **No Multisig Required:** For simple payment apps, a dedicated multisig wallet is optional, not mandatory

Your current setup is correct - your personal wallet as treasury is compliant.

---

## Step-by-Step Go Live Guide

### STEP 1: Pi Developer Portal Setup (10 minutes)

1. Go to https://developers.pi-network.com
2. Sign in with your Pi account (aams1969)
3. Create or select your TeosPiTaxi app
4. Configure these settings:
   - **App Name:** TeosPiTaxi
   - **App URL:** https://teospitaxi.teosegypt.com
   - **Redirect URLs:** Add https://teospitaxi.teosegypt.com/api/auth/callback
5. Copy these credentials:
   - **App ID** (looks like: teospitaxi or a UUID)
   - **API Key** (long secret string)
6. Under "Wallets" section, confirm your Pi wallet (aams1969) is connected

### STEP 2: Vercel Environment Variables (5 minutes)

1. Go to https://vercel.com/dashboard
2. Select your `teos-pitaxi` project
3. Click **Settings** → **Environment Variables**
4. Add these variables:

\`\`\`
PI_API_KEY = [paste your API key from step 1]
NEXT_PUBLIC_PI_APP_ID = [paste your App ID from step 1]
TEOS_TREASURY_WALLET = aams1969
FOUNDER_USERNAME = aams1969
GOOGLE_MAPS_API_KEY = [get from Google Cloud Console]
GOOGLE_GEMINI_API_KEY = [get from Google AI Studio - FREE]
\`\`\`

5. Click **Save**

### STEP 3: Google Services Setup (15 minutes)

**Google Maps API (Required for location features):**
1. Go to https://console.cloud.google.com
2. Create a new project: "TeosPiTaxi"
3. Enable APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials → API Key
5. Restrict key to your domain: teospitaxi.teosegypt.com
6. Add key to Vercel (GOOGLE_MAPS_API_KEY)

**Google Gemini AI (FREE for AI Assistant):**
1. Go to https://makersuite.google.com/app/apikey
2. Create API key (FREE tier: 6M tokens/day)
3. Add key to Vercel (GOOGLE_GEMINI_API_KEY)

### STEP 4: Supabase Database Setup (20 minutes)

1. Go to https://supabase.com
2. Create new project: "teospitaxi"
3. Wait for database to provision (2-3 minutes)
4. Go to SQL Editor
5. Run these scripts IN ORDER:
   - `scripts/001_create_tables.sql`
   - `scripts/002_seed_data.sql`
   - `scripts/003_pricing_system.sql`
   - `scripts/004_add_founder_config.sql`
   - `scripts/005_vehicle_restrictions_and_terms.sql`
6. Verify tables created: Check Table Editor
7. Connection string auto-added to Vercel via integration

### STEP 5: Custom Domain Setup (10 minutes)

**In your DNS provider (where you manage teosegypt.com):**
1. Add CNAME record:
   - Name: `teospitaxi`
   - Value: `cname.vercel-dns.com`
   - TTL: 3600

**In Vercel:**
1. Go to Project Settings → Domains
2. Add domain: `teospitaxi.teosegypt.com`
3. Vercel will verify DNS (takes 1-5 minutes)
4. SSL certificate auto-generated

**In Pi Developer Portal:**
1. Update App URL to: `https://teospitaxi.teosegypt.com`
2. Update redirect URLs to match

### STEP 6: Deploy to Vercel (2 minutes)

1. Go to Vercel Dashboard → Deployments
2. Click **Redeploy** button
3. Wait for build to complete (2-3 minutes)
4. Check deployment logs for errors

### STEP 7: Test in Pi Browser (10 minutes)

1. Open Pi Browser on your phone
2. Navigate to: `https://teospitaxi.teosegypt.com`
3. Test these flows:
   - **Pi Authentication:** Click "Connect Pi Wallet"
   - **Sign Petition:** Complete the required petition signature
   - **Rider App:** Book a test ride with Alexandria locations
   - **Payment:** Complete Pi payment flow
   - **Driver App:** Register as driver with license upload
   - **AI Assistant:** Ask questions in the chat

### STEP 8: Production Checklist

**Before Public Launch:**
- [ ] All environment variables added to Vercel
- [ ] Custom domain working (teospitaxi.teosegypt.com)
- [ ] Database tables created and seeded
- [ ] Pi authentication working in Pi Browser
- [ ] Test payment completed successfully
- [ ] Google Maps showing Egyptian locations
- [ ] AI Assistant responding to questions
- [ ] Driver registration form accepting uploads
- [ ] Mobile responsive on all screen sizes
- [ ] Terms and Privacy pages accessible
- [ ] WhatsApp channel link working
- [ ] Petition signature required before wallet connection

**Post-Launch Monitoring:**
- [ ] Check Vercel logs for errors
- [ ] Monitor Supabase database usage
- [ ] Track Pi payment transactions
- [ ] Collect user feedback
- [ ] Monitor AI assistant accuracy

---

## Troubleshooting Common Issues

**Issue: "Module not found" errors**
- Solution: Run `pnpm install` locally and redeploy

**Issue: Pi authentication fails**
- Solution: Verify PI_API_KEY and NEXT_PUBLIC_PI_APP_ID in Vercel
- Check Pi Developer Portal app URL matches your domain

**Issue: No locations appearing**
- Solution: Add GOOGLE_MAPS_API_KEY to Vercel
- Check API is enabled in Google Cloud Console

**Issue: AI Assistant not responding**
- Solution: Add GOOGLE_GEMINI_API_KEY to Vercel (FREE tier)
- Fallback responses work even without key

**Issue: Payments not completing**
- Solution: Check TEOS_TREASURY_WALLET matches your Pi username
- Verify your wallet is KYC verified in Pi Network

**Issue: Database errors**
- Solution: Ensure all 5 SQL scripts ran successfully
- Check Supabase connection in Vercel integrations

---

## Payment Flow Verification

**How the 85/10/5 split works:**

1. **Rider books ride:** Fare calculated (e.g., 10 Pi)
2. **Escrow created:** 10 Pi locked in app wallet
3. **Driver completes trip:** Trip status updated to "completed"
4. **Automatic distribution:**
   - 8.5 Pi → Driver wallet (85%)
   - 1.0 Pi → Your treasury (aams1969) (10%)
   - 0.5 Pi → Agent wallet (5%)
5. **Blockchain confirmation:** All transfers recorded on Pi Network

**To verify payments are working:**
1. Complete a test ride end-to-end
2. Check Supabase `payments` table for transaction records
3. Check Pi Network wallet history for transfer confirmations
4. Verify driver received 85% in their Pi wallet

---

## Support Resources

**Pi Network:**
- Developer Portal: https://developers.pi-network.com
- Documentation: https://github.com/pi-apps/pi-platform-docs
- Community: https://minepi.com/community

**Your TeosPiTaxi Channels:**
- WhatsApp: https://whatsapp.com/channel/0029VbBkdhP4IBhDSAW6Gw2u
- Website: https://teospitaxi.teosegypt.com
- Referral: https://minepi.com/aams1969

**Technical Support:**
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Google Maps: https://developers.google.com/maps

---

## Next Steps After Launch

1. **Marketing:** Share on Pi Network social channels
2. **Driver Onboarding:** Recruit drivers in Alexandria
3. **Testing:** Get early users to test payment flows
4. **Iteration:** Collect feedback and improve features
5. **Scale:** Expand to Cairo, Giza, then MENA region

---

**You're ready to go live! Follow these steps in order and TeosPiTaxi will be operational on Pi Network.**
