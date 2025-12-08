# TeosPiTaxi - Deployment Steps

## 🚀 NEXT STEPS TO GO LIVE

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Set Up Environment Variables

Create a `.env.local` file with your credentials:

\`\`\`env
# Pi Network Configuration
NEXT_PUBLIC_PI_APP_ID=your_app_id_from_pi_developer_portal
PI_API_KEY=your_pi_api_key_from_developer_portal
TEOS_TREASURY_WALLET=aams1969

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_AI_API_KEY=your_google_gemini_api_key

# Founder Configuration
NEXT_PUBLIC_FOUNDER_REFERRAL=aams1969
\`\`\`

### 3. Set Up Supabase Database

Go to your Supabase project SQL Editor and run these scripts in order:

1. `scripts/001_create_tables.sql` - Core database tables
2. `scripts/002_seed_data.sql` - Initial data with aams1969 as founder
3. `scripts/003_pricing_system.sql` - Dynamic pricing configuration
4. `scripts/004_add_founder_config.sql` - Founder commission settings (15%)
5. `scripts/005_vehicle_restrictions_and_terms.sql` - Vehicle rules and terms tracking
6. `scripts/006_agent_referral_system.sql` - Agent qualification system

### 4. Get Required API Keys

#### Pi Network (Required for payments)
1. Go to https://developers.pi-network.com
2. Click "Create New App"
3. Fill in:
   - App Name: TeosPiTaxi
   - App URL: Your deployment URL
   - Description: Pi-native mobility platform
4. Copy your App ID and API Key

#### Supabase (Required for database)
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → API
4. Copy your Project URL and anon key

#### Google Maps (Required for locations)
1. Go to https://console.cloud.google.com
2. Enable Maps JavaScript API
3. Create API key
4. Add your domain to restrictions

#### Google Gemini (Optional - AI Assistant)
1. Go to https://aistudio.google.com/app/apikey
2. Create API key (Free tier: 6M tokens/day)

### 5. Deploy to Vercel

\`\`\`bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables → Add all from step 2
\`\`\`

### 6. Configure Custom Domain

In your Vercel project:
1. Go to Settings → Domains
2. Add: `teospitaxi.teosegypt.com`
3. Add DNS records as shown by Vercel
4. Wait for SSL certificate (automatic)

### 7. Update Pi Developer Portal

After deployment:
1. Go back to https://developers.pi-network.com
2. Click your TeosPiTaxi app
3. Update App URL to: `https://teospitaxi.teosegypt.com`
4. Save changes

### 8. Test Your App

Open your app in Pi Browser:
1. Launch Pi app on your phone
2. Go to "Apps" section
3. Search for TeosPiTaxi or use your app URL
4. Test:
   - Pi wallet connection
   - Book a test ride
   - Complete a test payment
   - Check commission splits in Supabase

### 9. Submit for Pi Network Verification

Once testing is complete:

1. Go to https://developers.pi-network.com
2. Click your TeosPiTaxi app
3. Click "Submit for Review"
4. Provide:
   - App description
   - Screenshots (rider, driver, payment flows)
   - Test account credentials
   - Privacy policy link
   - Terms of service link
5. Wait for Pi Core Team approval (typically 7-14 days)

### 10. Remove Development Banner

After Pi Core Team approval:

1. Open `components/verification-banner.tsx`
2. Change the banner text to: "VERIFIED BY PI NETWORK"
3. Change background color from yellow to green
4. Redeploy

\`\`\`tsx
// Change this:
<div className="bg-yellow-500/10 border-y border-yellow-500/30">
  <span className="text-yellow-700">DEVELOPMENT APP - PENDING PI CORE TEAM VERIFICATION</span>
</div>

// To this:
<div className="bg-green-500/10 border-y border-green-500/30">
  <span className="text-green-700">✓ VERIFIED BY PI NETWORK</span>
</div>
\`\`\`

## 🎯 Quick Start (Local Development)

\`\`\`bash
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
# Open http://localhost:3000
\`\`\`

## 📱 App Features Checklist

- ✅ Pi Network wallet connection
- ✅ 15% founder commission (aams1969)
- ✅ 5% agent commission
- ✅ 80% driver payout
- ✅ Agent referral system
- ✅ Egyptian location autocomplete
- ✅ Driver document upload
- ✅ Real-time trip tracking
- ✅ AI assistant with Gemini
- ✅ Arabic RTL support
- ✅ Terms & privacy pages
- ✅ Petition signing requirement
- ✅ In-app calling
- ✅ Development banner

## 🆘 Support

- WhatsApp: https://whatsapp.com/channel/0029VbBkdhP4IBhDSAW6Gw2u
- Telegram: https://t.me/teospitaxi
- Founder: aams1969
- Website: https://teospitaxi.teosegypt.com

## 📝 Notes

- The verification banner will show at the top of every page until Pi Core Team approval
- All new users are automatically assigned to aams1969 as their agent until they qualify
- Driver vehicles must be 2020 or newer
- Test thoroughly before submitting for Pi verification

**You're ready to go live! Follow these steps and your TeosPiTaxi will be running in test mode while waiting for Pi Core Team verification.**
