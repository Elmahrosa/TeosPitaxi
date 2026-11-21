import { randomBytes } from "node:crypto"
import { type NextRequest, NextResponse } from "next/server"
import {
  assertCanonicalOrigin,
  fail,
  noStore,
  readBoundedJson,
  trustedClientIp,
} from "@/lib/server-security"
import { callVerifier, isUuid } from "@/lib/verifier-boundary"

interface BrowseEvidenceResponse {
  browseEvidenceId: string
  observedAt: string
  expiresAt: string
}

export async function POST(request: NextRequest) {
  try {
    assertCanonicalOrigin(request)
    await readBoundedJson(request)
    trustedClientIp(request)
  } catch (error) {
    return fail(400, "INVALID_REQUEST", error instanceof Error ? error.message : undefined)
  }

  try {
    const browseNonce = randomBytes(32).toString("hex")
    const observedAt = new Date().toISOString()

    const evidence = await callVerifier<BrowseEvidenceResponse>(
      "session/browse-evidence",
      {
        browseNonce,
        observedAt,
        clientIp: trustedClientIp(request),
      },
    )

    if (!isUuid(evidence.browseEvidenceId)) {
      throw new Error("Trusted verifier returned invalid browse evidence")
    }

    return noStore(
      NextResponse.json({
        browseEvidenceId: evidence.browseEvidenceId,
        observedAt: evidence.observedAt,
        expiresAt: evidence.expiresAt,
      }),
    )
  } catch {
    return fail(503, "TRUSTED_VERIFIER_NOT_READY")
  }
}
