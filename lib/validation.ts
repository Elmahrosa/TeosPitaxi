import { z } from "zod"

// Trip validation schemas
export const CreateTripSchema = z.object({
  riderId: z.string().min(1, "Rider ID is required"),
  pickupLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  dropoffLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  dropoffAddress: z.string().min(1, "Dropoff address is required"),
  serviceType: z.enum(["taxi", "bike_delivery"]),
  distanceKm: z.number().positive("Distance must be positive"),
  durationMinutes: z.number().positive().optional(),
  agentId: z.string().optional(),
})

export const AcceptTripSchema = z.object({
  tripId: z.string().uuid("Invalid trip ID"),
  driverId: z.string().min(1, "Driver ID is required"),
})

export const UpdateTripStatusSchema = z.object({
  tripId: z.string().uuid("Invalid trip ID"),
  status: z.enum(["pending", "accepted", "in_progress", "completed", "cancelled"]),
})

// Payment validation schemas
export const CreateEscrowSchema = z.object({
  tripId: z.string().uuid("Invalid trip ID"),
  paymentIntentId: z.string().min(1, "Payment intent ID is required"),
  piPaymentId: z.string().optional(),
})

export const CompletePaymentSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  txid: z.string().min(1, "Transaction ID is required"),
  tripId: z.string().uuid("Invalid trip ID"),
})

// Pricing validation schemas
export const PricingConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  baseFare: z.number().positive("Base fare must be positive"),
  perKmRate: z.number().positive("Per km rate must be positive"),
  perMinuteRate: z.number().nonnegative("Per minute rate cannot be negative"),
  minimumFare: z.number().positive("Minimum fare must be positive"),
  treasuryFeePercent: z.number().min(0).max(100, "Treasury fee must be between 0-100%"),
  agentCommissionPercent: z.number().min(0).max(100, "Agent commission must be between 0-100%"),
  isPromotional: z.boolean().optional(),
  promotionalDiscountPercent: z.number().min(0).max(100).optional(),
  promotionalMessage: z.string().optional(),
  economyMultiplier: z.number().positive().optional(),
  comfortMultiplier: z.number().positive().optional(),
  premiumMultiplier: z.number().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
})

// Fare calculation validation
export const FareCalculationSchema = z.object({
  distanceKm: z.number().positive("Distance must be positive"),
  durationMinutes: z.number().positive("Duration must be positive"),
  hasAgent: z.boolean().optional(),
  vehicleType: z.enum(["economy", "comfort", "premium"]).optional(),
  surgeMultiplier: z.number().min(1).max(3).optional(),
})

// Dispute validation
export const CreateDisputeSchema = z.object({
  tripId: z.string().uuid("Invalid trip ID"),
  filedById: z.string().min(1, "Filed by ID is required"),
  reason: z.enum(["payment_issue", "service_quality", "route_issue", "driver_behavior", "rider_behavior", "other"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  evidence: z.any().optional(),
})
