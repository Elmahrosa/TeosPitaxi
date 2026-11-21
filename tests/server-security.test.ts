import { NextRequest, NextResponse } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  assertCanonicalOrigin,
  authorizeMutationContext,
  csrfFromRequest,
  noStore,
  readBoundedJson,
} from "@/lib/server-security"

const ORIGIN = "https://teos-pitaxi.vercel.app"
const VERIFIER_URL = "https://verifier.example.test/api/"

const savedEnv = {
  APP_ORIGIN: process.env.APP_ORIGIN,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  REV2E_TRUSTED_VERIFIER_CONFIGURED: process.env.REV2E_TRUSTED_VERIFIER_CONFIGURED,
  REV2E_VERIFIER_SERVICE_URL: process.env.REV2E_VERIFIER_SERVICE_URL,
  REV2E_VERIFIER_SERVICE_TOKEN: process.env.REV2E_VERIFIER_SERVICE_TOKEN,
}

function makeRequest(overrides: {
  origin?: string | null
  csrf?: string | null
  epoch?: string | null
  cookie?: string | null
  body?: string
  pathname?: string
} = {}) {
  const headers = new Headers({
    Origin: overrides.origin === null ? "" : (overrides.origin ?? ORIGIN),
    "Content-Type": "application/json",
  })
  if (overrides.csrf !== null) headers.set("x-rev2e-csrf", overrides.csrf ?? "csrf-token")
  if (overrides.epoch !== null) headers.set("x-rev2e-csrf-epoch", overrides.epoch ?? "7")
  if (overrides.cookie !== null) headers.set("Cookie", overrides.cookie ?? "rev2e_session=session-token")

  return new NextRequest(`https://teos-pitaxi.vercel.app${overrides.pathname ?? "/api/payments/quote"}`, {
    method: "POST",
    headers,
    body: overrides.body ?? JSON.stringify({ tripId: "trip-1" }),
  })
}

beforeEach(() => {
  process.env.APP_ORIGIN = ORIGIN
  process.env.REV2E_TRUSTED_VERIFIER_CONFIGURED = "true"
  process.env.REV2E_VERIFIER_SERVICE_URL = VERIFIER_URL
  process.env.REV2E_VERIFIER_SERVICE_TOKEN = "test-service-token"
})

afterEach(() => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  vi.unstubAllGlobals()
})

describe("canonical origin and bounded body handling", () => {
  it("accepts the configured origin", () => {
    expect(() => assertCanonicalOrigin(makeRequest())).not.toThrow()
  })

  it("rejects missing, foreign, or unconfigured origins", () => {
    expect(() => assertCanonicalOrigin(makeRequest({ origin: null }))).toThrow()
    expect(() => assertCanonicalOrigin(makeRequest({ origin: "https://evil.example.test" }))).toThrow()

    delete process.env.APP_ORIGIN
    delete process.env.NEXT_PUBLIC_APP_URL
    expect(() => assertCanonicalOrigin(makeRequest())).toThrow()
  })

  it("rejects request bodies larger than the bounded limit", async () => {
    const oversized = "x".repeat(64 * 1024 + 1)
    await expect(readBoundedJson(makeRequest({ body: JSON.stringify({ value: oversized }) }))).rejects.toThrow(
      /too large/,
    )
  })

  it("parses only numeric CSRF epochs", () => {
    expect(csrfFromRequest(makeRequest({ epoch: "7" }))).toEqual({ token: "csrf-token", epoch: 7 })
    expect(csrfFromRequest(makeRequest({ epoch: "not-a-number" })).epoch).toBeNull()
  })

  it("sets no-store and hardening headers", () => {
    const response = noStore(NextResponse.json({ ok: true }))
    expect(response.headers.get("Cache-Control")).toContain("no-store")
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff")
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer")
  })
})

describe("auth/authorize-mutation verifier contract", () => {
  it("sends the exact proof payload and accepts only the documented response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ authorized: true, csrfEpoch: 7 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const result = await authorizeMutationContext(makeRequest(), "payments.quote")

    expect(result).toEqual({
      sessionToken: "session-token",
      csrfToken: "csrf-token",
      csrfEpoch: 7,
      body: { tripId: "trip-1" },
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(String(url)).toBe("https://verifier.example.test/api/auth/authorize-mutation")
    expect(JSON.parse(init.body as string)).toEqual({
      sessionToken: "session-token",
      csrfToken: "csrf-token",
      csrfEpoch: 7,
      intent: "payments.quote",
    })
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-service-token")
  })

  it("fails closed when the verifier denies authorization or returns the wrong epoch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ authorized: false, csrfEpoch: 7 }), { status: 200 }),
      ),
    )
    await expect(authorizeMutationContext(makeRequest(), "payments.approve")).rejects.toThrow()

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ authorized: true, csrfEpoch: 8 }), { status: 200 }),
      ),
    )
    await expect(authorizeMutationContext(makeRequest(), "payments.approve")).rejects.toThrow()
  })

  it("fails closed when the verifier is unavailable or returns malformed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")))
    await expect(authorizeMutationContext(makeRequest(), "payments.complete")).rejects.toThrow()

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })),
    )
    await expect(authorizeMutationContext(makeRequest(), "payments.complete")).rejects.toThrow()
  })

  it("rejects missing session or CSRF proof without contacting the verifier", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    await expect(authorizeMutationContext(makeRequest({ cookie: null }), "payments.quote")).rejects.toThrow()
    await expect(authorizeMutationContext(makeRequest({ csrf: null }), "payments.quote")).rejects.toThrow()
    await expect(authorizeMutationContext(makeRequest({ epoch: null }), "payments.quote")).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("fails closed when the trusted verifier boundary is not configured", async () => {
    process.env.REV2E_TRUSTED_VERIFIER_CONFIGURED = "false"
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    await expect(authorizeMutationContext(makeRequest(), "payments.quote")).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
