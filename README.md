# TEOSPITAXI - Pi-Native Mobility dApp

**Civic-first mobility platform powered by Pi Network**

TEOSPITAXI is a production-ready, Pi-native mobility dApp that provides taxi rides and bike deliveries with transparent governance, secure escrow payments, and automated treasury management.

## Features

- **100% Pi Network Payments** - All transactions use Pi cryptocurrency with escrow protection
- **Multi-Service Platform** - Taxi rides, bike deliveries, and global agent network
- **Transparent Governance** - Public audit trails and civic-first approach
- **Automated Escrow** - Smart payment distribution: 15% TEOS Treasury, 5% Agent Commission, 80% Driver Payout
- **Dispute Resolution** - Admin-managed dispute system with automated refunds
- **Arabic RTL Support** - Full localization for MENA region (Alexandria, Egypt launch)
- **Real-time Tracking** - Live ride status and driver location updates
- **Mobile-First Design** - Optimized for mobile devices with PWA support
- **Terms Acceptance** - Users must accept terms before using the platform
- **Patent Agreement Signing** - Drivers and agents must sign a patent agreement
- **Vehicle Restrictions** - Only 2020+ models are allowed

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Blockchain**: Pi Network SDK v2.0
- **UI Components**: shadcn/ui with Radix UI primitives
- **Authentication**: Pi Network OAuth
- **Database**: Supabase with Row Level Security (RLS)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account
- Pi Network Developer account and API key

### Installation

1. **Clone and install dependencies:**

\`\`\`bash
npm install
\`\`\`

2. **Set up environment variables:**

Create a `.env.local` file in the root directory:

\`\`\`env
# Pi Network Configuration
PI_API_KEY=your_pi_api_key_here
NEXT_PUBLIC_PI_APP_ID=your_pi_app_id_here

# TEOS Treasury (Use your NEW wallet address from Pi Developer app)
TEOS_TREASURY_WALLET=your_new_wallet_address_from_dev_app
NEXT_PUBLIC_TEOS_TREASURY_ADDRESS=your_new_wallet_address_from_dev_app
FOUNDER_USERNAME=aams1969

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://TeosPiTaxi.teosegypt.com
NODE_ENV=production

# Social Channels
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/teospitaxi
NEXT_PUBLIC_WHATSAPP_URL=https://whatsapp.com/channel/0029VbBkdhP4IBhDSAW6Gw2u

# Development redirect for Pi Auth
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

3. **Initialize the database:**

The SQL scripts in `/scripts` folder need to be executed in your Supabase database:

- `001_create_tables.sql` - Creates all database tables with RLS policies
- `002_seed_data.sql` - Seeds initial data (TEOS Treasury account, etc.)
- `003_pricing_system.sql` - Dynamic pricing and promotional configs
- `004_add_founder_config.sql` - Founder configuration (aams1969)
- `005_vehicle_restrictions_and_terms.sql` - Vehicle requirements and terms acceptance

You can run these scripts directly from the v0 interface or in your Supabase SQL editor.

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx                    # Landing page
│   ├── rider/page.tsx              # Rider app
│   ├── driver/page.tsx             # Driver app
│   ├── agent/page.tsx              # Agent app
│   ├── delivery/page.tsx           # Delivery app
│   ├── admin/page.tsx              # Admin dashboard
│   ├── transparency/page.tsx       # Public transparency portal
│   ├── terms/page.tsx              # Terms of Service
│   ├── privacy/page.tsx            # Privacy Policy
│   └── api/
│       ├── trips/                  # Trip management APIs
│       ├── payments/               # Payment & escrow APIs
│       ├── disputes/               # Dispute resolution APIs
│       ├── transparency/           # Public transparency APIs
│       └── pricing/                # Dynamic pricing APIs
├── lib/
│   ├── supabase.ts                 # Supabase client & types
│   ├── pi-sdk.ts                   # Pi SDK client-side
│   ├── pi-sdk-server.ts            # Pi SDK server-side
│   ├── fare-calculator.ts          # Fare calculation engine
│   ├── trip-service.ts             # Trip business logic
│   ├── api-client.ts               # Frontend API client
│   ├── i18n.ts                     # Internationalization
│   └── dynamic-pricing.ts        # Dynamic pricing configuration
├── contexts/
│   ├── pi-context.tsx              # Pi authentication context
│   └── locale-context.tsx          # Localization context
├── scripts/
│   ├── 001_create_tables.sql      # Database schema
│   ├── 002_seed_data.sql          # Seed data
│   ├── 003_pricing_system.sql     # Dynamic pricing and promotional configs
│   ├── 004_add_founder_config.sql # Founder configuration (aams1969)
│   └── 005_vehicle_restrictions_and_terms.sql # Vehicle requirements and terms acceptance
└── components/                     # Reusable UI components
\`\`\`

## API Endpoints

### Trip Management

- `POST /api/trips/create` - Create new ride request
- `POST /api/trips/accept` - Driver accepts ride
- `POST /api/trips/update-status` - Update ride status

### Payments & Escrow

- `POST /api/payments/escrow` - Fund escrow for trip
- `POST /api/payments/complete-trip` - Complete trip and distribute payments
- `GET /api/payments/status` - Get payment status

### Disputes

- `POST /api/disputes/create` - File a dispute
- `POST /api/disputes/resolve` - Admin resolves dispute

### Transparency (Public)

- `POST /api/transparency/fare-calculator` - Calculate fare with surge
- `GET /api/transparency/stats` - Public platform statistics

### Dynamic Pricing

- `POST /api/pricing/create-config` - Create new pricing configuration
- `POST /api/pricing/update-config` - Update existing pricing configuration
- `GET /api/pricing/config` - Retrieve current pricing configuration

### Agent Management

- `POST /api/agents/check-qualification` - Check if user meets qualification criteria

## Payment Flow

1. **Rider requests trip** → System calculates fare with surge multiplier
2. **Rider funds escrow** → Pi Payment Intent created and approved
3. **Driver accepts & completes trip** → Trip status updates tracked
4. **Automatic distribution:**
   - 15% → TEOS Treasury (Founder)
   - 5% → Referring Agent (if applicable)
   - 80% → Driver Payout

All payments are logged in `payment_transactions` table with full audit trail.

## Agent Referral System

TeosPiTaxi features an innovative agent referral system designed to ensure quality onboarding and fair compensation:

### Founder Agent (aams1969)

- **All new riders and drivers** who join TeosPiTaxi are automatically assigned to the founder (aams1969) as their referring agent
- This ensures proper onboarding, training, and support for all new users
- Founder receives 5% commission on all trips from referred users until they qualify as independent agents
- Transparent tracking of all referrals and commissions in the database

### Qualification to Independent Agent

Users can become independent agents by meeting these criteria:
1. **Complete 50+ trips** as a driver with good ratings
2. **Refer 10+ new users** to the platform (riders or drivers)
3. **Referred users complete 100+ combined trips**

Once qualified, users are **automatically promoted** to independent agents and can:
- Earn 5% commission on their own referrals
- Build their own agent network
- Access advanced analytics and referral tracking tools
- Maintain their relationship with the founder network

### Commission Distribution

Every completed trip automatically splits payment as follows:
- **80%** → Driver (transferred directly to their Pi wallet)
- **15%** → Platform Treasury (TEOS development fund at aams1969 wallet)
- **5%** → Referring Agent (founder aams1969 or qualified independent agent)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The app will be available at `your-project.vercel.app`

### Custom Domain Setup

**Domain:** TeosPiTaxi.teosegypt.com

1. **DNS Configuration:**
   - Add CNAME record: `TeosPiTaxi` → `cname.vercel-dns.com`
   - Wait for DNS propagation (5-60 minutes)

2. **Vercel Setup:**
   - Add domain in Vercel dashboard
   - SSL certificate auto-configured

3. **Update Pi Developer Portal:**
   - App URL: `https://TeosPiTaxi.teosegypt.com`
   - Redirect URL: `https://TeosPiTaxi.teosegypt.com`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Configuration

