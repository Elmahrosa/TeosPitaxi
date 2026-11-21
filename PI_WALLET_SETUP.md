# Pi Wallet and Developer Configuration — Pending Owner Setup

This guide describes configuration that remains the owner's responsibility. It does **not** confirm that any wallet, KYC status, app URL, PiNet subdomain, API key, or Developer Portal setting is already configured.

## Required owner-supplied values

- `NEXT_PUBLIC_PI_APP_ID` — Pi App ID.
- `PI_API_KEY` — server-only Pi API key.
- `NEXT_PUBLIC_PI_NETWORK` — explicitly selected network.
- `APP_ORIGIN` — canonical application origin.
- `TRUSTED_CLIENT_IP_HEADER` — header used only behind a trusted proxy.
- `REV2E_TRUSTED_VERIFIER_CONFIGURED`, `REV2E_VERIFIER_SERVICE_URL`, and `REV2E_VERIFIER_SERVICE_TOKEN` — trusted verifier boundary configuration; the token is server-only.
- `TEOS_TREASURY_WALLET` — owner-designated treasury destination, if applicable.
- Webhook secret and signature template.
- Route provider, evidence references, thresholds, and pricing bindings.

Never commit secrets or `.env` files.

## Developer Portal items to confirm

- Ecosystem listing.
- PiNet subdomain.
- Verified app domain.
- PiNet URL.
- Pi App ID.
- API key configuration.
- App metadata and demo video.
- Redirect URL matching the configured canonical origin.
- Any KYC requirement for the owner account.

None of these items is represented as complete in this repository.

## Server payment boundary

Official Pi server calls used by this release candidate:

- `/approve`: `Authorization: Key <API key>`.
- `/complete`: `Authorization: Key <API key>` and body `{ "txid": "..." }`.
- SDK callbacks: `onReadyForServerApproval`, `onReadyForServerCompletion`, `onCancel`, `onError`.

The browser amount only starts the Pi SDK. It does not authorize settlement. Provider verification, approval leases, completion leases, and settlement ledger entries are server-owned.

## Payment policy

- 10% treasury.
- 5% only to a qualified agent.
- 85% driver with a qualified agent; 90% without one.
- Integer minor units are authoritative; display scale is bounded to 0–6.
- No fiat display is authoritative.
- Automated `createTransfer`/app-to-user transfers are disabled.

## Network handling

`NEXT_PUBLIC_PI_NETWORK` selects SDK sandbox behavior. It is not evidence that testnet testing, Mainnet readiness, or launch approval exists. Test and deployment evidence must be recorded separately after explicit approval.
