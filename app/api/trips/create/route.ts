import { type NextRequest } from "next/server"
import { fail, requireMutationContext } from "@/lib/server-security"

export async function POST(request: NextRequest) {
  try {
    await requireMutationContext(request)
    return fail(501, "TRIP_CREATE_SERVER_DERIVED_REQUIRED", "Trip creation must use server-derived rider identity, route metrics, and quote")
  } catch (error) {
    return fail(400, "INVALID_REQUEST", error instanceof Error ? error.message : undefined)
  }
}
