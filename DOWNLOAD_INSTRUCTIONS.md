# Download and Run Locally

## Clone

```bash
git clone https://github.com/Elmahrosa/TeosPitaxi.git
cd TeosPitaxi
git checkout hackathon/pi-mainnet-readiness
npm ci
```

Do not use `pnpm install` against the stub `pnpm-lock.yaml`; this repository uses `package-lock.json`.

## Environment

Copy or create `.env.local` locally. Never commit it.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

APP_ORIGIN=
TRUSTED_CLIENT_IP_HEADER=
REV2E_TRUSTED_VERIFIER_CONFIGURED=
REV2E_VERIFIER_SERVICE_URL=
REV2E_VERIFIER_SERVICE_TOKEN=

NEXT_PUBLIC_PI_APP_ID=
PI_API_KEY=
NEXT_PUBLIC_PI_NETWORK=

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
```

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`. Payment and mutation routes will fail closed until the trusted verifier boundary and dedicated database identities are configured.

## Database

Frozen migrations `001`–`006` are unchanged. `scripts/011_foundation_corrections_rev2e.sql` is prepared but not executed. It requires separate approval and owner-supplied policy values. Do not modify frozen migrations or the uninitialized `governance/constitution`.

## Current behavior

- Pi authentication requires browse-first server evidence.
- Fares come from server quotes; the browser cannot set fare, distance, duration, identity, or settlement amounts.
- Driver document submission is unavailable with no success state.
- Public transparency shows no fabricated statistics.
- Automated app-to-user transfers remain disabled.

## Deployment and submission

Do not deploy or submit to Pi Developer until the gates in `GO_LIVE_STEPS.md` and `PI_NETWORK_VERIFICATION.md` are complete and separately approved.
