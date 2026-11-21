import { type NextRequest } from "next/server"
import { authorizeMutationContext, fail } from "@/lib/server-security"

export async function POST(request: NextRequest) {
  try {
    await authorizeMutationContext(request, "disputes.resolve")
  } catch {
    return fail(503, "TRUSTED_VERIFIER_NOT_READY")
  }

  // Automated refund transfers are disabled. Resolution must be recorded by
  // the trusted verifier boundary with server-derived identity and amounts.
  return fail(503, "TRUSTED_VERIFIER_NOT_READY")
}
