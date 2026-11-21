import { type NextRequest } from "next/server"
import { fail, requireMutationContext, requireTrustedVerifierBoundary } from "@/lib/server-security"

function verifierNotReady() {
  return fail(503, "TRUSTED_VERIFIER_NOT_READY")
}

export async function GET() {
  try {
    requireTrustedVerifierBoundary()
  } catch {
    return verifierNotReady()
  }
  return verifierNotReady()
}

export async function POST(request: NextRequest) {
  try {
    await requireMutationContext(request)
    requireTrustedVerifierBoundary()
  } catch (error) {
    return fail(400, "INVALID_REQUEST", error instanceof Error ? error.message : undefined)
  }
  return verifierNotReady()
}

export async function PUT(request: NextRequest) {
  try {
    await requireMutationContext(request)
    requireTrustedVerifierBoundary()
  } catch (error) {
    return fail(400, "INVALID_REQUEST", error instanceof Error ? error.message : undefined)
  }
  return verifierNotReady()
}
