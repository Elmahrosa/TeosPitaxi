import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it } from "vitest"
import { POST as approve } from "@/app/api/payments/approve/route"
import { POST as complete } from "@/app/api/payments/complete/route"
import { POST as completeTrip } from "@/app/api/payments/complete-trip/route"
import { POST as escrow } from "@/app/api/payments/escrow/route"
import { POST as quote } from "@/app/api/payments/quote/route"
import { POST as status } from "@/app/api/payments/status/route"
import { POST as resolveDispute } from "@/app/api/disputes/resolve/route"
import { POST as acceptTrip } from "@/app/api/trips/accept/route"
import { GET as qualificationStats } from "@/app/api/user/qualification-stats/route"

const routes = [
  ["payments.approve", approve],
  ["payments.complete", complete],
  ["payments.complete-trip", completeTrip],
  ["payments.escrow", escrow],
  ["payments.quote", quote],
  ["payments.status", status],
  ["disputes.resolve", resolveDispute],
] as const

function request() {
  return new NextRequest("https://teos-pitaxi.vercel.app/api/payments/quote", {
    method: "POST",
    headers: { Origin: "https://teos-pitaxi.vercel.app", "Content-Type": "application/json" },
    body: JSON.stringify({ tripId: "trip-1" }),
  })
}

beforeEach(() => {
  delete process.env.REV2E_TRUSTED_VERIFIER_CONFIGURED
  delete process.env.REV2E_VERIFIER_SERVICE_URL
  delete process.env.REV2E_VERIFIER_SERVICE_TOKEN
})

describe("payment and privileged mutation stubs are fail-closed", () => {
  for (const [name, handler] of routes) {
    it(`${name} never returns success without verifier authorization`, async () => {
      const response = await handler(request())
      expect(response.status).toBe(503)
      const body = (await response.json()) as { error: string }
      expect(body.error).toBe("TRUSTED_VERIFIER_NOT_READY")
      expect(response.headers.get("Cache-Control")).toContain("no-store")
    })
  }

  it("trip acceptance never accepts a browser-supplied driver identity", async () => {
    const response = await acceptTrip(request())
    expect(response.status).not.toBeLessThan(400)
  })

  it("qualification stats stay unavailable instead of trusting a URL-supplied UID", async () => {
    const response = await qualificationStats()
    expect(response.status).toBe(503)
  })
})
