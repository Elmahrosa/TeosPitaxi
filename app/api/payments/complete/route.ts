import { type NextRequest } from "next/server"
import { authorizeMutationContext, fail } from "@/lib/server-security"

export async function POST(request: NextRequest) {
  try {
    await authorizeMutationContext(request, "payments.complete")
  } catch {
    return fail(503, "TRUSTED_VERIFIER_NOT_READY")
  }

  // Completion, settlement, and ledger posting are owned by the trusted
  // verifier boundary. Client success callbacks never authorize settlement.
  return fail(503, "TRUSTED_VERIFIER_NOT_READY")
}
