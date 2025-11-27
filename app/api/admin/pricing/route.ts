import { type NextRequest, NextResponse } from "next/server"
import {
  getActivePricing,
  getAllPricingConfigs,
  createPricingConfig,
  activatePricingConfig,
} from "@/lib/dynamic-pricing"

// GET - Fetch pricing configurations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get("active") === "true"

    if (activeOnly) {
      const pricing = await getActivePricing()
      return NextResponse.json({ pricing })
    }

    const allPricing = await getAllPricingConfigs()
    return NextResponse.json({ pricing: allPricing })
  } catch (error) {
    console.error("[v0] Error fetching pricing:", error)
    return NextResponse.json({ error: "Failed to fetch pricing configurations" }, { status: 500 })
  }
}

// POST - Create new pricing configuration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { config, createdBy } = body

    if (!config || !createdBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newConfig = await createPricingConfig(config, createdBy)

    return NextResponse.json({
      success: true,
      pricing: newConfig,
    })
  } catch (error) {
    console.error("[v0] Error creating pricing:", error)
    return NextResponse.json({ error: "Failed to create pricing configuration" }, { status: 500 })
  }
}

// PUT - Activate pricing configuration
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { configId, activatedBy } = body

    if (!configId || !activatedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const activated = await activatePricingConfig(configId, activatedBy)

    return NextResponse.json({
      success: true,
      pricing: activated,
    })
  } catch (error) {
    console.error("[v0] Error activating pricing:", error)
    return NextResponse.json({ error: "Failed to activate pricing configuration" }, { status: 500 })
  }
}
