import { type NextRequest } from "next/server"
import { fail, requireMutationContext } from "@/lib/server-security"

export async function POST(request: NextRequest) {
  try {
    await requireMutationContext(request)
    return fail(501, "RIDE_CREATE_MOVED", "Use the server-derived trip creation endpoint")
  } catch (error) {
    return fail(400, "INVALID_REQUEST", error instanceof Error ? error.message : undefined)
  }
}
