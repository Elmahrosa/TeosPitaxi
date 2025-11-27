# TEOSPITAXI - Pi-Native Mobility dApp

**Civic-first mobility platform powered by Pi Network**

TEOSPITAXI is a production-ready, Pi-native mobility dApp that provides taxi rides and bike deliveries with transparent governance, secure escrow payments, and automated treasury management.

## Features

- **100% Pi Network Payments** - All transactions use Pi cryptocurrency with escrow protection
- **Multi-Service Platform** - Taxi rides, bike deliveries, and global agent network
- **Transparent Governance** - Public audit trails and civic-first approach
- **Automated Escrow** - Smart payment distribution: 10% TEOS Treasury, 5% Agent Commission, 85% Driver Payout
- **Dispute Resolution** - Admin-managed dispute system with automated refunds
- **Arabic RTL Support** - Full localization for MENA region (Alexandria, Egypt launch)
- **Real-time Tracking** - Live ride status and driver location updates
- **Mobile-First Design** - Optimized for mobile devices with PWA support

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

Create a \`.env.local\` file in the root directory:

\`\`\`env
# Pi Network
PI_API_KEY=your_pi_api_key_here
NEXT_PUBLIC_PI_APP_ID=your_pi_app_id_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Development redirect for Pi Auth
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

3. **Initialize the database:**

The SQL scripts in \`/scripts\` folder need to be executed in your Supabase database:

- \`001_create_tables.sql\` - Creates all database tables with RLS policies
- \`002_seed_data.sql\` - Seeds initial data (TEOS Treasury account, etc.)

You can run these scripts directly from the v0 interface or in your Supabase SQL editor.

4. **Run the development server:**

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

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
│   └── api/
│       ├── trips/                  # Trip management APIs
│       ├── payments/               # Payment & escrow APIs
│       ├── disputes/               # Dispute resolution APIs
│       └── transparency/           # Public transparency APIs
├── lib/
│   ├── supabase.ts                 # Supabase client & types
│   ├── pi-sdk.ts                   # Pi SDK client-side
│   ├── pi-sdk-server.ts            # Pi SDK server-side
│   ├── fare-calculator.ts          # Fare calculation engine
│   ├── trip-service.ts             # Trip business logic
│   ├── api-client.ts               # Frontend API client
│   └── i18n.ts                     # Internationalization
├── contexts/
│   ├── pi-context.tsx              # Pi authentication context
│   └── locale-context.tsx          # Localization context
├── scripts/
│   ├── 001_create_tables.sql      # Database schema
│   └── 002_seed_data.sql          # Seed data
└── components/                     # Reusable UI components
\`\`\`

## API Endpoints

### Trip Management

- \`POST /api/trips/create\` - Create new ride request
- \`POST /api/trips/accept\` - Driver accepts ride
- \`POST /api/trips/update-status\` - Update ride status

### Payments & Escrow

- \`POST /api/payments/escrow\` - Fund escrow for trip
- \`POST /api/payments/complete-trip\` - Complete trip and distribute payments
- \`GET /api/payments/status\` - Get payment status

### Disputes

- \`POST /api/disputes/create\` - File a dispute
- \`POST /api/disputes/resolve\` - Admin resolves dispute

### Transparency (Public)

- \`POST /api/transparency/fare-calculator\` - Calculate fare with surge
- \`GET /api/transparency/stats\` - Public platform statistics

## Payment Flow

1. **Rider requests trip** → System calculates fare with surge multiplier
2. **Rider funds escrow** → Pi Payment Intent created and approved
3. **Driver accepts & completes trip** → Trip status updates tracked
4. **Automatic distribution:**
   - 10% → TEOS Treasury
   - 5% → Referring Agent (if applicable)
   - 85% → Driver Payout

All payments are logged in \`payment_transactions\` table with full audit trail.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The app will be available at \`your-project.vercel.app\`

### Database Setup

Run the SQL scripts in your Supabase project:
1. Go to Supabase SQL Editor
2. Execute \`scripts/001_create_tables.sql\`
3. Execute \`scripts/002_seed_data.sql\`

### Pi Network Setup

1. Register your app at [Pi Developer Portal](https://develop.pi)
2. Add your app's domain to allowed origins
3. Get your API key and App ID
4. Add to environment variables

## Configuration

### Fare Calculator

Edit \`lib/fare-calculator.ts\` to adjust:
- Base fare (default: 5 Pi)
- Per-kilometer rate (default: 2 Pi/km)
- Per-minute rate (default: 0.5 Pi/min)
- Treasury fee percentage (default: 10%)
- Agent commission percentage (default: 5%)
- Minimum fare (default: 8 Pi)

### Surge Pricing

Surge multiplier is calculated based on supply/demand:
- 3:1 demand ratio → 2.0x surge
- 2:1 demand ratio → 1.5x surge
- 1.5:1 demand ratio → 1.3x surge
- Below 1.5:1 → No surge

## Security

- **Row Level Security (RLS)** enabled on all tables
- **Pi Network OAuth** for authentication
- **Server-side payment verification** prevents fraud
- **Escrow protection** for all transactions
- **Audit trails** for transparency

## Localization

The app supports:
- English (en)
- Arabic (ar) with RTL support

Add more languages in \`lib/i18n.ts\`

## Support

For issues or questions:
- Check the [Pi Developer Docs](https://github.com/pi-apps/pi-platform-docs)
- Contact TEOSPITAXI support at treasury@teospitaxi.com

## License

Proprietary - TEOSPITAXI Platform

---

**Built with ❤️ for the Pi Network community**

*Launching in Alexandria, Egypt 🇪🇬*
\`\`\`

I've integrated the production backend with the frontend rider app, adding real fare calculation, trip creation, and escrow funding using the database and Pi SDK. The comprehensive README provides deployment instructions, API documentation, project structure, and configuration details for a complete production-ready TEOSPITAXI platform.
