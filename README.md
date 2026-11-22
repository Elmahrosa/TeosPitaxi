# TEOS PiTaxi — Release Candidate

TEOS PiTaxi is a Next.js release candidate for Pi-native mobility. It is **not launch-approved**, **not Pi Core Team verified**, **not submitted to the Pi Developer Portal**, and **not ready for Mainnet operation**. Payment and mutation routes fail closed until the trusted verifier boundary, dedicated database identities, and owner-supplied policy values are configured and independently verified.

Status summary: **Completed** — implementation, local checks, isolated-database verification, live URL reachability. **Verified** — local and isolated environments only; staging is not verified. **Submitted** — no. **Approved** — no. **Mainnet enabled** — no.

## Current implementation scope

- Separation of browser anon, cookie-aware SSR anon, and server-only Supabase clients.
- Browse-first Pi session state that must be server-persisted before `Pi.authenticate`.
- Migration-defined session rotation, CSRF authorization, rate limiting, route metrics, quotes, verification, approval/completion leases, settlement ledger, and webhook replay handling. The artifact has been exercised only in an isolated local database; no staging or production database has been migrated, and app routes remain fail-closed stubs until the trusted verifier service and policy bootstrap are in place.
- Integer minor-unit settlement with approved split:
  - 10% treasury.
  - 5% to a qualified agent only.
  - 85% driver with a qualified agent; 90% driver without one.
- Frozen `calculateFare(distanceKm, durationMinutes, hasAgent = false)` signature preserved; authoritative pricing remains server-side.
- Automated app-to-user transfers disabled; settlement records are ledger entries only.
- Driver document submission disabled with no reachable success state.

## Repository state

- Branch: `hackathon/pi-mainnet-readiness`.
- Baseline: `b0531815a2db35679ab101f1944c4df6f5f685f1`.
- Frozen migrations `001`–`006` are unchanged.
- `governance/constitution` is uninitialized and must not be modified by this release.
- The consolidated migration artifact is `scripts/011_foundation_corrections_rev2e.sql`. It aborts on drift and is clean-install-only. Final SHA-256: `8E39FED0964F78591C903FFB3818C25D53CDD50992DFEADECEF58705698BD868`.

## Setup overview

Install dependencies with the repository lockfile:

```bash
npm ci
```

Create `.env.local` locally. Never commit it.

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

Dedicated database LOGIN identities required by the migration:

- `teospitaxi_payment_verifier`
- `teospitaxi_route_metrics`
- `teospitaxi_maintenance`

`teospitaxi_payment_writer` is a `NOLOGIN` controlled writer identity with RLS policies and no `BYPASSRLS`. Direct application/service-role DML on controlled payment tables is revoked.

The Next.js app never connects with a verifier database LOGIN. It calls a separate trusted verifier service over `REV2E_VERIFIER_SERVICE_URL` with `REV2E_VERIFIER_SERVICE_TOKEN`; that service holds the dedicated database credentials and is responsible for `session_user` identity. `REV2E_TRUSTED_VERIFIER_CONFIGURED=true` is required before any dependent route will proceed.

Mutation routes call the trusted verifier service at `auth/authorize-mutation` with `{ sessionToken, csrfToken, csrfEpoch, intent }` and require `{ authorized: true, csrfEpoch }` in response. The external verifier service must implement that endpoint and perform the database-backed session/CSRF check.

Owner-supplied policy values are intentionally not seeded: minor-unit scale, evidence references, thresholds, pricing bindings, webhook secrets, origin, trusted IP header, and Pi metadata. Policy-dependent flows fail closed until supplied and verified.

## Database artifact

`scripts/011_foundation_corrections_rev2e.sql` is one contiguous transaction containing:

- Preflight checks for roles, extensions, frozen columns/functions, managed object drift, and unsafe role membership.
- Managed tables, constraints, indexes, triggers, RLS, FORCE RLS, and restricted grants.
- One database-generated CSRF HMAC secret; the secret is never embedded in the artifact or returned to callers.
- Session, CSRF, rate-limit, metrics, quote, verification, approval, completion, settlement, and webhook functions.
- Fail-closed guards and postconditions.

### Isolated verification only

The artifact was applied, tested, rolled back, corrected, reapplied, and recovery-tested **only** in `pitaxi_rev2e_local`, a Docker Postgres 16 database created for this revision. No production, staging, or shared database was used.

