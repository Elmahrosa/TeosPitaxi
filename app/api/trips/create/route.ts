import { type NextRequest, NextResponse } from "next/server"
import { createTrip } from "@/lib/trip-service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      riderId,
      pickupLocation,
      dropoffLocation,
      pickupAddress,
      dropoffAddress,
      serviceType,
      distanceKm,
      durationMinutes,
      agentId,
    } = body

    // Validate required fields
    if (!riderId || !pickupLocation || !dropoffLocation || !distanceKm || !serviceType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const trip = await createTrip({
      riderId,
      pickupLocation,
      dropoffLocation,
      pickupAddress,
      dropoffAddress,
      serviceType,
      distanceKm,
      durationMinutes: durationMinutes || 15,
      agentId,
    })

    return NextResponse.json({ trip })
  } catch (error: any) {
    console.error("[v0] Create trip error:", error)
    return NextResponse.json({ error: error.message || "Failed to create trip" }, { status: 500 })
  }
}
