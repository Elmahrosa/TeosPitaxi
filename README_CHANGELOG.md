# Changelog — TeosPiTaxi

## Unreleased — revision 2e release candidate

Status: implementation and local/isolated verification are complete. Staging verification, Pi Developer Portal submission, approval, and Mainnet enablement have **not** occurred. Payment and mutation routes remain fail-closed outside the verified local harness.

### Security and payment foundation

- Added consolidated clean-install migration artifact `scripts/011_foundation_corrections_rev2e.sql`, final SHA-256 `8E39FED0964F78591C903FFB3818C25D53CDD50992DFEADECEF58705698BD868`.
- Added dedicated role model, RLS/FORCE RLS, restricted writer functions, CSRF HMAC secret generation, session rotation, route metrics, quotes, verification, approval/completion leases, settlement ledger, and webhook replay handling.
- Preserved frozen migrations `001`–`006` and frozen `calculateFare` signature.
- Corrected clean-install preflight so the intentionally replaced legacy `promote_qualified_agents()` is handled by the backup/replacement block instead of aborting the migration.
- Enforced approved integer-minor-unit split: 10% treasury, 5% qualified agent only, 85%/90% driver.
- Disabled automated app-to-user transfers; `lib/pi-transfers.ts` fails closed pending official Mainnet eligibility and documented transfer fields.
- Corrected the two deferred self-referencing FKs (`pi_payment_quotes.replaced_by`, `pi_sessions.successor_id`) required by the retire-before-insert ordering. `ON DELETE` actions, cycle checks, partial unique indexes, append-only guards, and terminal-state checks are unchanged. A separate read-only review found no other forward-reference defect and no weakened invariant.

### Application boundaries

- Separated browser anon, SSR anon, and server-only Supabase clients.
- Added origin, bounded JSON, no-store, cookie/CSRF, and trusted-boundary helpers.
- Mutation authorization now calls the trusted verifier service at `auth/authorize-mutation`; no CSRF authority is trusted from the browser alone.
- Added server-persisted browse evidence, Pi identity bootstrap, HttpOnly session cookie, CSRF session state, and session rotation/logout endpoints. Rotation and logout forward CSRF proof to the verifier.
- Made Pi Browser user-agent detection advisory only; server browse evidence is authoritative.
- Payment and mutation routes fail closed pending verifier configuration.
- Removed browser-supplied Pi UID authority from the driver flow; added a server-derived qualification-stats endpoint.
- Driver document submission disabled with no success state; driver upload CTA and modal removed.
- Public transparency, admin, agent, rider, and driver surfaces no longer present fabricated statistics, ETAs, USD conversions, instant-payout claims, or false verification claims.
- Hardened legacy API client mutation helpers with same-origin credentials and CSRF headers; chat requires canonical origin and bounded JSON.
- Updated Next 16 compatibility: async `cookies()`, no removed `next lint` script, and no module-scope browser client singleton.

### Documentation

- Corrected KYC, testnet, launch, verification, blockchain-audit, escrow, and fee-split claims across UI and deployment documents.
- Added explicit release gates in `GO_LIVE_STEPS.md` and `PI_NETWORK_VERIFICATION.md`.
- Updated `README.md` and this changelog with exact local and isolated-database evidence, including the corrected migration checksum and fail-closed status.

### CI

- Rewrote `.github/workflows/ci.yml` to use `actions/checkout@v4`, Node 22, `npm ci`, audit, typecheck, lint, test, and build. The removed `next lint` step is not reinstated by setup snippets.
- Local equivalents passed; no hosted CI result is claimed.

### Verification evidence (local and isolated only)

All raw logs, dumps, checksums, schema snapshots, and correction notes are retained locally under the Git-ignored `verification-evidence/` directory.

- `011` was applied only to `pitaxi_rev2e_local`, an isolated Docker Postgres 16 database created for this revision. No production, staging, or shared database was used.
- Pre-`011` backup and schema baseline were captured. The first application succeeded but behavioral testing exposed the immediate-FK defect; the database was restored from backup, the artifact was corrected, and the corrected artifact was reapplied with exit `0`.
- Independent postconditions exited `0`: 23 managed tables with RLS/FORCE RLS and no app-role grants, 28 allowlisted writer functions with 0 inventory violations, 0 forbidden function grants, 8 lifecycle triggers, 5 frozen policy constraints, exactly 1 active CSRF secret, 16 `ON DELETE RESTRICT` FKs, and 18 unique indexes.
- Behavioral tests passed for immutable amounts, invalid transitions, early expiry, append-only deletion, valid `active → approved → completed`, quote replacement with a distinct active successor, cycle rejection, duplicate intent IDs and quote hashes, one active quote per trip, attribution delete restriction, and session rotation with a distinct active successor. All test rows were rolled back.
- Dedicated LOGIN checks passed as `teospitaxi_maintenance`; a `SET ROLE teospitaxi_payment_writer` spoof from `postgres` was rejected.
- Reapplying `011` to the already-migrated database failed at drift preflight with exit `3` and left the applied state intact.
- The final `after_011.dump` was restored into a scratch database, passed the full postcondition/behavioral suite, and the scratch database was dropped.
- Final local checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm audit --json` all exited `0`; Vitest reported 4 files and 25 tests passed; `npm audit` reported 0 vulnerabilities.
- Demo URL `https://teos-pitaxi.vercel.app/` was reachable with HTTP `200`, rendered the expected landing page, loaded the Pi SDK, and produced no console errors. This verifies deployment availability only.

### Still not verified or submitted

- No staging or production database has been migrated or observed.
- No Pi Developer Portal listing, domain/PiNet verification, API configuration, KYC confirmation, demo-video review, submission, approval, or Mainnet enablement has been claimed.
- `REV2E_TRUSTED_VERIFIER_CONFIGURED=true`, owner-supplied policy values, and the external `auth/authorize-mutation` verifier are still required before dependent routes can proceed.
- Automated A2U payouts remain disabled and driver document submission remains unavailable.
