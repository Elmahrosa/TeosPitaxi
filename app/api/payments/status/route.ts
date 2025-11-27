import { type NextRequest, NextResponse } from "next/server"

const PI_API_BASE = "https://api.minepi.com"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get("paymentId")

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 })
    }

    console.log("[v0] Checking payment status:", paymentId)

    const apiKey = process.env.PI_API_KEY

    if (!apiKey) {
      // Demo mode - return simulated status
      return NextResponse.json({
        paymentId,
        status: "completed",
        amount: 15.5,
        verified: true,
        message: "Status check (demo mode)",
      })
    }

    // Call Pi Platform API to get payment status
    const statusResponse = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Key ${apiKey}`,
      },
    })

    if (!statusResponse.ok) {
      throw new Error("Failed to fetch payment status")
    }

    const statusData = await statusResponse.json()

    return NextResponse.json({
      success: true,
      data: statusData,
    })
  } catch (error) {
    console.error("[v0] Payment status error:", error)
    return NextResponse.json({ error: "Failed to fetch payment status", details: error }, { status: 500 })
  }
}