### Fare Calculator

Edit `lib/fare-calculator.ts` to adjust:
- Base fare (default: 5 Pi)
- Per-kilometer rate (default: 2 Pi/km)
- Per-minute rate (default: 0.5 Pi/min)
- Treasury fee percentage (default: 15%)
- Agent commission percentage (default: 5%)
- Minimum fare (default: 8 Pi)

### Dynamic Pricing

Admins can create promotional pricing configurations through the admin dashboard:
- First-month discounts
- Seasonal promotions
- Region-specific pricing
- Time-based pricing adjustments

All pricing changes are tracked with full audit history in the database.

## Security

- **Row Level Security (RLS)** enabled on all tables
- **Pi Network OAuth** for authentication
- **Server-side payment verification** prevents fraud
- **Escrow protection** for all transactions
- **Audit trails** for transparency
- **Terms acceptance required** before platform use
- **Patent agreement signing** for drivers and agents
- **Vehicle restrictions** enforced (2020+ models only)
- **Zod validation** on all API endpoints

## Legal Pages

The platform includes comprehensive legal documentation:
- **Terms of Service** (`/terms`) - Platform usage terms, driver requirements, payment terms, Elmahrosa Projects partnership
- **Privacy Policy** (`/privacy`) - Data collection, blockchain transparency, user rights, international transfers

Both pages are accessible from the footer and include:
- Arabic and English versions
- Mobile-responsive design
- Links to WhatsApp community for support

## Support

For issues or questions:
- Check the [Pi Developer Docs](https://github.com/pi-apps/pi-platform-docs)
- **WhatsApp Community:** [Join Channel](https://whatsapp.com/channel/0029VbBkdhP4IBhDSAW6Gw2u)
- **Telegram:** [@teospitaxi](https://t.me/teospitaxi)
- **Website:** [TeosPiTaxi.teosegypt.com](https://TeosPiTaxi.teosegypt.com)
- **Founder:** aams1969 (Pi Network)

**Built with ❤️ for the Pi Network community**

*Launching in Alexandria, Egypt 🇪🇬*
*Part of Elmahrosa Projects - Civic-first innovation*
