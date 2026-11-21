import "server-only"

import { requireTrustedVerifierBoundary } from "@/lib/server-security"

const VERIFIER_TIMEOUT_MS = 8000

interface VerifierConfig {
  baseUrl: URL
  token: string
}

/**
 * Server-only client for the trusted verifier boundary. The remote boundary is
 * the only component that holds dedicated database LOGIN credentials; shared
 * PostgREST, service-role, or pooler identities are not accepted there.
 */
function verifierConfig(): VerifierConfig {
  requireTrustedVerifierBoundary()

  const rawUrl = process.env.REV2E_VERIFIER_SERVICE_URL
  const token = process.env.REV2E_VERIFIER_SERVICE_TOKEN

  if (!rawUrl || !token) {
    throw new Error("Trusted verifier service is not configured")
  }

  let baseUrl: URL
  try {
    baseUrl = new URL(rawUrl)
  } catch {
    throw new Error("REV2E_VERIFIER_SERVICE_URL is invalid")
  }

  if (baseUrl.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error("Trusted verifier service must use HTTPS in production")
  }

  return { baseUrl, token }
}

export async function callVerifier<T>(
  path: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const { baseUrl, token } = verifierConfig()
  const target = new URL(path.replace(/^\/+/, ""), baseUrl)

  const response = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(VERIFIER_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Trusted verifier rejected the request (${response.status})`)
  }

  const raw = await response.text()
  if (!raw) {
    throw new Error("Trusted verifier returned an empty response")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("Trusted verifier returned invalid JSON")
  }

  return parsed as T
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function boundedString(
  value: unknown,
  minLength: number,
  maxLength: number,
): string | null {
  return typeof value === "string" &&
    value.length >= minLength &&
    value.length <= maxLength
    ? value
    : null
}

export function positiveEpoch(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
}

export function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value)
}
