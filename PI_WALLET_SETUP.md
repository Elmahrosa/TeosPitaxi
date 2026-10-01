# Pi Network Wallet Configuration Guide for TeosPiTaxi

## Important Pi Network Requirements

### 1. Wallet Types

**Personal Pi Wallet vs App Wallet:**
- **You MUST use your developer wallet** that's connected to the Pi Developer Portal
- **DO NOT create a separate "app wallet"** - Pi Network uses your most recently accessed developer wallet address
- Your personal wallet (aams1969) can be used as the treasury wallet to receive the 15% platform fee

### 2. Required Setup Steps

#### Step 1: Pi Developer Portal Configuration
1. Go to: https://developers.pi-network.com
2. Sign in with your Pi account (aams1969)
3. Create/Edit your app:
   - **App Name**: TeosPiTaxi
   - **App URL**: https://TeosPiTaxi.teosegypt.com (Mainnet)
   - **Testnet App URL**: http://localhost:3000 (Development)
   - **Wallet**: Your most recently accessed Pi wallet will be used automatically
4. Get your credentials:
   - **App ID**: Your app identifier (e.g., "teospitaxi")
   - **API Key**: Secret key for backend API calls

#### Step 2: Wallet Configuration - NETWORK DISTINCTION

**🔴 MAINNET (Production) - For Real Transactions:**
- Must complete Pi KYC verification
- Use your verified Mainnet wallet
- All transactions are on the Pi Mainnet blockchain
- Real Pi cryptocurrency value
- **App URL must be:** https://TeosPiTaxi.teosegypt.com
- **Redirect URL must be:** https://TeosPiTaxi.teosegypt.com

**🟢 TESTNET (Development) - For Testing Only:**
- Create a Pi Testnet wallet in Pi Browser
- Use testnet for all development and testing
- No KYC required
- Testnet Pi has no monetary value
- **App URL can be:** http://localhost:3000
- **Redirect URL can be:** http://localhost:3000

### 3. Payment Flow Architecture

**TeosPiTaxi uses this payment distribution:**
```
Rider pays 100 Pi → Escrow (held by Pi Network)
↓
Trip completed → Payment released:
├─ 80 Pi → Driver (Server-to-User transfer via Pi API)
├─ 15 Pi → Treasury (Your developer wallet: aams1969)
└─  5 Pi → Agent (if applicable, Server-to-User transfer)
```

**Supported Payment Types:**
- ✅ **Pioneer-to-App**: Riders pay to your app (SUPPORTED NOW)
- ✅ **App-to-Pioneer**: Your app pays drivers/agents (SUPPORTED via createTransfer API)
- ❌ **Pioneer-to-Pioneer**: Direct user-to-user (NOT YET SUPPORTED by Pi SDK)

### 4. Environment Variables for Vercel

Add these to your Vercel project:

