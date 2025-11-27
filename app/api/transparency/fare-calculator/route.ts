import { type NextRequest, NextResponse } from "next/server"
import { calculateFare, DEFAULT_FARE_CONFIG, getCurrentSurgeMultiplier } from "@/lib/fare-calculator"
import { getServiceSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { distanceKm, durationMinutes, hasAgent } = await req.json()

    if (!distanceKm) {
      return NextResponse.json({ error: "Missing distanceKm" }, { status: 400 })
    }

    const db = getServiceSupabase()

    // Get current active riders and available drivers for surge calculation
    const { count: activeRiders } = await db
      .from("trips")
      .select("*", { count: "exact", head: true })
      .in("status", ["requested", "accepted", "driver_arriving", "in_progress"])

    const { count: availableDrivers } = await db
      .from("driver_profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_online", true)
      .eq("is_available", true)

    // Calculate surge multiplier
    const surgeMultiplier = getCurrentSurgeMultiplier(activeRiders || 0, availableDrivers || 0)

    // Calculate fare with surge
    const fare = calculateFare(distanceKm, durationMinutes || 15, hasAgent || false, {
      ...DEFAULT_FARE_CONFIG,
      surgeMultiplier,
    })

    return NextResponse.json({
      fare,
      config: DEFAULT_FARE_CONFIG,
      marketConditions: {
        activeRiders: activeRiders || 0,
        availableDrivers: availableDrivers || 0,
        surgeMultiplier,
      },
    })
  } catch (error: any) {
    console.error("[v0] Fare calculator error:", error)
    return NextResponse.json({ error: error.message || "Failed to calculate fare" }, { status: 500 })
  }
}
