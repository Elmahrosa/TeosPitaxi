import { type NextRequest } from "next/server"
import { fail, requireMutationContext } from "@/lib/server-security"

export async function POST(request: NextRequest) {
  try {
    await requireMutationContext(request)
    return fail(501, "TRIP_TRANSITION_SERVER_IDENTITY_REQUIRED", "Transition authority must be derived from the verified session")
  } catch (error) {
    return fail(400, "INVALID_REQUEST", error instanceof Error ? error.message : undefined)
  }
}
