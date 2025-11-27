import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { petitionUrl, signedAt, userId } = await request.json()

    const supabase = createServerClient()

    // Record petition signature
    const { error } = await supabase.from("user_onboarding").upsert({
      user_id: userId || "anonymous",
      petition_signed: true,
      petition_url: petitionUrl,
      petition_signed_at: signedAt,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Failed to record petition signature:", error)
      return NextResponse.json({ success: false, error: "Failed to record signature" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Petition signature recorded",
    })
  } catch (error: any) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
