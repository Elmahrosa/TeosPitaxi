import { type NextRequest, NextResponse } from "next/server"
import { updateTripStatus } from "@/lib/trip-service"

export async function POST(req: NextRequest) {
  try {
    const { tripId, status } = await req.json()

    if (!tripId || !status) {
      return NextResponse.json({ error: "Missing tripId or status" }, { status: 400 })
    }

    const trip = await updateTripStatus(tripId, status)

    return NextResponse.json({ trip })
  } catch (error: any) {
    console.error("[v0] Update trip status error:", error)
    return NextResponse.json({ error: error.message || "Failed to update trip status" }, { status: 500 })
  }
}
