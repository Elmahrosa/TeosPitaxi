export const TEOSPITAXI_KNOWLEDGE = `
# TEOSPITAXI — release-candidate knowledge base

## Product status
- TeosPiTaxi is a Pi-native mobility release candidate developed in the Elmahrosa community.
- It is NOT Pi Core Team verified, NOT launch-approved, and NOT ready for Mainnet operation.
- The development banner remains visible until verification is actually confirmed.
- Automated A2U transfers are disabled. Settlement is recorded in a server ledger; no Pi payout API is called.
- Driver document submission is disabled and has no successful completion state.

## Services
- Taxi rides and bike delivery flows are represented in the interface.
- Vehicles represented in policy must be 2020 or newer.
- Coverage planning starts in Alexandria, Egypt, with other Egyptian cities as future expansion targets.
- Agent qualification and commission are derived server-side; the client never selects an agent for payment.

## Intended booking flow (server-authoritative)
1. Open the app from the Pi Browser ecosystem. Browser detection is advisory only; the server records browse-first evidence before Pi.authenticate.
2. Sign in with Pi through the trusted server boundary. The server, not the browser, determines identity.
3. Select pickup and destination from map-backed autocomplete. The browser does not submit distance, duration, fare, quote, or settlement authority.
4. The server derives route metrics from an approved provider and binds them to a trip.
5. The server creates a quote from active, non-promotional pricing policy. Integer minor units are authoritative; numeric display scale is 0-6 only.
6. The browser may use the quoted amount only to start the Pi SDK payment.
7. Provider verification, approval lease, completion lease, completion verification, settlement ledger, and audit events are server-owned.
8. A client success callback never proves settlement.

## Approved fee split
- Treasury: 10%.
- Qualified agent: 5% only when the approved qualification policy is satisfied.
- Driver: 85% with a qualified agent; 90% without one.
- No broad dynamic uniqueness cleanup, no silent production repair, and no client-configurable percentages.

## Agent qualification
- Frozen migration 006 counting semantics are preserved: 50 completed driver trips, 10 distinct referrals, and 100 completed referred-user trips.
- Automatic no-argument promotion is disabled under revision 2e and fails closed.
- Qualification must be evaluated through the approved policy path with valid policy evidence.
- Do not display fabricated referral counts, tiers, or earnings.

## Pi payment boundary
- Pi authentication, route metrics, verification, and settlement use a trusted server/service boundary.
- Payment verifier identity is bound to dedicated database LOGIN roles checked through session_user. Shared PostgREST or pool identities fail closed.
- Webhook signatures are verified against the raw body in the trusted verifier boundary.
- Replay protection uses payload identity and provider event ID.
- Browser amount starts the Pi SDK only; it is not settlement authority.

## Driver registration
- Driver document submission is currently unavailable. Do not tell users to upload license, registration, insurance, or ID through the app.
- Do not claim background checks, insurance coverage, emergency services integration, in-app calling, or real-time GPS tracking as active features.
- Driver earnings appear only after verified server settlement, and automated payout is disabled.

## Transparency
- Public transparency shows only server-verified data when connected.
- Do not claim all records are public, permanent, immutable, or verifiable on the Pi blockchain.
- Settlement ledger records are append-only in the application database under revision 2e; Pi transaction records remain subject to Pi Network.
- Do not invent totals, balances, transaction counts, audit reports, or governance votes.

## Pricing
- Active, non-promotional pricing policy is required for a quote.
- Promotional pricing cannot be used for a settlement quote under revision 2e.
- Pricing configuration and qualification policy must be uniquely active and have approval evidence.
- Fare display is numeric Pi only; no hardcoded USD conversion is authoritative.

## FAQ guidance
Q: Is the app verified or live?
A: No. It is a release candidate pending trusted verifier configuration, verification evidence, and owner approval.

Q: How much does the driver receive?
A: 85% with a qualified agent, or 90% without one. The treasury receives 10%; a qualified agent receives 5%.

Q: Can I upload driver documents?
A: No. Document submission is disabled in this release candidate.

Q: Are payouts automatic?
A: No. Automated A2U transfers are disabled; settlement is recorded only.

Q: Can the browser choose the fare or agent?
A: No. Those values are derived server-side and are not client-configurable.

Q: Does a Pi SDK success callback prove payment settlement?
A: No. Only trusted server verification and the settlement ledger do.

Q: Are there public platform statistics?
A: Only verified server data when connected. No fabricated or placeholder statistics may be presented.
`
