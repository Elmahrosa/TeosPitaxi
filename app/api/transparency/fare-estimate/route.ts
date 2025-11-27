import { calculateFare, DEFAULT_FARE_CONFIG } from "@/lib/fare-calculator"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { distanceKm, durationMinutes, hasAgent = false } = body

    // Validate inputs
    if (typeof distanceKm !== "number" || distanceKm <= 0) {
      return Response.json({ success: false, error: "Invalid distance" }, { status: 400 })
    }

    if (typeof durationMinutes !== "number" || durationMinutes <= 0) {
      return Response.json({ success: false, error: "Invalid duration" }, { status: 400 })
    }

    const fareEstimate = calculateFare(distanceKm, durationMinutes, hasAgent, DEFAULT_FARE_CONFIG)

    return Response.json({
      success: true,
      estimate: fareEstimate,
      config: DEFAULT_FARE_CONFIG,
    })
  } catch (error) {
    console.error("[TeosPiTaxi] Fare estimation error:", error)
    return Response.json({ success: false, error: "Failed to calculate fare" }, { status: 500 })
  }
}
