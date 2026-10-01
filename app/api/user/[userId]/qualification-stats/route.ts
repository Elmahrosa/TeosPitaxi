import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createServerClient()
    const userId = params.userId

    // Get qualification stats in parallel
    const [
      { count: completedTrips },
      { count: personalReferrals },
      { count: referralTrips },
    ] = await Promise.all([
      // Completed trips by this user as driver
      supabase
        .from("trips")
        .select("*", { count: "exact", head: true })
        .eq("driver_id", userId)
        .eq("status", "completed"),

      // Personal referrals (users who have this user as their referrer)
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("referred_by", userId),

      // Referral trips (trips completed by users who were referred by this user)
      supabase
        .from("trips")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .in(
          "driver_id",
          supabase
            .from("users")
            .select("id")
            .eq("referred_by", userId)
        )
    ])

    return NextResponse.json({
      success: true,
      stats: {
        completedTrips: completedTrips || 0,
        personalReferrals: personalReferrals || 0,
        referralTrips: referralTrips || 0,
      }
    })
  } catch (error: any) {
    console.error("[TeosPiTaxi] Qualification stats error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch qualification stats" },
      { status: 500 }
    )
  }
}