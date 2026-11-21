import { fail } from "@/lib/server-security"

export async function POST() {
  return fail(404, "DRIVER_DOCUMENTS_UNAVAILABLE", "Driver document submission is not enabled")
}
