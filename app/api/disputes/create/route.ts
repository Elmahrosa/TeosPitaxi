import { type NextRequest } from "next/server"
import { fail, requireMutationContext, requireTrustedVerifierBoundary } from "@/lib/server-security"

export async function POST(request: NextRequest) {
  try {
    await requireMutationContext(request)
    requireTrustedVerifierBoundary()
  } catch (error) {
    return fail(400, "INVALID_REQUEST", error instanceof Error ? error.message : undefined)
  }

  return fail(503, "TRUSTED_VERIFIER_NOT_READY")
}
