# TeosPiTaxi — Pi Network Verification Evidence Status

This document tracks **pending evidence** for a Pi Developer review. It is **not** a completed submission and does **not** claim Pi Core Team verification, KYC completion, testnet completion, Mainnet readiness, or launch approval.

## Project summary

- Project: TeosPiTaxi
- Repository branch: `hackathon/pi-mainnet-readiness`
- Implementation baseline: `b0531815a2db35679ab101f1944c4df6f5f685f1`
- Intended initial community: Alexandria, Egypt (plan only)
- Platform: Next.js, TypeScript, Supabase/PostgreSQL, Pi SDK v2.0

## Approved payment policy

The approved split is:

- 10% TEOS treasury.
- 5% to a qualified agent only.
- 85% driver with a qualified agent; 90% driver without one.

Amounts are derived by the server in integer minor units. Client input cannot set identity, fare, distance, duration, metrics, percentages, quote, or settlement authority. Automated app-to-user transfers remain disabled.

## Transaction model to verify

1. Browse evidence is server-persisted before `Pi.authenticate`.
2. The trusted server verifies the Pi user and creates a server session with CSRF bootstrap.
3. The rider requests a server quote from authenticated session context.
4. The server derives route metrics and binds them to the trip.
5. The browser starts the Pi SDK with the server amount only.
6. The trusted verifier records `/approve` evidence and issues a completion lease.
7. The trusted verifier calls `/complete` only after provider verification.
8. The settlement ledger records the approved split; no automatic payout is executed.

## Evidence checklist — all pending

- [ ] Migration `011_foundation_corrections_rev2e.sql` reviewed and applied under separate approval.
- [ ] Postflight/rollback evidence captured.
- [ ] Dedicated `teospitaxi_payment_verifier`, `teospitaxi_route_metrics`, and `teospitaxi_maintenance` LOGIN identities configured.
- [ ] `session_user` identity guards verified.
- [ ] Owner-supplied policy rows, thresholds, scale, evidence references, and webhook secrets supplied.
- [ ] Tests and build executed with recorded results.
- [ ] Staging verification completed.
- [ ] Pi Developer Portal listing confirmed.
- [ ] PiNet subdomain confirmed.
- [ ] Verified app domain confirmed.
- [ ] PiNet URL confirmed.
- [ ] Pi App ID confirmed.
- [ ] API key configuration confirmed.
- [ ] `/v2/me` UID field and PaymentDTO variants confirmed against current Pi documentation.
- [ ] App metadata and product video supplied.
- [ ] KYC requirement, if any, confirmed by the owner.
- [ ] Separate Mainnet launch approval recorded.

## Important boundary

This release candidate fails closed until the trusted verifier boundary and dedicated database identities are configured. Do not present this document as proof of verification or readiness.
