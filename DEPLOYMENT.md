## Domain Configuration

### Custom Domain: TeosPiTaxi.teosegypt.com

**DNS Setup:**
1. Go to your DNS provider (where you manage teosegypt.com)
2. Add CNAME record:
   \`\`\`
   Type: CNAME
   Host/Name: TeosPiTaxi
   Value: cname.vercel-dns.com
   TTL: 3600 (or Auto)
   \`\`\`

3. Verify DNS propagation (5-60 minutes)
   \`\`\`bash
   nslookup TeosPiTaxi.teosegypt.com
   \`\`\`

**Vercel Configuration:**
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter: `TeosPiTaxi.teosegypt.com`
4. Follow verification steps
5. SSL certificate auto-configured

**Update Environment Variables:**
After domain is active:
\`\`\`bash
NEXT_PUBLIC_APP_URL=https://TeosPiTaxi.teosegypt.com
\`\`\`

**Update Pi Developer Portal:**
Critical: Update your Pi app settings:
- **App URL:** `https://TeosPiTaxi.teosegypt.com`
- **Redirect URL:** `https://TeosPiTaxi.teosegypt.com`
- **Callback URL:** `https://TeosPiTaxi.teosegypt.com`

Without this update, Pi authentication will fail!


## Environment Variables Configuration

### Required Variables

**Pi Network Credentials:**
\`\`\`bash
PI_API_KEY=your_secret_api_key
NEXT_PUBLIC_PI_APP_ID=your_app_id
\`\`\`

**Treasury Wallet (IMPORTANT - Use your NEW wallet address):**
\`\`\`bash
TEOS_TREASURY_WALLET=your_new_wallet_address_from_dev_app
NEXT_PUBLIC_TEOS_TREASURY_ADDRESS=your_new_wallet_address_from_dev_app
FOUNDER_USERNAME=aams1969
\`\`\`

**Note:** You mentioned creating a new wallet in the Pi Developer app. Make sure to:
1. Copy the wallet address (NOT the seed phrase)
2. Add it to both `TEOS_TREASURY_WALLET` and `NEXT_PUBLIC_TEOS_TREASURY_ADDRESS`
3. Keep the seed phrase secure and NEVER commit it to git
4. This wallet will receive all 10% platform fees

**Google Maps Integration:**
\`\`\`bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
\`\`\`

To get your Google Maps API key:
1. Go to https://console.cloud.google.com
2. Create project: "TeosPiTaxi"
3. Enable APIs: Maps JavaScript API, Directions API, Places API
4. Create API key with domain restriction: `teospitaxi.teosegypt.com`
5. Add to Vercel environment variables

**AI Assistant Configuration**

**No setup required!** The AI assistant uses Google Gemini (free tier) via Vercel AI Gateway.

**Features:**
- **6 Million tokens per day** free limit
- **Complete TeosPiTaxi knowledge** built-in
- **No API key needed** - works out of the box
- **Comprehensive answers** without external redirects
- **Intelligent fallback** if AI service fails

**The assistant knows everything about:**
- Booking rides across Egyptian cities
- Pi cryptocurrency payments and escrow
- Driver registration and requirements
- Agent network and commissions
- Fare calculation and pricing
- Vehicle requirements (2020+)
- Document uploads
- Petition signing
- Pi Network referral (aams1969)
- Platform policies and features

Users get instant detailed answers without being redirected to WhatsApp or Telegram!


## Production Optimizations

### Performance Features Enabled

- **Next.js 15 with SWC Minification**: Faster builds and smaller bundles
- **Vercel Edge Network**: Global CDN for improved performance
- **Compression**: Gzip/Brotli for all assets
- **Image Optimization**: Automatic image resizing and format conversion
- **Code Splitting**: Lazy load routes and components
- **Tree Shaking**: Remove unused code
- **Aggressive Caching Strategies**: Efficient browser caching
- **React Strict Mode**: Better error detection in development
- **ETag Generation**: Efficient browser caching

### TeosPiTaxi Speed Advantages

1. **Payment Processing:**
   - Uber: 3-5 days bank transfer
   - TeosPiTaxi: Instant blockchain settlement

2. **Driver Payouts:**
   - Uber: Weekly payouts (25-30% fees)
   - TeosPiTaxi: Immediate 85% after trip completion

3. **Fare Transparency:**
   - Uber: Opaque surge pricing
   - TeosPiTaxi: Blockchain-verified transparent rates

4. **Platform Efficiency:**
   - Uber: Centralized servers (single point of failure)
   - TeosPiTaxi: Decentralized Pi Network + Edge CDN

5. **Fee Structure:**
   - Uber: 25-30% commission
   - TeosPiTaxi: 10% (civic-first, community benefits)


## App Store Deployment

TeosPiTaxi is ready for mobile app stores! See `APP_STORE_SETUP.md` for:

- **Google Play Store**: Complete submission guide with required assets
- **Apple App Store**: iOS build and TestFlight setup
- **PWA Installation**: Progressive Web App manifest configured
- **Deep Links**: Universal links for iOS and Android app links
- **Screenshots & Icons**: Asset requirements and specifications

**Quick Checklist:**
- [ ] Generate app icons (192x192 and 512x512)
- [ ] Take screenshots on different device sizes
- [ ] Complete store listing descriptions
- [ ] Set up developer accounts (Google: $25, Apple: $99/year)
- [ ] Test petition signing flow before submission
- [ ] Prepare demo Pi account for app reviewers


## Social & Community Links

- **WhatsApp Channel**: https://whatsapp.com/channel/0029VbBkdhP4IBhDSAW6Gw2u
- **Petition**: https://www.change.org/p/join-the-movement-sign-the-petition-to-regulate-digital-currencies-in-egypt
- **Support**: Contact via in-app help or WhatsApp community
