import { type NextRequest } from "next/server"
import { authorizeMutationContext, fail } from "@/lib/server-security"

export async function POST(request: NextRequest) {
  try {
    await authorizeMutationContext(request, "payments.escrow")
  } catch {
    return fail(503, "TRUSTED_VERIFIER_NOT_READY")
  }

  // Quote creation and provider approval are owned by the trusted verifier
  // boundary. The browser may only start the Pi SDK with a server quote.
  return fail(503, "TRUSTED_VERIFIER_NOT_READY")
}
