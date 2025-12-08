# How to Download TeosPiTaxi Code

## Option 1: Direct Download from v0 (Recommended)

1. **Click the three dots menu** (⋯) in the top-right corner of the code preview
2. **Select "Download ZIP"**
3. Extract the ZIP file to your local machine
4. Open terminal in the extracted folder
5. Run: `pnpm install` (or `npm install`)

## Option 2: Use v0 Publish to GitHub

1. **Click the "Publish" button** in the top-right corner
2. v0 will create a GitHub repository for you
3. Clone the repository: `git clone [your-repo-url]`
4. Run: `pnpm install`

## After Download

### Install Dependencies
\`\`\`bash
pnpm install
# or
npm install
\`\`\`

### Setup Environment Variables
Copy `.env.example` to `.env.local`:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` with your credentials:
\`\`\`env
# Pi Network (from https://developers.pi-network.com)
PI_API_KEY=your_pi_api_key_here
NEXT_PUBLIC_PI_APP_ID=teospitaxi

# Treasury Wallet (your personal Pi wallet)
TEOS_TREASURY_WALLET=aams1969
FOUNDER_USERNAME=aams1969

# Supabase (auto-added if connected in v0)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API (from https://console.cloud.google.com)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Google AI (from https://aistudio.google.com/app/apikey)
GOOGLE_AI_API_KEY=your_gemini_api_key
\`\`\`

### Run Database Migrations
1. Go to Supabase Dashboard → SQL Editor
2. Run scripts in order:
   - `scripts/001_create_tables.sql`
   - `scripts/002_seed_data.sql`
   - `scripts/003_pricing_system.sql`
   - `scripts/004_add_founder_config.sql`
   - `scripts/005_vehicle_restrictions_and_terms.sql`
   - `scripts/006_agent_referral_system.sql`

### Run Locally
\`\`\`bash
pnpm dev
# or
npm run dev
\`\`\`

Open http://localhost:3000

### Deploy to Vercel
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables → Add all from .env.local
\`\`\`

## Pi Network Wallet Setup (IMPORTANT)

### Your Personal Wallet CAN Be Used for Treasury

Yes, you can use your personal Pi wallet (aams1969) to receive the 10% platform fee. Here's how:

1. **Pi Developer Portal Setup**:
   - Go to https://developers.pi-network.com
   - Sign in with aams1969
   - Create app: TeosPiTaxi
   - Set App URL: https://teospitaxi.teosegypt.com
   - Copy API Key and App ID

2. **Wallet Configuration**:
   - Your personal wallet (aams1969) receives the 10% treasury fee automatically
   - Driver payouts (85%) go directly to driver Pi wallets via SDK transfers
   - Agent commissions (5%) go to the referring agent's Pi wallet

3. **Environment Variables**:
\`\`\`env
PI_API_KEY=your_api_key_from_developer_portal
NEXT_PUBLIC_PI_APP_ID=teospitaxi
TEOS_TREASURY_WALLET=aams1969
\`\`\`

### Agent Referral System

All new users who sign up through TeosPiTaxi are automatically assigned to your account (aams1969) as the primary agent until they qualify to become independent agents.

**Qualification Criteria** (automatic promotion):
- Complete 50+ trips as a driver
- Refer 10+ new users
- Referred users complete 100+ combined trips

Until qualification, you receive 5% commission on all their trips.

## Troubleshooting

### Cannot Download Code
- Make sure you're logged into v0
- Try refreshing the page
- Use Option 2 (Publish to GitHub) instead

### Build Errors on Vercel
- Check all environment variables are set
- Ensure PI_API_KEY is added
- Verify Supabase connection
- Check build logs for specific errors

### Pi Payments Not Working
- Verify PI_API_KEY in Vercel environment variables
- Ensure app is registered at https://developers.pi-network.com
- Test in Pi Browser (not regular Chrome/Safari)
- Check Pi Developer Portal for app approval status

## Support

- WhatsApp: https://whatsapp.com/channel/0029VbBkdhP4IBhDSAW6Gw2u
- Website: https://teospitaxi.teosegypt.com
- Petition: https://www.change.org/p/join-the-movement-sign-the-petition-to-regulate-digital-currencies-in-egypt

## Next Steps

After successful deployment, follow `GO_LIVE_STEPS.md` for production launch checklist.
