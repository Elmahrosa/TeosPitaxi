import { createServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const hours = Number.parseInt(searchParams.get("hours") || "24")

    const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    const { data: trips, error } = await supabase
      .from("trips")
      .select("pickup_location, destination_location, status, created_at")
      .gte("created_at", timeAgo)

    if (error) throw error

    // Aggregate trip data for heatmap
    const heatmapData = trips.map((trip) => ({
      pickup: trip.pickup_location,
      destination: trip.destination_location,
      timestamp: trip.created_at,
      status: trip.status,
    }))

    return Response.json({
      success: true,
      data: heatmapData,
      period: `${hours} hours`,
      totalTrips: trips.length,
    })
  } catch (error) {
    return Response.json({ success: false, error: "Failed to fetch heatmap data" }, { status: 500 })
  }
}
