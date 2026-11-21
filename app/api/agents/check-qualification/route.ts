import { type NextRequest } from "next/server"
import { fail, requireMutationContext } from "@/lib/server-security"

export async function POST(request: NextRequest) {
  try {
    await requireMutationContext(request)
    return fail(501, "QUALIFICATION_CHECK_SERVER_ONLY", "Qualification is derived server-side from the verified session")
  } catch (error) {
    return fail(400, "INVALID_REQUEST", error instanceof Error ? error.message : undefined)
  }
}
