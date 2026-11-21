import { type NextRequest, NextResponse } from "next/server"
import {
  fail,
  noStore,
  requireMutationContext,
  SESSION_COOKIE,
} from "@/lib/server-security"
import { callVerifier } from "@/lib/verifier-boundary"

export async function POST(request: NextRequest) {
  let mutation: Awaited<ReturnType<typeof requireMutationContext>>
  try {
    mutation = await requireMutationContext(request, "session.logout")
  } catch (error) {
    return fail(400, "INVALID_REQUEST", error instanceof Error ? error.message : undefined)
  }

  try {
    await callVerifier<Record<string, never>>("session/revoke", {
      sessionToken: request.cookies.get(SESSION_COOKIE)?.value ?? "",
      csrfToken: mutation.csrfToken,
      csrfEpoch: mutation.csrfEpoch,
    })

    const response = noStore(NextResponse.json({ signedOut: true }))
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
    return response
  } catch {
    return fail(503, "TRUSTED_VERIFIER_NOT_READY")
  }
}
