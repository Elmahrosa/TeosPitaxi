# TeosPiTaxi — Deployment Step Status

This document describes **pending gates**, not a go-live procedure. No deployment or submission is authorized by this repository state.

## 1. Local preparation

```bash
npm ci
```

Create `.env.local` locally with owner-supplied values. Never commit it.

## 2. Database review

Frozen migrations `001`–`006` remain unchanged. Review `scripts/011_foundation_corrections_rev2e.sql`; it is clean-install-only, its preflight aborts on managed-object drift, and it has been executed only in an isolated local Docker Postgres database with backup/rollback and recovery evidence. No staging or production application has occurred; those require separate approval and their own rollback evidence.

## 3. Dedicated identities

Create and verify dedicated LOGIN roles:

- `teospitaxi_payment_verifier`
- `teospitaxi_route_metrics`
- `teospitaxi_maintenance`

Keep `teospitaxi_payment_writer` as `NOLOGIN`, non-superuser, without `BYPASSRLS`, and without `CREATE` on `public`.

## 4. Owner-supplied policy

Supply and verify:

- Minor-unit scale.
- Evidence references and thresholds.
- Pricing bindings.
- Webhook secret and signature template.
- Canonical origin and trusted proxy header.
- Pi App ID, API key, and network selection.
- Developer Portal listing, PiNet subdomain, verified domain, PiNet URL, and redirect URL.
- KYC status, if required, as owner evidence only.

Policy-dependent paths remain fail-closed until this is complete.

## 5. Verification gates

Only after separate approval:

1. Resolve static migration blockers.
2. Run tests and build; record actual results.
3. Apply migration under separate SQL approval.
4. Verify postconditions and rollback evidence.
5. Verify `session_user` guards with dedicated LOGIN identities.
6. Verify no browser authority over identity, fare, distance, duration, metrics, percentages, quote, or settlement.
7. Verify webhook raw-body HMAC verification and replay handling.
8. Verify driver documents remain unavailable.
9. Complete staging review.

## 6. Submission gate

Do not submit to Pi Developer until every item in `PI_NETWORK_VERIFICATION.md` is evidenced. Do not change `components/verification-banner.tsx` to a verified state unless verification is actually confirmed by the owner with evidence.

## 7. Mainnet gate

Mainnet launch requires a separate explicit owner approval after all gates are complete. A commit, push, CI pass, or deployment is not launch approval.
