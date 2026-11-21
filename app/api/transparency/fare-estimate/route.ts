import { type NextRequest } from "next/server"
import { assertCanonicalOrigin, fail, readBoundedJson, requireTrustedVerifierBoundary } from "@/lib/server-security"

export async function POST(request: NextRequest) {
  try {
    assertCanonicalOrigin(request)
    await readBoundedJson(request)
    requireTrustedVerifierBoundary()
  } catch (error) {
    return fail(400, "INVALID_REQUEST", error instanceof Error ? error.message : undefined)
  }

  return fail(503, "TRUSTED_VERIFIER_NOT_READY")
}