- Pre-`011` dump and schema baseline were captured before application.
- Initial application succeeded, but behavioral testing exposed an immediate-FK failure in quote replacement and session rotation. `pi_payment_quotes.replaced_by` and `pi_sessions.successor_id` were changed to `DEFERRABLE INITIALLY DEFERRED`; `ON DELETE RESTRICT`/`SET NULL`, cycle checks, partial unique indexes, append-only guards, and terminal-state checks remain unchanged. A read-only review confirmed no other forward-reference defect and no weakened invariant. Root cause, evidence, and rollback commands are in the ignored `verification-evidence/migration-correction-note.md`.
- Corrected application exited `0`. Independent postconditions exited `0`: 23 managed tables with RLS and FORCE RLS and no app-role grants, 28 allowlisted writer functions with 0 inventory violations, 0 forbidden function grants, 8 lifecycle triggers, 5 frozen policy constraints, exactly 1 active CSRF secret, 16 `ON DELETE RESTRICT` FKs, and 18 unique indexes.
- Behavioral tests passed for immutable amounts, invalid transitions, early expiry, append-only deletion, valid `active → approved → completed`, quote replacement with a distinct active successor, cycle rejection, duplicate intent IDs and quote hashes, one active quote per trip, attribution delete restriction, and session rotation with a distinct active successor. All test rows were rolled back.
- Dedicated LOGIN checks passed as `teospitaxi_maintenance`; a `SET ROLE teospitaxi_payment_writer` spoof from `postgres` was rejected because `session_user` remained `postgres`.
- Reapplying `011` to the already-migrated database failed at drift preflight with exit `3` and left 1 active CSRF secret and 28 active writer functions intact.
- The final `after_011.dump` was restored into a scratch database, passed the full postcondition/behavioral suite, and the scratch database was dropped.

Raw logs, dumps, checksums, and schema snapshots are retained locally under the Git-ignored `verification-evidence/` directory. They are evidence for this working session, not committed release assets.

### Local static checks

Final local results: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm audit --json` all exited `0`; Vitest reported 4 files and 25 tests passed; `npm audit` reported 0 vulnerabilities. The GitHub Actions workflow was updated to Node 22 with audit, typecheck, lint, test, and build steps, but no hosted CI result is claimed here.

## Main API surfaces

- `POST /api/session/browse-evidence` — persists server browse evidence before `Pi.authenticate`.
- `POST /api/session/bootstrap` — verifies Pi identity server-side, issues the HttpOnly session cookie, and returns the CSRF token and epoch.
- `POST /api/session/rotate` — records fresh browse evidence and rotates session/CSRF state.
- `POST /api/session/logout` — revokes the server session and clears the cookie.
- `POST /api/payments/quote` — server-derived quote; requires rider session and CSRF.
- `POST /api/payments/approve` — fail-closed verifier boundary.
- `POST /api/payments/escrow` — fail-closed verifier boundary.
- `POST /api/payments/complete` — fail-closed verifier boundary.
- `POST /api/payments/complete-trip` — fail-closed verifier boundary.
- `POST /api/payments/status` — fail-closed verifier boundary.
- `POST /api/driver/documents` — returns `DRIVER_DOCUMENTS_UNAVAILABLE`.
- Mutation stubs enforce canonical origin, server session cookie, CSRF headers, and verifier-backed authorization before returning a fail-closed response.

## Release gates

A successful implementation, local check, commit, push, or CI run is not proof of launch readiness. Local isolated-database verification is complete; the following gates remain:

1. Staging runtime verification of the migration artifact and fail-closed routes. Local isolated verification does not satisfy this gate.
2. Dedicated LOGIN identity configuration and `session_user` verification in staging, not only in the isolated test database.
3. Owner-supplied policy bootstrap and fail-closed verification in staging.
4. Hosted CI execution with recorded results; the local equivalents have passed but no hosted run is claimed.
5. Pi Developer Portal evidence, including listing, PiNet subdomain, verified domain, PiNet URL, Pi App ID, API key configuration, app metadata, product video, and any KYC requirement.
6. Actual submission confirmation/reference from the Pi Developer Portal, if submission is permitted.
7. Separate Mainnet launch approval and official eligibility confirmation before any automated A2U payout is enabled.

The live URL `https://teos-pitaxi.vercel.app/` was reachable on 2026-11-21 with HTTP `200`, rendered the expected landing page, loaded the Pi SDK, and produced no console errors. That verifies deployment availability only, not Pi verification, KYC, submission, approval, or Mainnet status.

## License

See `NOTICE.md` and `LICENSES/TESL.md`. Governance references are informational; the frozen constitution remains uninitialized.
