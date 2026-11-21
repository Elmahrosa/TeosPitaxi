import { type NextRequest } from "next/server"
import { authorizeMutationContext, fail } from "@/lib/server-security"

export async function POST(request: NextRequest) {
  try {
    await authorizeMutationContext(request, "payments.quote")
  } catch {
    return fail(503, "TRUSTED_VERIFIER_NOT_READY")
  }

  return fail(503, "TRUSTED_VERIFIER_NOT_READY")
}
