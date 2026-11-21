import { fail } from "@/lib/server-security"

/**
 * The driver dashboard must never send a Pi UID to identify itself. The
 * trusted verifier derives the user from the server-side session and returns
 * qualification statistics for that verified identity. Until the verifier
 * service is configured, this endpoint stays unavailable.
 */
export async function GET() {
  return fail(503, "TRUSTED_VERIFIER_NOT_READY")
}
