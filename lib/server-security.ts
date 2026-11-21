import "server-only"

import { NextRequest, NextResponse } from "next/server"

export const SESSION_COOKIE = "rev2e_session"
export const CSRF_HEADER = "x-rev2e-csrf"
export const CSRF_EPOCH_HEADER = "x-rev2e-csrf-epoch"

const MAX_BODY_BYTES = 64 * 1024

export function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "no-referrer")
  return response
}

export function fail(status: number, code: string, message?: string): NextResponse {
  return noStore(NextResponse.json({ error: code, message: message ?? code }, { status }))
}

export function assertCanonicalOrigin(request: NextRequest): void {
  const expected = process.env.APP_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL
  if (!expected) {
    throw new Error("APP_ORIGIN is not configured")
  }

  const origin = request.headers.get("origin")
  if (!origin) {
    throw new Error("Missing Origin header")
  }

  let expectedOrigin: string
  try {
    expectedOrigin = new URL(expected).origin
  } catch {
    throw new Error("APP_ORIGIN is invalid")
  }

  if (origin !== expectedOrigin) {
    throw new Error("Origin is not allowed")
  }
}

export async function readBoundedJson(request: NextRequest): Promise<unknown> {
  const declared = request.headers.get("content-length")
  if (declared && Number(declared) > MAX_BODY_BYTES) {
    throw new Error("Request body is too large")
  }

  const raw = await request.text()
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    throw new Error("Request body is too large")
  }

  if (!raw) {
    throw new Error("Request body is required")
  }

  return JSON.parse(raw)
}

export function sessionTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE)?.value ?? null
}

export function csrfFromRequest(request: NextRequest): { token: string | null; epoch: number | null } {
  const token = request.headers.get(CSRF_HEADER)
  const rawEpoch = request.headers.get(CSRF_EPOCH_HEADER)
  const epoch = rawEpoch !== null && /^\d+$/.test(rawEpoch) ? Number(rawEpoch) : null
  return { token, epoch }
}

export function trustedClientIp(request: NextRequest): string {
  const configuredHeader =
    process.env.TRUSTED_CLIENT_IP_HEADER ?? process.env.TRUSTED_IP_HEADER
  if (!configuredHeader) {
    throw new Error("TRUSTED_CLIENT_IP_HEADER is not configured")
  }
  const value = request.headers.get(configuredHeader)
  if (!value) {
    throw new Error("Trusted client IP header is missing")
  }
  return value.split(",")[0]?.trim() ?? ""
}

export function requireTrustedVerifierBoundary(): void {
  if (process.env.REV2E_TRUSTED_VERIFIER_CONFIGURED !== "true") {
    throw new Error("Trusted payment verifier boundary is not configured")
  }
}

const MUTATION_AUTHORIZATION_TIMEOUT_MS = 8000

interface MutationAuthorizationResult {
  authorized?: unknown
  csrfEpoch?: unknown
}

/**
 * Asks the trusted verifier service to check the session, CSRF proof, origin,
 * and route intent. The Next.js process never evaluates CSRF authority locally.
 */
async function authorizeMutationWithVerifier(input: {
  sessionToken: string
  csrfToken: string
  csrfEpoch: number
  intent: string
}): Promise<void> {
  requireTrustedVerifierBoundary()

  const rawUrl = process.env.REV2E_VERIFIER_SERVICE_URL
  const token = process.env.REV2E_VERIFIER_SERVICE_TOKEN
  if (!rawUrl || !token) {
    throw new Error("Trusted verifier service is not configured")
  }

  let target: URL
  try {
    target = new URL("auth/authorize-mutation", rawUrl)
  } catch {
    throw new Error("REV2E_VERIFIER_SERVICE_URL is invalid")
  }

  if (target.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error("Trusted verifier service must use HTTPS in production")
  }

  const response = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(input),
    cache: "no-store",
    signal: AbortSignal.timeout(MUTATION_AUTHORIZATION_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error("Trusted verifier denied mutation authorization")
  }

  const raw = await response.text()
  if (!raw) {
    throw new Error("Trusted verifier returned an empty authorization response")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("Trusted verifier returned invalid authorization JSON")
  }

  const result = parsed as MutationAuthorizationResult | null
  if (
    result?.authorized !== true ||
    result.csrfEpoch !== input.csrfEpoch
  ) {
    throw new Error("Trusted verifier did not confirm mutation authorization")
  }
}

export async function authorizeMutationContext(
  request: NextRequest,
  intent?: string,
): Promise<{
  sessionToken: string
  csrfToken: string
  csrfEpoch: number
  body: unknown
}> {
  assertCanonicalOrigin(request)
  const body = await readBoundedJson(request)
  const sessionToken = sessionTokenFromRequest(request)
  const csrf = csrfFromRequest(request)

  if (!sessionToken || !csrf.token || csrf.epoch === null) {
    throw new Error("Session token and CSRF credentials are required")
  }

  const mutationIntent = intent ?? `${request.method} ${new URL(request.url).pathname}`
  await authorizeMutationWithVerifier({
    sessionToken,
    csrfToken: csrf.token,
    csrfEpoch: csrf.epoch,
    intent: mutationIntent,
  })

  return { sessionToken, csrfToken: csrf.token, csrfEpoch: csrf.epoch, body }
}

/** @deprecated Use authorizeMutationContext for new call sites. */
export const requireMutationContext = authorizeMutationContext
