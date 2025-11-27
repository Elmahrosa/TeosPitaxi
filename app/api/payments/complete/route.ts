import { type NextRequest, NextResponse } from "next/server"
import { completePayment, createTransfer } from "@/lib/pi-sdk-server"
import { getServiceSupabase } from "@/lib/supabase"
import { CompletePaymentSchema } from "@/lib/validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = CompletePaymentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }

    const { paymentId, txid, tripId } = validation.data

    if (!process.env.PI_API_KEY) {
      console.error("[TeosPiTaxi] CRITICAL: PI_API_KEY not configured for payment completion")
      return NextResponse.json(
        {
          error: "Payment system not configured",
          message: "Cannot complete payment - Pi API key missing",
        },
        { status: 503 },
      )
    }

    const db = getServiceSupabase()

    console.log("[v0] Processing payment completion:", { paymentId, txid, tripId })

    if (!paymentId || !txid || !tripId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get trip details
    const { data: trip, error: tripError } = await db
      .from("trips")
      .select("*, rider_id, driver_id, agent_id")
      .eq("id", tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    let completedPayment
    try {
      completedPayment = await completePayment(paymentId, txid)

      if (!completedPayment || typeof completedPayment.amount !== "number") {
        throw new Error("Invalid payment completion response from Pi Network")
      }
    } catch (error: any) {
      console.error("[TeosPiTaxi] Payment completion FAILED:", error)
      return NextResponse.json(
        {
          error: "Payment completion failed",
          message: "Unable to complete payment with Pi Network",
          details: error.message,
        },
        { status: 500 },
      )
    }

    const totalAmount = completedPayment.amount
    const treasuryFee = trip.treasury_fee || totalAmount * 0.1
    const agentCommission = trip.agent_commission || 0
    const driverPayout = trip.driver_payout || totalAmount - treasuryFee - agentCommission

    // Update trip status
    await db
      .from("trips")
      .update({
        payment_status: "completed",
        final_fare: totalAmount,
        status: "payment_complete",
      })
      .eq("id", tripId)

    // Record completion transaction
    await db.from("payment_transactions").insert({
      trip_id: tripId,
      payment_intent_id: paymentId,
      pi_payment_id: completedPayment.identifier,
      from_user_id: trip.rider_id,
      amount: totalAmount,
      transaction_type: "payment_complete",
      status: "completed",
      pi_transaction_id: txid,
      metadata: completedPayment,
    })

    // Process driver payout if driver exists
    if (trip.driver_id && driverPayout > 0) {
      try {
        const driverTransfer = await createTransfer(
          trip.driver_id,
          driverPayout,
          `TeosPiTaxi ride payment - Trip ${trip.trip_number}`,
          { tripId, type: "driver_payout" },
        )

        await db.from("payment_transactions").insert({
          trip_id: tripId,
          payment_intent_id: driverTransfer.identifier,
          to_user_id: trip.driver_id,
          amount: driverPayout,
          transaction_type: "driver_payout",
          status: "completed",
          metadata: driverTransfer,
        })
      } catch (error) {
        console.error("[TeosPiTaxi] Driver payout error:", error)
      }
    }

    // Process agent commission if agent exists
    if (trip.agent_id && agentCommission > 0) {
      try {
        const agentTransfer = await createTransfer(
          trip.agent_id,
          agentCommission,
          `TeosPiTaxi agent commission - Trip ${trip.trip_number}`,
          { tripId, type: "agent_commission" },
        )

        await db.from("payment_transactions").insert({
          trip_id: tripId,
          payment_intent_id: agentTransfer.identifier,
          to_user_id: trip.agent_id,
          amount: agentCommission,
          transaction_type: "agent_commission",
          status: "completed",
          metadata: agentTransfer,
        })
      } catch (error) {
        console.error("[TeosPiTaxi] Agent commission error:", error)
      }
    }

    // Record treasury fee (stays with platform)
    await db.from("payment_transactions").insert({
      trip_id: tripId,
      amount: treasuryFee,
      transaction_type: "treasury_fee",
      status: "completed",
      metadata: { type: "platform_fee", percentage: 10 },
    })

    // Log to transparency
    await db.from("transparency_logs").insert({
      event_type: "payment_completed",
      trip_id: tripId,
      description: "Trip payment completed and funds distributed",
      public_data: {
        trip_number: trip.trip_number,
        total_amount: totalAmount,
        treasury_fee: treasuryFee,
        agent_commission: agentCommission,
        driver_payout: driverPayout,
        payment_id: paymentId,
        txid,
      },
    })

    return NextResponse.json({
      success: true,
      payment: completedPayment,
      distribution: {
        total: totalAmount,
        treasuryFee,
        agentCommission,
        driverPayout,
      },
    })
  } catch (error: any) {
    console.error("[TeosPiTaxi] Payment completion error:", error)
    return NextResponse.json({ error: error.message || "Payment completion failed" }, { status: 500 })
  }
}
