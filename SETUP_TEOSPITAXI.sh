#!/bin/bash
# TeosPiTaxi - Complete Deployment Script
# Run this script to create your entire project structure

echo "Creating TeosPiTaxi project structure..."

# Create main directories
mkdir -p teospitaxi/{app/{api/{trips,payments,transparency,admin,chat,driver,onboarding,agents},rider,driver,admin,agent,delivery,terms,privacy},components/{ui},contexts,lib,scripts,public}

# Create package.json
cat > teospitaxi/package.json << 'EOF'
{
  "name": "teospitaxi",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next": "^15.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.0.10",
    "@ai-sdk/google": "^1.0.0",
    "ai": "^4.0.0",
    "zod": "^3.25.76",
    "axios": "^1.7.9",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-switch": "^1.0.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.263.1",
    "recharts": "^2.10.3",
    "vaul": "^1.1.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
EOF

# Create next.config.mjs
cat > teospitaxi/next.config.mjs << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['placeholder.svg', 'blob.v0.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
EOF

# Create tsconfig.json
cat > teospitaxi/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# Create .env.example
cat > teospitaxi/.env.example << 'EOF'
# Pi Network Credentials
PI_API_KEY=your_pi_api_key_here
NEXT_PUBLIC_PI_APP_ID=teospitaxi

# Treasury Wallet (aams1969)
TEOS_TREASURY_WALLET=aams1969
FOUNDER_USERNAME=aams1969

# Supabase Database
DATABASE_URL=your_supabase_database_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Google Gemini AI (Free)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# App Domain
NEXT_PUBLIC_APP_URL=https://teospitaxi.teosegypt.com

# Commission Split (15% founder, 5% agent, 80% driver)
TREASURY_COMMISSION=0.15
AGENT_COMMISSION=0.05
DRIVER_COMMISSION=0.80
EOF

# Create README
cat > teospitaxi/README.md << 'EOF'
# TeosPiTaxi - Pi-Native Mobility dApp

The first Pi blockchain-powered ride-sharing and delivery platform.

## Commission Structure
- Founder (aams1969): 15%
- Agent: 5%
- Driver: 80%

## Quick Setup

1. Install dependencies:
```bash
npm install
