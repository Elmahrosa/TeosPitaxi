import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const db = getServiceSupabase()

    // Get platform statistics
    const [
      { count: totalTrips },
      { count: completedTrips },
      { count: activeDrivers },
      { count: totalUsers },
      { data: treasuryBalance },
      { data: recentTrips },
    ] = await Promise.all([
      db.from("trips").select("*", { count: "exact", head: true }),
      db.from("trips").select("*", { count: "exact", head: true }).eq("status", "completed"),
      db.from("driver_profiles").select("*", { count: "exact", head: true }).eq("is_online", true),
      db.from("users").select("*", { count: "exact", head: true }),
      db.from("treasury_ledger").select("balance_after").order("created_at", { ascending: false }).limit(1).single(),
      db
        .from("trips")
        .select("estimated_fare")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(100),
    ])

    // Calculate average fare
    const avgFare =
      recentTrips && recentTrips.length > 0
        ? recentTrips.reduce((sum, t) => sum + (t.estimated_fare || 0), 0) / recentTrips.length
        : 0

    return NextResponse.json({
      stats: {
        totalTrips: totalTrips || 0,
        completedTrips: completedTrips || 0,
        activeDrivers: activeDrivers || 0,
        totalUsers: totalUsers || 0,
        treasuryBalance: treasuryBalance?.balance_after || 0,
        averageFare: Math.round(avgFare * 100) / 100,
      },
    })
  } catch (error: any) {
    console.error("[v0] Stats error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 })
  }
}
