# Release Candidate Verification Steps — Not Go Live

This document does **not** authorize deployment, Mainnet operation, or Pi Developer submission. It lists gates that must be satisfied and separately approved first.

## Blocked capabilities in this release candidate

- Payment and mutation routes fail closed with trusted-verifier configuration errors.
- Automated app-to-user transfers are disabled.
- Driver document submission is disabled with no success state.
- Public transparency statistics are unavailable until trusted server data is connected.
- Governance, constitution, audit, KYC, testnet, and launch claims are not represented as complete.

## Owner-supplied configuration

1. Configure `APP_ORIGIN` and `TRUSTED_CLIENT_IP_HEADER` behind a trusted proxy.
2. Supply Pi App ID, API key, and explicitly selected Pi network.
3. Confirm Developer Portal listing, PiNet subdomain, verified domain, PiNet URL, and redirect URL.
4. Supply webhook secrets and signature template.
5. Supply minor-unit scale, policy evidence references, thresholds, and pricing bindings.
6. Create dedicated LOGIN roles:
   - `teospitaxi_payment_verifier`
   - `teospitaxi_route_metrics`
   - `teospitaxi_maintenance`
7. Keep `teospitaxi_payment_writer` as `NOLOGIN`, non-superuser, without `BYPASSRLS`, and without `CREATE` on `public`.

## Migration gate

`scripts/011_foundation_corrections_rev2e.sql` is prepared but **not executed**. Its preflight aborts on drift. Any application requires separate explicit approval, owner evidence, and a documented rollback path. Frozen migrations `001`–`006` must not be modified.

## Verification gate

Only after separate approval:

1. Review static migration findings and resolve all blockers.
2. Run tests and build; record actual results.
3. Apply the migration only under separate SQL approval.
4. Verify postconditions and rollback evidence.
5. Verify `session_user` identity guards with dedicated LOGIN identities.
6. Verify fail-closed behavior for quote, approval, completion, settlement, and mutation routes.
7. Verify browser cannot set identity, fare, distance, duration, metrics, percentages, or settlement authority.
8. Verify webhook raw-body HMAC verification and replay handling.
9. Perform staging review.

## Approved split to verify

- Treasury: 10%.
- Qualified agent: 5% only.
- Driver: 85% with a qualified agent; 90% without one.

Settlement amounts are recorded in integer minor units. No payout is executed automatically.

## Submission gate

Do not submit to Pi Developer until evidence for every checklist item in `PI_NETWORK_VERIFICATION.md` exists. A successful commit, push, CI run, or deployment is not proof of launch readiness.

## Final approval gate

Mainnet launch requires a separate explicit owner approval after all evidence is complete. This repository does not grant that approval.
