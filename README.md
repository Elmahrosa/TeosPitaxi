# 🚖 TeosPitaxi — Pi-Native Mobility dApp
“Part of the TEOS Egypt Blockchain Ecosystem — a unified civil, financial, and smart-city infrastructure powering digital banking, civic governance, DeFi, Pi integration, and national blockchain services.”


TeosPitaxi is a decentralized ride-hailing platform built on the **Pi Network** and powered by the **TEOS ecosystem**. Riders pay in Pi, drivers earn securely, and the platform enforces pricing, rewards, and governance using transparent blockchain rails — no intermediaries, no hidden fees.

This README includes the latest **Cleanup Pack**, ensuring the repository is secure, CI-enabled, and ready for open collaboration.

---

## 🧭 Overview

**Goal:** Create a global, censorship-resistant taxi network where drivers and riders interact directly, using Pi as the native payment layer and TEOS wallets for treasury functions.

**Core Concepts:**

- Pi Network wallet login & payments
- Decentralized ride booking
- Driver verification and ratings
- Escrow-based payment safety
- TEOS Treasury wallet integration

---

## 📦 Included in Cleanup Pack

.github/workflows/ci.yml → Continuous integration with pnpm + Next.js .env.example → Safe environment template (no secrets) .gitignore → Ignores env files, caches, build artifacts package.json.snippet → Scripts + engine requirements for pnpm app/api/rides/create/action.ts → Secure server action (no leaked keys) supabase/sql/rls.sql → Supabase RLS access policies LICENSE (MIT) → License for open-source release CONTRIBUTING.md → PR workflow + requirements README_CHANGELOG.md → Version history

---

## 🛠 Tech Stack

| Layer | Technology |
|------|------------|
| UI Framework | Next.js (App Router) |
| Language | TypeScript |
| Auth & DB | Supabase |
| Blockchain | Pi Network SDK + TEOS Treasury |
| Package manager | pnpm (recommended) |

---

## 📋 Requirements

Install before running:

- **Node.js 18+**
- **pnpm 9.x** (project uses `pnpm-lock.yaml`)

Install pnpm if needed:
🚀 Getting Started
```bash
npm install -g pnpm
# Clone the repository
git clone https://github.com/Elmahrosa/TeosPitaxi.git
cd TeosPitaxi

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local
# Fill values

# Start development server
pnpm dev

# Visit
http://localhost:3000