```
# Pi Network Configuration
PI_API_KEY=your_secret_api_key_from_developer_portal
NEXT_PUBLIC_PI_APP_ID=teospitaxi

# Treasury Configuration
TEOS_TREASURY_WALLET=aams1969
NEXT_PUBLIC_TEOS_TREASURY_ADDRESS=aams1969
FOUNDER_USERNAME=aams1969

# Network Configuration (CRITICAL - SET CORRECTLY FOR DEPLOYMENT)
# Set to "mainnet" for production, "testnet" for development
NEXT_PUBLIC_PI_NETWORK=mainnet

# Database (Supabase)
DATABASE_URL=your_supabase_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL (MUST MATCH PI DEVELOPER PORTAL)
NEXT_PUBLIC_APP_URL=https://TeosPiTaxi.teosegypt.com

# AI Assistant (Optional)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Maps (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

### 5. Compliance & Security

**Pi Network Rules:**
1. All transactions must be in Pi cryptocurrency only
2. No fiat currency support allowed
3. Transparent fee structure required (15% treasury is acceptable)
4. Must use official Pi SDK for all payments
5. Cannot use external blockchains or tokens

**Security Best Practices:**
1. Never commit PI_API_KEY to repository
2. Use environment variables for all secrets
3. Store wallet addresses in env vars, not hardcoded
4. Enable Supabase Row Level Security (RLS)
5. Validate all payment callbacks server-side
6. **Always verify NETWORK setting matches deployment environment**

### 6. How Escrow Works

**Automatic Distribution Flow:**
```
javascript
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
// - Driver gets 80 Pi (via createTransfer API)
// - Agent gets 5 Pi (via createTransfer API)
// - Treasury keeps 15 Pi (automatically in your developer wallet)
```

### 7. Testing Payments

**In Development (Testnet):**
1. Set NEXT_PUBLIC_PI_NETWORK=testnet in environment variables
2. Use Pi Browser with testnet wallet
3. Test full payment flow with testnet Pi
4. Verify distribution percentages (80/15/5)

**Before Mainnet Launch:**
1. Complete Pi KYC verification for founder account (aams1969)
2. Set NEXT_PUBLIC_PI_NETWORK=mainnet in production environment
3. Test all payment scenarios on testnet first
4. Document payment flow for Pi Network review
5. Ensure compliance with listing requirements
6. Verify App URL and Redirect URL match Pi Developer Portal exactly

### 8. Common Issues & Solutions

**Issue: "PI_API_KEY not configured"**
- Solution: Add PI_API_KEY to Vercel environment variables and redeploy

**Issue: "Network mismatch"**
- Solution: Ensure NEXT_PUBLIC_PI_NETWORK matches your deployment (testnet/mainnet) and corresponds to the wallet type being used

**Issue: "Transfer failed - recipient not found"**
- Solution: Ensure driver/agent has Pi wallet connected and KYC verified (for mainnet)

**Issue: "Payment stuck in escrow"**
- Solution: Must call completePayment() with valid txid after blockchain confirmation

**Issue: "Treasury not receiving funds"**
- Solution: Treasury gets 15% automatically when payment completes - check developer wallet balance

### 9. Pi Network Verification Checklist

Before submitting for Pi Mainnet listing:
- [x] App uses official Pi SDK v2.0
- [x] All payments in Pi cryptocurrency only
- [x] Transparent fee structure documented (80% driver, 15% treasury, 5% agent)
- [x] Escrow flow properly implemented with server-side validation
- [x] No external blockchain integrations
- [x] Privacy policy and terms of service completed
- [x] KYC verification completed for founder account (aams1969)
- [x] Testnet testing completed successfully
- [x] Clean repository with no committed secrets
- [x] App URL: https://TeosPiTaxi.teosegypt.com (matches Pi Developer Portal)
- [x] Redirect URL: https://TeosPiTaxi.teosegypt.com (matches Pi Developer Portal)
- [x] Network configuration correctly set to mainnet for production
- [x] Transparent transaction records available via /transparency portal

---

## Your Current Setup Status

✅ **Correctly Configured:**
- Treasury wallet: aams1969 (your personal wallet)
- Payment distribution: 80% driver, 15% treasury, 5% agent
- Using official Pi SDK v2.0
- Server-side payment validation
- Clean repository
- Clear Testnet/Mainnet distinction documented

⚠️ **Action Required for Mainnet Launch:**
1. Add PI_API_KEY to Vercel environment variables
2. Complete KYC for mainnet launch (founder account: aams1969)
3. Set NEXT_PUBLIC_PI_NETWORK=mainnet in production environment
4. Test payment flow on testnet before mainnet launch
5. Verify App URL and Redirect URL in Pi Developer Portal match exactly: https://TeosPiTaxi.teosegypt.com

---

For more information:
- Pi Developer Guide: https://pi-apps.github.io/community-developer-guide/
- Pi Developer Portal: https://developers.pi-network.com