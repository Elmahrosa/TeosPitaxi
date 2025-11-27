import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { createTransfer } from "@/lib/pi-sdk-server"

export async function POST(req: NextRequest) {
  try {
    const { disputeId, resolvedById, resolution, refundAmount, refundTo } = await req.json()

    if (!disputeId || !resolvedById || !resolution) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = getServiceSupabase()

    // Get dispute details
    const { data: dispute } = await db
      .from("disputes")
      .select(`
        *,
        trip:trips(
          *,
          rider:users!trips_rider_id_fkey(id, pi_uid),
          driver:users!trips_driver_id_fkey(id, pi_uid)
        )
      `)
      .eq("id", disputeId)
      .single()

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
    }

    // Update dispute
    const updates: any = {
      status: "resolved",
      resolution,
      resolved_by_id: resolvedById,
      resolved_at: new Date().toISOString(),
    }

    // Process refund if specified
    if (refundAmount && refundAmount > 0 && refundTo) {
      updates.refund_amount = refundAmount
      updates.refund_status = "approved"

      try {
        const recipientUid = refundTo === "rider" ? dispute.trip.rider.pi_uid : dispute.trip.driver.pi_uid

        const refundTransfer = await createTransfer(
          recipientUid,
          refundAmount,
          `Refund for disputed trip ${dispute.trip.trip_number}`,
          { dispute_id: disputeId, type: "refund" },
        )

        // Record refund transaction
        await db.from("payment_transactions").insert({
          trip_id: dispute.trip_id,
          payment_intent_id: refundTransfer.identifier,
          to_user_id: refundTo === "rider" ? dispute.trip.rider_id : dispute.trip.driver_id,
          amount: refundAmount,
          transaction_type: "dispute_resolution",
          status: "completed",
          memo: `Refund for dispute: ${resolution}`,
        })

        updates.refund_status = "completed"
      } catch (error) {
        console.error("[v0] Refund transfer error:", error)
        updates.refund_status = "failed"
      }
    }

    await db.from("disputes").update(updates).eq("id", disputeId)

    // Update trip status
    await db.from("trips").update({ payment_status: "refunded" }).eq("id", dispute.trip_id)

    // Log transparency
    await db.from("transparency_logs").insert({
      event_type: "dispute_resolved",
      trip_id: dispute.trip_id,
      description: `Dispute resolved for trip ${dispute.trip.trip_number}`,
      public_data: {
        trip_number: dispute.trip.trip_number,
        resolution,
        refund_amount: refundAmount,
      },
    })

    return NextResponse.json({ success: true, dispute: { ...dispute, ...updates } })
  } catch (error: any) {
    console.error("[v0] Resolve dispute error:", error)
    return NextResponse.json({ error: error.message || "Failed to resolve dispute" }, { status: 500 })
  }
}
