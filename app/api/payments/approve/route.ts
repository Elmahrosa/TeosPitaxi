import { type NextRequest } from "next/server"
import { authorizeMutationContext, fail } from "@/lib/server-security"

export async function POST(request: NextRequest) {
  try {
    // Origin, bounded body, session, CSRF proof, epoch and route intent are all
    // verified by the external trusted verifier before any payment work starts.
    await authorizeMutationContext(request, "payments.approve")
  } catch {
    return fail(503, "TRUSTED_VERIFIER_NOT_READY")
  }

  // Pi provider approval is performed only inside the trusted verifier
  // boundary using database LOGIN identity teospitaxi_payment_verifier.
  return fail(503, "TRUSTED_VERIFIER_NOT_READY")
}
