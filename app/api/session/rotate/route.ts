import { randomBytes } from "node:crypto"
import { type NextRequest, NextResponse } from "next/server"
import {
  fail,
  noStore,
  requireMutationContext,
  SESSION_COOKIE,
  trustedClientIp,
} from "@/lib/server-security"
import {
  callVerifier,
  isSha256Hex,
  isUuid,
  positiveEpoch,
} from "@/lib/verifier-boundary"

const SESSION_TTL_SECONDS = 8 * 60 * 60

interface BrowseEvidenceResponse {
  browseEvidenceId: string
  observedAt: string
  expiresAt: string
}

interface SessionResponse {
  sessionId: string
  csrfToken: string
  csrfEpoch: number
  expiresAt: string
  role: string
}

export async function POST(request: NextRequest) {
  let mutation: Awaited<ReturnType<typeof requireMutationContext>>
  try {
    mutation = await requireMutationContext(request, "session.rotate")
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

    const sessionToken = randomBytes(32).toString("base64url")
    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString()
    const session = await callVerifier<SessionResponse>("session/rotate", {
      currentSessionToken: request.cookies.get(SESSION_COOKIE)?.value ?? "",
      replacementSessionToken: sessionToken,
      expiresAt,
      browseEvidenceId: evidence.browseEvidenceId,
      csrfToken: mutation.csrfToken,
      csrfEpoch: mutation.csrfEpoch,
    })

    if (
      !isUuid(session.sessionId) ||
      !isSha256Hex(session.csrfToken) ||
      positiveEpoch(session.csrfEpoch) === null ||
      !session.expiresAt
    ) {
      throw new Error("Trusted verifier returned an invalid session")
    }

    const response = noStore(
      NextResponse.json({
        csrfToken: session.csrfToken,
        csrfEpoch: session.csrfEpoch,
        expiresAt: session.expiresAt,
        role: session.role,
      }),
    )

    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    })

    return response
  } catch {
    return fail(503, "TRUSTED_VERIFIER_NOT_READY")
  }
}
