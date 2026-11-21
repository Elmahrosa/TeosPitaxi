import { fail, requireTrustedVerifierBoundary } from "@/lib/server-security"

export async function GET() {
  try {
    requireTrustedVerifierBoundary()
  } catch {
    return fail(503, "TRUSTED_VERIFIER_NOT_READY")
  }
  return fail(503, "TRUSTED_VERIFIER_NOT_READY")
}
