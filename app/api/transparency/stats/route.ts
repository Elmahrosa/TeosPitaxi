import { NextResponse } from "next/server"
import { noStore } from "@/lib/server-security"

export async function GET() {
  return noStore(
    NextResponse.json({
      available: false,
      releaseStatus: "release_candidate_pending_verifier_and_verification",
      stats: null,
      distribution: {
        treasuryPercent: 10,
        qualifiedAgentPercent: 5,
        driverWithAgentPercent: 85,
        driverWithoutAgentPercent: 90,
      },
      message: "Public statistics are unavailable until trusted server data is connected and verified.",
    })
  )
}
