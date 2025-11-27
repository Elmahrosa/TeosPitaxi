# TeosPiTaxi - App Store Deployment Guide

## Google Play Store Setup

### 1. Requirements
- Google Play Developer Account ($25 one-time fee)
- App Bundle (.aab file)
- Store Listing Assets

### 2. App Information
- **App Name**: TeosPiTaxi
- **Package Name**: com.teosegypt.teospitaxi
- **Category**: Maps & Navigation
- **Content Rating**: Everyone
- **Privacy Policy URL**: https://teospitaxi.teosegypt.com/privacy

### 3. Store Listing Content

**Short Description** (80 chars):
"Pi-powered ride sharing. Book taxis & bike deliveries with blockchain payments"

**Full Description**:
TeosPiTaxi is Egypt's first Pi Network-powered mobility platform, bringing civic-first ride-sharing to Alexandria and beyond.

**Features:**
• Secure Pi cryptocurrency payments with escrow protection
• Real-time ride tracking and ETA
• Taxi rides and bike delivery services
• In-app calling between riders and drivers
• Dynamic pricing with promotional rates
• Arabic language support
• Part of the Elmahrosa Projects initiative

**Why TeosPiTaxi?**
- Lower fees than traditional ride-sharing apps
- Instant Pi payments to drivers
- Transparent fare calculation
- Built on blockchain for security
- Support digital currency adoption in Egypt

### 4. Assets Required
- App Icon: 512x512px (PNG)
- Feature Graphic: 1024x500px
- Screenshots: 4-8 images (16:9 ratio)
- Video (optional): 30s promotional video

### 5. App Bundle Generation
\`\`\`bash
# Generate Android bundle
npx expo build:android -t app-bundle
\`\`\`

## Apple App Store Setup

### 1. Requirements
- Apple Developer Account ($99/year)
- Xcode and TestFlight for testing
- App Archive (.ipa file)

### 2. App Information
- **App Name**: TeosPiTaxi
- **Bundle ID**: com.teosegypt.teospitaxi
- **SKU**: TEOSPITAXI-001
- **Category**: Navigation
- **Content Rights**: Egyptian transport regulations compliant

### 3. App Store Connect Setup

**Promotional Text**:
"Egypt's first Pi-powered mobility platform. Book rides with cryptocurrency!"

**Description**:
[Same as Google Play full description]

**Keywords**:
pi network, cryptocurrency, ride sharing, taxi, egypt, alexandria, blockchain, delivery

**Support URL**: https://teospitaxi.teosegypt.com/support
**Marketing URL**: https://teosegypt.com

### 4. Screenshots Required
- 6.5" iPhone: 1284 x 2778px (3-5 images)
- 5.5" iPhone: 1242 x 2208px (3-5 images)
- iPad Pro: 2048 x 2732px (3-5 images)

### 5. App Privacy Details
- **Location**: Used for pickup/dropoff and real-time tracking
- **Contact Info**: Phone number for ride communication
- **Payment Info**: Pi wallet address for transactions
- **Usage Data**: Trip history and analytics

### 6. Build and Upload
\`\`\`bash
# Generate iOS archive
npx expo build:ios -t archive

# Upload via Xcode or Transporter
\`\`\`

## Next.js PWA Configuration

### Update next.config.mjs
\`\`\`javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  // existing config
})
\`\`\`

### Required Files
- ✅ `/public/manifest.json` - PWA manifest
- ✅ `/public/apple-app-site-association` - iOS universal links
- ⚠️ `/public/icon-192.png` - App icon 192x192
- ⚠️ `/public/icon-512.png` - App icon 512x512
- ⚠️ Screenshots for store listings

## Domain Configuration

### DNS Records for teospitaxi.teosegypt.com
Already configured in Vercel. Ensure:
- A record pointing to Vercel IP
- CNAME for www subdomain
- SSL certificate auto-provisioned

## App Review Tips

### Google Play
- Provide test Pi account credentials
- Explain Pi Network payment flow in review notes
- Include demo video showing full user journey
- Response time: 1-3 days

### Apple App Store
- Prepare detailed review notes about Pi SDK
- Provide test account with funded Pi wallet
- Explain escrow and payment completion flow
- Response time: 2-5 days

## Post-Launch Checklist
- [ ] Monitor crash reports (Firebase/Sentry)
- [ ] Track user feedback and ratings
- [ ] Update app regularly (bug fixes, features)
- [ ] Respond to user reviews within 24 hours
- [ ] Maintain 4+ star rating for visibility
- [ ] ASO optimization (keywords, screenshots)
