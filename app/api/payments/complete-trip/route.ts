import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { completePayment, createTransfer } from "@/lib/pi-sdk-server"

// Complete trip and distribute payments
export async function POST(req: NextRequest) {
  try {
    const { tripId } = await req.json()

    if (!tripId) {
      return NextResponse.json({ error: "Missing tripId" }, { status: 400 })
    }

    const db = getServiceSupabase()

    // Get trip with all details
    const { data: trip, error: tripError } = await db
      .from("trips")
      .select(`
        *,
        rider:users!trips_rider_id_fkey(id, pi_uid, username),
        driver:users!trips_driver_id_fkey(id, pi_uid, username, pi_wallet_address),
        agent:users!trips_agent_id_fkey(id, pi_uid, username, pi_wallet_address)
      `)
      .eq("id", tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (trip.payment_status !== "escrowed") {
      return NextResponse.json({ error: "Trip payment not in escrow" }, { status: 400 })
    }

    // Complete the original escrow payment
    if (trip.payment_intent_id) {
      try {
        const { data: escrowTx } = await db
          .from("payment_transactions")
          .select("pi_transaction_id")
          .eq("trip_id", tripId)
          .eq("transaction_type", "escrow_fund")
          .single()

        if (escrowTx?.pi_transaction_id) {
          await completePayment(trip.payment_intent_id, escrowTx.pi_transaction_id)
        }
      } catch (error) {
        console.error("[v0] Error completing escrow payment:", error)
      }
    }

    const results = {
      treasuryTransfer: null as any,
      driverTransfer: null as any,
      agentTransfer: null as any,
    }

    // Transfer treasury fee
    if (trip.treasury_fee > 0) {
      try {
        const treasuryTransfer = await createTransfer(
          "TEOS_TREASURY",
          trip.treasury_fee,
          `TEOS Treasury fee for trip ${trip.trip_number}`,
          { trip_id: tripId, type: "treasury_fee" },
        )

        results.treasuryTransfer = treasuryTransfer

        await db.from("payment_transactions").insert({
          trip_id: tripId,
          payment_intent_id: treasuryTransfer.identifier,
          pi_payment_id: treasuryTransfer.identifier,
          amount: trip.treasury_fee,
          transaction_type: "treasury_fee",
          status: "completed",
        })

        // Update treasury ledger
        const { data: currentBalance } = await db
          .from("treasury_ledger")
          .select("balance_after")
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        const newBalance = (currentBalance?.balance_after || 0) + trip.treasury_fee

        await db.from("treasury_ledger").insert({
          trip_id: tripId,
          transaction_type: "trip_fee",
          amount: trip.treasury_fee,
          balance_after: newBalance,
          description: `Fee from trip ${trip.trip_number}`,
        })
      } catch (error) {
        console.error("[v0] Treasury transfer error:", error)
      }
    }

    // Transfer driver payout
    if (trip.driver_payout > 0 && trip.driver?.pi_uid) {
      try {
        const driverTransfer = await createTransfer(
          trip.driver.pi_uid,
          trip.driver_payout,
          `Payout for trip ${trip.trip_number}`,
          { trip_id: tripId, type: "driver_payout" },
        )

        results.driverTransfer = driverTransfer

        await db.from("payment_transactions").insert({
          trip_id: tripId,
          payment_intent_id: driverTransfer.identifier,
          pi_payment_id: driverTransfer.identifier,
          to_user_id: trip.driver_id,
          amount: trip.driver_payout,
          transaction_type: "driver_payout",
          status: "completed",
        })

        // Update driver earnings
        await db
          .from("driver_profiles")
          .update({
            total_earnings: db.raw(`total_earnings + ${trip.driver_payout}`),
          })
          .eq("user_id", trip.driver_id)
      } catch (error) {
        console.error("[v0] Driver transfer error:", error)
      }
    }

    // Transfer agent commission
    if (trip.agent_commission > 0 && trip.agent?.pi_uid) {
      try {
        const agentTransfer = await createTransfer(
          trip.agent.pi_uid,
          trip.agent_commission,
          `Commission for trip ${trip.trip_number}`,
          { trip_id: tripId, type: "agent_commission" },
        )

        results.agentTransfer = agentTransfer

        await db.from("payment_transactions").insert({
          trip_id: tripId,
          payment_intent_id: agentTransfer.identifier,
          pi_payment_id: agentTransfer.identifier,
          to_user_id: trip.agent_id,
          amount: trip.agent_commission,
          transaction_type: "agent_commission",
          status: "completed",
        })

        // Update agent referral stats
        await db
          .from("agent_referrals")
          .update({
            total_trips: db.raw("total_trips + 1"),
            total_commission: db.raw(`total_commission + ${trip.agent_commission}`),
          })
          .eq("agent_id", trip.agent_id)
          .eq("referred_user_id", trip.rider_id)
      } catch (error) {
        console.error("[v0] Agent transfer error:", error)
      }
    }

    // Update trip payment status
    await db
      .from("trips")
      .update({
        payment_status: "completed",
        final_fare: trip.estimated_fare,
      })
      .eq("id", tripId)

    // Update user trip counts
    await db
      .from("users")
      .update({
        total_trips: db.raw("total_trips + 1"),
      })
      .eq("id", trip.rider_id)

    if (trip.driver_id) {
      await db
        .from("users")
        .update({
          total_trips: db.raw("total_trips + 1"),
        })
        .eq("id", trip.driver_id)
    }

    // Log transparency
    await db.from("transparency_logs").insert({
      event_type: "payment_distributed",
      trip_id: tripId,
      description: "Trip payment distributed to all parties",
      public_data: {
        trip_number: trip.trip_number,
        total_fare: trip.estimated_fare,
        treasury_fee: trip.treasury_fee,
        agent_commission: trip.agent_commission,
        driver_payout: trip.driver_payout,
      },
    })

    return NextResponse.json({
      success: true,
      trip,
      transfers: results,
    })
  } catch (error: any) {
    console.error("[v0] Complete trip error:", error)
    return NextResponse.json({ error: error.message || "Failed to complete trip payment" }, { status: 500 })
  }
}
