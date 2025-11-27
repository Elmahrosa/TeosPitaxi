import { createServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get("driverId")

    if (!driverId) {
      return Response.json({ success: false, error: "Driver ID required" }, { status: 400 })
    }

    // Fetch driver stats
    const { data: driver, error: driverError } = await supabase
      .from("users")
      .select("*, driver_profiles(*)")
      .eq("id", driverId)
      .single()

    if (driverError) throw driverError

    const { data: trips, error: tripsError } = await supabase
      .from("trips")
      .select("*")
      .eq("driver_id", driverId)
      .eq("status", "completed")

    if (tripsError) throw tripsError

    // Calculate badges
    const badges = []
    const tripCount = trips.length
    const avgRating = driver.driver_profiles?.rating || 0

    if (tripCount >= 100) badges.push({ name: "Century Driver", icon: "💯", description: "100+ completed trips" })
    if (tripCount >= 500) badges.push({ name: "Elite Driver", icon: "⭐", description: "500+ completed trips" })
    if (avgRating >= 4.8) badges.push({ name: "Top Rated", icon: "🏆", description: "4.8+ average rating" })
    if (avgRating >= 4.95) badges.push({ name: "Perfect Service", icon: "👑", description: "4.95+ average rating" })

    return Response.json({
      success: true,
      driver: {
        id: driver.id,
        name: driver.full_name,
        rating: avgRating,
        totalTrips: tripCount,
      },
      badges,
    })
  } catch (error) {
    return Response.json({ success: false, error: "Failed to fetch driver badges" }, { status: 500 })
  }
}
