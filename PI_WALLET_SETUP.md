# Pi Network Wallet Configuration Guide for TeosPiTaxi

## Important Pi Network Requirements

### 1. Wallet Types

**Personal Pi Wallet vs App Wallet:**
- **You MUST use your developer wallet** that's connected to the Pi Developer Portal
- **DO NOT create a separate "app wallet"** - Pi Network uses your most recently accessed developer wallet address
- Your personal wallet (aams1969) can be used as the treasury wallet to receive the 10% platform fee

### 2. Required Setup Steps

#### Step 1: Pi Developer Portal Configuration
1. Go to: https://developers.pi-network.com
2. Sign in with your Pi account (aams1969)
3. Create/Edit your app:
   - **App Name**: TeosPiTaxi
   - **App URL**: https://teospitaxi.teosegypt.com
   - **Wallet**: Your most recently accessed Pi wallet will be used automatically
4. Get your credentials:
   - **App ID**: Your app identifier (e.g., "teospitaxi")
   - **API Key**: Secret key for backend API calls

#### Step 2: Wallet Configuration

**For Testnet (Development):**
- Create a Pi Testnet wallet in Pi Browser
- Use testnet for all development and testing
- No KYC required

**For Mainnet (Production):**
- Must complete Pi KYC verification
- Your mainnet wallet will be used for production transactions
- All transactions must be in Pi only (no fiat)

#### Step 3: Payment Flow Architecture

**TeosPiTaxi uses this payment distribution:**
\`\`\`
Rider pays 100 Pi → Escrow (held by Pi Network)
↓
Trip completed → Payment released:
├─ 85 Pi → Driver (Server-to-User transfer via Pi API)
├─ 10 Pi → Treasury (Your developer wallet: aams1969)
└─  5 Pi → Agent (if applicable, Server-to-User transfer)
\`\`\`

**Supported Payment Types:**
- ✅ **Pioneer-to-App**: Riders pay to your app (SUPPORTED NOW)
- ✅ **App-to-Pioneer**: Your app pays drivers/agents (SUPPORTED via createTransfer API)
- ❌ **Pioneer-to-Pioneer**: Direct user-to-user (NOT YET SUPPORTED by Pi SDK)

### 3. Environment Variables for Vercel

Add these to your Vercel project:

\`\`\`bash
# Pi Network Configuration
PI_API_KEY=your_secret_api_key_from_developer_portal
NEXT_PUBLIC_PI_APP_ID=teospitaxi

# Treasury Configuration
TEOS_TREASURY_WALLET=aams1969
FOUNDER_USERNAME=aams1969

# Database (Supabase)
DATABASE_URL=your_supabase_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Assistant (Optional)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Maps (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
\`\`\`

### 4. Compliance & Security

**Pi Network Rules:**
1. All transactions must be in Pi cryptocurrency only
2. No fiat currency support allowed
3. Transparent fee structure required (10% treasury is acceptable)
4. Must use official Pi SDK for all payments
5. Cannot use external blockchains or tokens

**Security Best Practices:**
1. Never commit PI_API_KEY to repository
2. Use environment variables for all secrets
3. Store wallet addresses in env vars, not hardcoded
4. Enable Supabase Row Level Security (RLS)
5. Validate all payment callbacks server-side

### 5. How Escrow Works

**Automatic Distribution Flow:**
\`\`\`javascript
// 1. Rider initiates payment (Pioneer-to-App)
const payment = await Pi.createPayment({
  amount: 100,
  memo: "Ride from Alexandria to Cairo",
  metadata: { tripId: "123" }
})

// 2. Your backend approves escrow
await approvePayment(payment.identifier)

// 3. Pi Network holds funds in escrow until trip completes

// 4. Trip completed → Your backend distributes funds
await completePayment(payment.identifier, txid)

// 5. Automatic transfers:
// - Driver gets 85 Pi (via createTransfer API)
// - Agent gets 5 Pi (via createTransfer API)
// - Treasury keeps 10 Pi (automatically in your developer wallet)
\`\`\`

### 6. Testing Payments

**In Development (Testnet):**
1. Use Pi Browser with testnet wallet
2. Test full payment flow with testnet Pi
3. Verify distribution percentages

**Before Mainnet Launch:**
1. Complete Pi KYC verification
2. Test all payment scenarios on testnet
3. Document payment flow for Pi Network review
4. Ensure compliance with listing requirements

### 7. Common Issues & Solutions

**Issue: "PI_API_KEY not configured"**
- Solution: Add PI_API_KEY to Vercel environment variables and redeploy

**Issue: "Transfer failed - recipient not found"**
- Solution: Ensure driver/agent has Pi wallet connected and KYC verified

**Issue: "Payment stuck in escrow"**
- Solution: Must call completePayment() with valid txid after blockchain confirmation

**Issue: "Treasury not receiving funds"**
- Solution: Treasury gets 10% automatically when payment completes - check developer wallet balance

### 8. Pi Network Verification Checklist

Before submitting for Pi Mainnet listing:
- [ ] App uses official Pi SDK
- [ ] All payments in Pi cryptocurrency only
- [ ] Transparent fee structure documented
- [ ] Escrow flow properly implemented
- [ ] Server-side payment validation
- [ ] No external blockchain integrations
- [ ] Privacy policy and terms of service
- [ ] KYC verification completed
- [ ] Testnet testing completed
- [ ] Clean repository with no secrets

---

## Your Current Setup Status

✅ **Correctly Configured:**
- Treasury wallet: aams1969 (your personal wallet)
- Payment distribution: 85% driver, 10% treasury, 5% agent
- Using official Pi SDK
- Server-side payment validation
- Clean repository

⚠️ **Action Required:**
1. Add PI_API_KEY to Vercel environment variables
2. Complete KYC for mainnet launch
3. Test payment flow on testnet
4. Add GOOGLE_GENERATIVE_AI_API_KEY for AI assistant

---

For more information:
- Pi Developer Guide: https://pi-apps.github.io/community-developer-guide/
- Pi Developer Portal: https://developers.pi-network.com
