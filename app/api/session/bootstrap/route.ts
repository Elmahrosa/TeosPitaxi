import { randomBytes } from "node:crypto"
import { type NextRequest, NextResponse } from "next/server"
import {
  assertCanonicalOrigin,
  fail,
  noStore,
  readBoundedJson,
  SESSION_COOKIE,
} from "@/lib/server-security"
import {
  asRecord,
  boundedString,
  callVerifier,
  isSha256Hex,
  isUuid,
  positiveEpoch,
} from "@/lib/verifier-boundary"

const SESSION_TTL_SECONDS = 8 * 60 * 60

interface PiIdentityResponse {
  piUid: string
}

interface SessionResponse {
  sessionId: string
  csrfToken: string
  csrfEpoch: number
  expiresAt: string
  role: string
}

export async function POST(request: NextRequest) {
  let accessToken: string
  let browseEvidenceId: string

  try {
    assertCanonicalOrigin(request)
    const body = asRecord(await readBoundedJson(request))
    if (!body) {
      throw new Error("JSON object body is required")
    }

    const parsedToken = boundedString(body.accessToken, 16, 4096)
    const parsedEvidenceId = isUuid(body.browseEvidenceId) ? body.browseEvidenceId : null
    if (!parsedToken || !parsedEvidenceId) {
      throw new Error("A Pi access token and server browse evidence ID are required")
    }

    accessToken = parsedToken
    browseEvidenceId = parsedEvidenceId
  } catch (error) {
    return fail(400, "INVALID_REQUEST", error instanceof Error ? error.message : undefined)
  }

  try {
    const identity = await callVerifier<PiIdentityResponse>("pi/identity", {
      accessToken,
      browseEvidenceId,
    })
    const piUid = boundedString(identity.piUid, 3, 256)
    if (!piUid) {
      throw new Error("Trusted verifier returned an invalid Pi identity")
    }

    const sessionToken = randomBytes(32).toString("base64url")
    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString()

    const session = await callVerifier<SessionResponse>("session/create", {
      piUid,
      sessionToken,
      expiresAt,
      browseEvidenceId,
    })

    if (
      !isUuid(session.sessionId) ||
      !isSha256Hex(session.csrfToken) ||
      positiveEpoch(session.csrfEpoch) === null ||
      !boundedString(session.role, 3, 32)
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
