import { type NextRequest } from "next/server"
import { fail, requireMutationContext } from "@/lib/server-security"

export async function POST(request: NextRequest) {
  try {
    await requireMutationContext(request)
    return fail(501, "ACTION_NOT_IMPLEMENTED", "No privileged action is exposed through this endpoint")
  } catch (error) {
    return fail(400, "INVALID_REQUEST", error instanceof Error ? error.message : undefined)
  }
}
