# Deployment Configuration — Pending Approval

This repository contains a release candidate. Do **not** deploy, submit to Pi Developer, or operate on Mainnet until the gates in `GO_LIVE_STEPS.md` are complete and separately approved.

## Domain and origin

The canonical origin must be owner-supplied and must match the Pi Developer Portal. The repository does not confirm that any domain is configured, verified, or approved.

Required application variables:

```env
APP_ORIGIN=
NEXT_PUBLIC_APP_URL=
TRUSTED_CLIENT_IP_HEADER=
REV2E_TRUSTED_VERIFIER_CONFIGURED=
REV2E_VERIFIER_SERVICE_URL=
REV2E_VERIFIER_SERVICE_TOKEN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PI_APP_ID=
PI_API_KEY=
NEXT_PUBLIC_PI_NETWORK=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
```

Never commit `.env`, API keys, wallet secrets, or database credentials.

## Database identities

The migration requires dedicated LOGIN roles:

- `teospitaxi_payment_verifier`
- `teospitaxi_route_metrics`
- `teospitaxi_maintenance`

`teospitaxi_payment_writer` is `NOLOGIN` and must remain non-superuser, without `BYPASSRLS`, and without schema `CREATE`.

## Migration gate

`scripts/011_foundation_corrections_rev2e.sql` is prepared but **not executed**. It is clean-install-only and aborts on drift. Frozen migrations `001`–`006` must not be modified. Application requires separate explicit approval and rollback evidence.

## Runtime behavior

- Browser client is anon-only.
- SSR client is cookie-aware anon.
- Service-role client is server-only.
- Payment and mutation routes fail closed pending trusted verifier configuration.
- Driver document submission is unavailable.
- Public transparency statistics are unavailable.
- Automated app-to-user transfers are disabled.

## Verifier boundary

The Next.js app holds no verifier database credential. It calls a separate trusted verifier service configured by `REV2E_VERIFIER_SERVICE_URL` and `REV2E_VERIFIER_SERVICE_TOKEN`. That service is responsible for dedicated LOGIN identities and `session_user` checks; PostgREST, service-role, and pooler identities fail closed. Session bootstrap, rotation, logout, Pi identity verification, route metrics, quotes, and settlement all pass through this boundary.

Use the official Pi server calls from a trusted server/service boundary:

- `/approve` with `Authorization: Key <API key>`.
- `/complete` with `Authorization: Key <API key>` and body `{ "txid": "..." }`.

The browser amount only starts the Pi SDK. It never authorizes settlement.

## Release gates

A successful build, commit, push, or CI run is not proof of launch readiness. Recorded test/build results, migration evidence, dedicated identity verification, policy bootstrap, staging review, Pi Developer evidence, and separate Mainnet approval are all required.
