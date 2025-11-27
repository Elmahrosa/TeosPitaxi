import { type NextRequest, NextResponse } from "next/server"
import {
  getActivePricing,
  getAllPricingConfigs,
  createPricingConfig,
  activatePricingConfig,
} from "@/lib/dynamic-pricing"
import { PricingConfigSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get("active") === "true"

    if (activeOnly) {
      const pricing = await getActivePricing()
      return NextResponse.json({ success: true, pricing })
    }

    const allPricing = await getAllPricingConfigs()
    return NextResponse.json({ success: true, pricing: allPricing })
  } catch (error) {
    console.error("[TeosPiTaxi] Error fetching pricing:", error)
    return NextResponse.json({ error: "Failed to fetch pricing configurations" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const configValidation = PricingConfigSchema.safeParse(body.config)

    if (!configValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid pricing configuration",
          details: configValidation.error.errors,
        },
        { status: 400 },
      )
    }

    if (!body.createdBy) {
      return NextResponse.json({ error: "createdBy field is required" }, { status: 400 })
    }

    const newConfig = await createPricingConfig(configValidation.data, body.createdBy)

    return NextResponse.json({
      success: true,
      pricing: newConfig,
    })
  } catch (error) {
    console.error("[TeosPiTaxi] Error creating pricing:", error)
    return NextResponse.json({ error: "Failed to create pricing configuration" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { configId, activatedBy } = body

    if (!configId || !activatedBy) {
      return NextResponse.json({ error: "configId and activatedBy fields are required" }, { status: 400 })
    }

    const activated = await activatePricingConfig(configId, activatedBy)

    return NextResponse.json({
      success: true,
      pricing: activated,
    })
  } catch (error) {
    console.error("[TeosPiTaxi] Error activating pricing:", error)
    return NextResponse.json({ error: "Failed to activate pricing configuration" }, { status: 500 })
  }
}
