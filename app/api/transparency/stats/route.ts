import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { getActivePricing } from "@/lib/dynamic-pricing"

export async function GET(req: NextRequest) {
  try {
    const db = getServiceSupabase()

    // Get platform statistics in parallel
    const [
      { count: totalTrips },
      { count: completedTrips },
      { data: totalVolume },
      { count: activeDrivers },
      { count: activeAgents },
      { count: totalUsers },
      { data: treasuryBalance },
      { data: recentTrips },
      { data: recentTransactions },
      { data: pricingConfig },
    ] = await Promise.all([
      // Total trips
      db.from("trips").select("*", { count: "exact", head: true }),
      // Completed trips
      db.from("trips").select("*", { count: "exact", head: true }).eq("status", "completed"),
      // Total Pi volume processed (sum of completed trip fares)
      db.from("trips").select("sum(estimated_fare) as total_volume").eq("status", "completed"),
      // Active drivers (online and available)
      db.from("driver_profiles").select("*", { count: "exact", head: true }).eq("is_online", true).eq("is_available", true),
      // Active agents (those with referrals and active status)
      db.from("users").select("*", { count: "exact", head: true }).eq("role", "agent").neq("status", "banned"),
      // Total users
      db.from("users").select("*", { count: "exact", head: true }),
      // Treasury balance
      db.from("treasury_ledger").select("balance_after").order("created_at", { ascending: false }).limit(1).single(),
      // Recent completed trips for volume calculation (last 100)
      db
        .from("trips")
        .select("estimated_fare")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(100),
      // Recent transactions (anonymized) - last 20 payment transactions
      db
        .from("payment_transactions")
        .select(
          "id, amount, transaction_type, created_at, \
          from_user:users!payment_transactions_from_user_id_fkey(id, username, role), \
          to_user:users!payment_transactions_to_user_id_fkey(id, username, role)"
        )
        .order("created_at", { ascending: false })
        .limit(20),
      // Get active pricing configuration for distribution percentages
      getActivePricing(db)
    ])

    // Calculate average fare from recent trips
    const avgFare =
      recentTrips && recentTrips.length > 0
        ? recentTrips.reduce((sum, t) => sum + (t.estimated_fare || 0), 0) / recentTrips.length
        : 0

    // Calculate total volume from the sum query
    const totalPiVolume = totalVolume && totalVolume[0]?.total_volume
      ? Number.parseFloat(totalVolume[0].total_volume)
      : 0

    // Get distribution percentages from active pricing config
    const treasuryFeePercent = pricingConfig?.treasury_fee_percent || 15
    const agentCommissionPercent = pricingConfig?.agent_commission_percent || 5
    const driverPayoutPercent = 100 - treasuryFeePercent - agentCommissionPercent

    // Format recent transactions for anonymized display
    const formattedRecentTransactions = (recentTransactions || []).map(tx => ({
      id: tx.id,
      amount: Number.parseFloat(tx.amount),
      type: tx.transaction_type === 'escrow_fund' ? 'Ride Payment' :
            tx.transaction_type === 'driver_payout' ? 'Driver Payout' :
            tx.transaction_type === 'treasury_fee' ? 'Treasury Fee' :
            tx.transaction_type === 'agent_commission' ? 'Agent Commission' : 'Other',
      timestamp: tx.created_at,
      // Anonymize user info
      from_user: tx.from_user ? {
        role: tx.from_user.role,
        // Show only first 2 chars of username for privacy
        username: tx.from_user.username?.substring(0, 2) + '***'
      } : null,
      to_user: tx.to_user ? {
        role: tx.to_user.role,
        // Show only first 2 chars of username for privacy
        username: tx.to_user.username?.substring(0, 2) + '***'
      } : null
    }))

    return NextResponse.json({
      stats: {
        totalTrips: totalTrips || 0,
        completedTrips: completedTrips || 0,
        totalPiVolume: totalPiVolume,
        activeDrivers: activeDrivers || 0,
        activeAgents: activeAgents || 0,
        totalUsers: totalUsers || 0,
        treasuryBalance: treasuryBalance?.balance_after || 0,
        averageFare: Math.round(avgFare * 100) / 100,
        distribution: {
          treasuryFeePercent,
          agentCommissionPercent,
          driverPayoutPercent
        },
        recentTransactions: formattedRecentTransactions
      }
    })
  } catch (error: any) {
    console.error("[TeosPiTaxi] Transparency stats error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch transparency stats" }, { status: 500 })
  }
}
