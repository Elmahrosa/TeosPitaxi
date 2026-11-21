import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { assertCanonicalOrigin, fail, noStore, readBoundedJson } from "@/lib/server-security"
import { TEOSPITAXI_KNOWLEDGE } from "@/lib/teospitaxi-knowledge"

export async function POST(req: NextRequest) {
  try {
    assertCanonicalOrigin(req)
    const body = await readBoundedJson(req)
    const message =
      typeof body === "object" && body !== null && typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message.trim()
        : ""

    if (!message || message.length > 2000) {
      return noStore(NextResponse.json({ error: "A message of 1-2000 characters is required" }, { status: 400 }))
    }

    try {
      const { text } = await generateText({
        model: "google/gemini-2.5-flash",
        system: `You are the TEOSPITAXI assistant for a release candidate that is not yet launch-approved.

${TEOSPITAXI_KNOWLEDGE}

STRICT RULES:
- Do not claim Pi Core Team verification, KYC completion, mainnet launch, completed testnet testing, or production readiness.
- Do not claim driver document submission is available. It is disabled.
- Do not claim automated A2U transfers are executed. Settlement is recorded in a server ledger only.
- Approved split: 10% treasury; 5% only to a qualified agent; driver receives 85% with a qualified agent or 90% without one.
- The browser never sets identity, fare, distance, duration, quote, or settlement authority.
- If asked about launch status, say the release is pending trusted verifier configuration, verification evidence, and separate approval.
- Do not invent statistics, wallet balances, referral earnings, or transaction counts.
- Answer from the knowledge base; if it does not say, say it is not yet available.`,
        prompt: message,
      })

      return noStore(NextResponse.json({ response: text }))
    } catch (aiError) {
      console.error("[AI Error]", aiError)
      return noStore(NextResponse.json({ response: getBasicAnswer(message) }))
    }
  } catch (error) {
    console.error("[Chat API Error]", error)
    return fail(400, "INVALID_REQUEST")
  }
}

function getBasicAnswer(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes("status") || lower.includes("launch") || lower.includes("verified") || lower.includes("ready")) {
    return `This is a release candidate, not a launched or Pi-verified product.

Still pending:
- trusted payment verifier configuration and dedicated database LOGIN identities;
- completed migration and verification evidence;
- Pi Developer Portal listing and Pi Core Team verification;
- separate owner approval for tests, deployment, and mainnet launch.

The development banner remains visible until verification is actually confirmed.`
  }

  if (lower.includes("book") || lower.includes("ride") || lower.includes("trip")) {
    return `The intended booking flow is:
1. Open the app from the Pi Browser ecosystem.
2. Sign in only after the server records browse-first evidence.
3. Select pickup and destination from the map so the server can derive route metrics.
4. Request a server-issued quote.
5. Start the Pi SDK payment with that exact quoted amount.
6. Server verification records approval, completion, and settlement.

The current release candidate fails closed until the trusted verifier boundary is configured.`
  }

  if (lower.includes("price") || lower.includes("fare") || lower.includes("cost") || lower.includes("split")) {
    return `Fares are derived server-side from active pricing policy and trusted route metrics; the browser does not submit distance, duration, fare, or agent selection.

Approved split:
- 10% TEOS Treasury;
- 5% only to a qualified agent;
- 85% driver with a qualified agent, or 90% driver without one.

Integer minor units are authoritative. Display values are numeric Pi only. No automatic payout is executed.`
  }

  if (lower.includes("driver") || lower.includes("document") || lower.includes("earn")) {
    return `Driver document submission is currently unavailable and has no successful completion state.

Driver earnings are not fabricated in this release candidate. A verified settlement share is recorded only after server-side verification, and automated transfers remain disabled.`
  }

  if (lower.includes("agent") || lower.includes("refer") || lower.includes("commission")) {
    return `Agent qualification is derived server-side from the approved policy and frozen 006 counting semantics. A 5% commission applies only to a qualified agent; otherwise the driver receives 90% and the agent receives 0%.

No referral totals, tiers, or earnings are shown until they come from verified server data.`
  }

  if (lower.includes("pi") || lower.includes("wallet") || lower.includes("payment")) {
    return `TeosPiTaxi uses Pi payments only. Pi authentication, metrics, verification, and settlement must pass through a trusted server boundary. The browser amount only starts the Pi SDK; it never authorizes settlement.

Automated A2U transfers are disabled.`
  }

  return `I can explain the release status, booking flow, server-derived pricing, approved fee split, driver documents, agent qualification, and Pi payment boundary.

This release candidate is not launch-approved and fails closed until the trusted verifier boundary is configured.`
}
