// TEOSPITAXI Fare Calculator
export interface FareCalculation {
  baseFare: number
  distanceFare: number
  timeFare: number
  surgeFare: number
  totalFare: number
  surgeMultiplier: number
  treasuryFee: number
  agentCommission: number
  driverPayout: number
  breakdown: {
    label: string
    amount: number
  }[]
}

export interface FareConfig {
  baseFare: number
  perKmRate: number
  perMinuteRate: number
  minimumFare: number
  treasuryFeePercent: number
  agentCommissionPercent: number
  surgeMultiplier?: number
}

// Default config for Alexandria, Egypt
export const DEFAULT_FARE_CONFIG: FareConfig = {
  baseFare: 5, // 5 Pi base fare
  perKmRate: 2, // 2 Pi per km
  perMinuteRate: 0.5, // 0.5 Pi per minute
  minimumFare: 8, // Minimum 8 Pi
  treasuryFeePercent: 10, // 10% to TEOS Treasury
  agentCommissionPercent: 5, // 5% to referring agent
  surgeMultiplier: 1.0, // Default no surge
}

export function calculateFare(
  distanceKm: number,
  durationMinutes: number,
  hasAgent = false,
  config: FareConfig = DEFAULT_FARE_CONFIG,
): FareCalculation {
  // Calculate base components
  const baseFare = config.baseFare
  const distanceFare = distanceKm * config.perKmRate
  const timeFare = durationMinutes * config.perMinuteRate

  // Calculate subtotal
  let subtotal = baseFare + distanceFare + timeFare

  // Apply minimum fare
  if (subtotal < config.minimumFare) {
    subtotal = config.minimumFare
  }

  // Apply surge multiplier
  const surgeMultiplier = config.surgeMultiplier || 1.0
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

  if (surgeFare > 0) {
    breakdown.push({ label: `Surge (${surgeMultiplier}x)`, amount: surgeFare })
  }

  return {
    baseFare,
    distanceFare,
    timeFare,
    surgeFare,
    totalFare,
    surgeMultiplier,
    treasuryFee,
    agentCommission,
    driverPayout,
    breakdown,
  }
}

// Get current surge multiplier based on demand
export function getCurrentSurgeMultiplier(activeRiders: number, availableDrivers: number): number {
  if (availableDrivers === 0) return 2.0 // Max surge if no drivers

  const demandRatio = activeRiders / availableDrivers

  if (demandRatio >= 3) return 2.0 // 2x surge
  if (demandRatio >= 2) return 1.5 // 1.5x surge
  if (demandRatio >= 1.5) return 1.3 // 1.3x surge

  return 1.0 // No surge
}
