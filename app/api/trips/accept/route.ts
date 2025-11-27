import { type NextRequest, NextResponse } from "next/server"
import { assignDriver } from "@/lib/trip-service"

export async function POST(req: NextRequest) {
  try {
    const { tripId, driverId } = await req.json()

    if (!tripId || !driverId) {
      return NextResponse.json({ error: "Missing tripId or driverId" }, { status: 400 })
    }

    const trip = await assignDriver(tripId, driverId)

    return NextResponse.json({ trip })
  } catch (error: any) {
    console.error("[v0] Accept trip error:", error)
    return NextResponse.json({ error: error.message || "Failed to accept trip" }, { status: 500 })
  }
}
