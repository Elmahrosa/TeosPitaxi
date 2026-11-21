// TEOSPITAXI Dynamic Pricing System
import { createServerClient } from "@/lib/supabase"

export interface PricingConfig {
  id: string
  name: string
  isActive: boolean
  validFrom: string
  validUntil: string | null

  // Base pricing
  baseFare: number
  perKmRate: number
  perMinuteRate: number
  minimumFare: number

  // Fee splits
  treasuryFeePercent: number
  agentCommissionPercent: number

  // Promotional
  isPromotional: boolean
  promotionalDiscountPercent: number
  promotionalMessage: string | null

  // Vehicle multipliers
  economyMultiplier: number
  comfortMultiplier: number
  premiumMultiplier: number

  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string | null
  notes: string | null
}

export interface DynamicFareCalculation {
  baseFare: number
  distanceFare: number
  timeFare: number
  vehicleTypeFare: number
  subtotal: number
  promotionalDiscount: number
  surgeFare: number
  totalFare: number

  treasuryFee: number
  agentCommission: number
  driverPayout: number

  pricingConfigId: string
  isPromotional: boolean
  promotionalMessage: string | null

  breakdown: {
    label: string
    amount: number
  }[]
}

// The RPC is untyped because this project does not generate Supabase Database
// types. Describe the exact row contract here so the result is checked instead
// of falling back to `{}`.
interface ActivePricingRow {
  id: string
  name: string
  base_fare: string | number
  per_km_rate: string | number
  per_minute_rate: string | number
  minimum_fare: string | number
  treasury_fee_percent: string | number
  agent_commission_percent: string | number
  is_promotional?: boolean | null
  promotional_discount_percent?: string | number | null
  promotional_message?: string | null
  economy_multiplier?: string | number | null
  comfort_multiplier?: string | number | null
  premium_multiplier?: string | number | null
}

function toNumber(value: string | number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

// Get active pricing configuration
export async function getActivePricing(): Promise<PricingConfig | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .rpc("get_active_pricing")
    .single()
    .overrideTypes<ActivePricingRow, { merge: false }>()

  if (error || !data) {
    console.error("[v0] Error fetching active pricing:", error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    isActive: true,
    validFrom: new Date().toISOString(),
    validUntil: null,
    baseFare: toNumber(data.base_fare),
    perKmRate: toNumber(data.per_km_rate),
    perMinuteRate: toNumber(data.per_minute_rate),
    minimumFare: toNumber(data.minimum_fare),
    treasuryFeePercent: toNumber(data.treasury_fee_percent),
    agentCommissionPercent: toNumber(data.agent_commission_percent),
    isPromotional: data.is_promotional === true,
    promotionalDiscountPercent: toNumber(data.promotional_discount_percent),
    promotionalMessage: data.promotional_message ?? null,
    economyMultiplier: toNumber(data.economy_multiplier, 1),
    comfortMultiplier: toNumber(data.comfort_multiplier, 1.5),
    premiumMultiplier: toNumber(data.premium_multiplier, 2),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: null,
    notes: null,
  }
}

// Calculate fare with dynamic pricing
export async function calculateDynamicFare(
  distanceKm: number,
  durationMinutes: number,
  vehicleType: "economy" | "comfort" | "premium" = "economy",
  hasAgent = false,
  surgeMultiplier = 1.0,
): Promise<DynamicFareCalculation | null> {
  const config = await getActivePricing()

  if (!config) {
    console.error("[v0] No active pricing configuration found")
    return null
  }

  // Get vehicle type multiplier
  const vehicleMultiplier =
    vehicleType === "economy"
      ? config.economyMultiplier
      : vehicleType === "comfort"
        ? config.comfortMultiplier
        : config.premiumMultiplier

  // Calculate base components
  const baseFare = config.baseFare
  const distanceFare = distanceKm * config.perKmRate
  const timeFare = durationMinutes * config.perMinuteRate
  const vehicleTypeFare = (baseFare + distanceFare + timeFare) * (vehicleMultiplier - 1)

  // Calculate subtotal before discounts
  let subtotal = baseFare + distanceFare + timeFare + vehicleTypeFare

  // Apply minimum fare
  if (subtotal < config.minimumFare) {
    subtotal = config.minimumFare
  }

  // Apply promotional discount
  const promotionalDiscount = config.isPromotional ? subtotal * (config.promotionalDiscountPercent / 100) : 0

  subtotal = subtotal - promotionalDiscount

  // Apply surge
  const surgeFare = subtotal * (surgeMultiplier - 1)
  const totalFare = Math.round((subtotal + surgeFare) * 100) / 100

  // Calculate splits
  const treasuryFee = Math.round(totalFare * (config.treasuryFeePercent / 100) * 100) / 100
  const agentCommission = hasAgent ? Math.round(totalFare * (config.agentCommissionPercent / 100) * 100) / 100 : 0
  const driverPayout = Math.round((totalFare - treasuryFee - agentCommission) * 100) / 100

  // Build breakdown
  const breakdown: { label: string; amount: number }[] = [
    { label: "Base Fare", amount: baseFare },
    { label: `Distance (${distanceKm.toFixed(1)} km)`, amount: distanceFare },
    { label: `Time (${durationMinutes} min)`, amount: timeFare },
  ]

  if (vehicleTypeFare > 0) {
    breakdown.push({
      label: `${vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} Vehicle`,
      amount: vehicleTypeFare,
    })
  }

  if (promotionalDiscount > 0) {
    breakdown.push({
      label: `🎉 Promotional Discount (${config.promotionalDiscountPercent}%)`,
      amount: -promotionalDiscount,
    })
  }

  if (surgeFare > 0) {
    breakdown.push({ label: `Surge (${surgeMultiplier}x)`, amount: surgeFare })
  }

  return {
    baseFare,
    distanceFare,
    timeFare,
    vehicleTypeFare,
    subtotal: subtotal - surgeFare,
    promotionalDiscount,
    surgeFare,
    totalFare,
    treasuryFee,
    agentCommission,
    driverPayout,
    pricingConfigId: config.id,
    isPromotional: config.isPromotional,
    promotionalMessage: config.promotionalMessage,
    breakdown,
  }
}

// Admin functions
export async function createPricingConfig(config: Partial<PricingConfig>, createdBy: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("pricing_configs")
    .insert({
      ...config,
      created_by: createdBy,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function activatePricingConfig(configId: string, activatedBy: string) {
  const supabase = await createServerClient()

  // Deactivate all current configs
  await supabase.from("pricing_configs").update({ is_active: false }).eq("is_active", true)

  // Activate the new config
  const { data, error } = await supabase
    .from("pricing_configs")
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", configId)
    .select()
    .single()

  if (error) throw error

  // Log to history
  await supabase.from("pricing_history").insert({
    pricing_config_id: configId,
    action: "activated",
    changed_by: activatedBy,
    notes: "Pricing configuration activated",
  })

  return data
}

export async function getAllPricingConfigs() {
  const supabase = await createServerClient()

  const { data, error } = await supabase.from("pricing_configs").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data
}
