"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PiProvider, usePi } from "@/contexts/pi-context"
import { MapPin, Navigation, Clock, Star, Wallet, Menu, User, History } from "lucide-react"
import { createPiPayment } from "@/lib/pi-sdk"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { calculateFare, createTrip, createEscrow } from "@/lib/api-client"
import { TeosLogo } from "@/components/teos-logo"
import { LocationAutocomplete } from "@/components/location-autocomplete"

function RiderApp() {
  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [showBooking, setShowBooking] = useState(false)
  const [selectedRide, setSelectedRide] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fareCalculation, setFareCalculation] = useState<any>(null)
  const [currentTrip, setCurrentTrip] = useState<any>(null)
  const { isAuthenticated, user, signIn, loading } = usePi()
  const { toast } = useToast()

  const rideOptions = [
    {
      id: "teoscar",
      name: "TeosCar",
      icon: "🚗",
      eta: "3 min",
      distanceKm: 5.2,
      durationMinutes: 12,
      description: "Standard ride for 1-4 passengers",
    },
    {
      id: "teosxl",
      name: "TeosXL",
      icon: "🚙",
      eta: "5 min",
      distanceKm: 5.2,
      durationMinutes: 12,
      description: "Spacious ride for 5-6 passengers",
    },
  ]

  const handleBookRide = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in with Pi Network to book a ride",
        variant: "destructive",
      })
      return
    }

    if (pickup && destination) {
      try {
        // Calculate fare from backend
        const fareData = await calculateFare(5.2, 12, false)
        setFareCalculation(fareData)
        setShowBooking(true)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to calculate fare. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleConfirmRide = async () => {
    if (!selectedRide || !isAuthenticated || !user) return

    setIsProcessing(true)
    try {
      // Step 1: Create trip in database
      const { trip } = await createTrip({
        riderId: user.user.uid,
        pickupLocation: pickupCoords || { lat: 31.2001, lng: 29.9187 },
        dropoffLocation: destCoords || { lat: 31.2156, lng: 29.9553 },
        pickupAddress: pickup,
        dropoffAddress: destination,
        serviceType: "taxi",
        distanceKm: selectedRide.distanceKm,
        durationMinutes: selectedRide.durationMinutes,
      })

      setCurrentTrip(trip)

      await createPiPayment(
        trip.estimated_fare,
        `TEOSPITAXI Ride - ${trip.trip_number}`,
        {
          tripId: trip.id,
          pickup,
          destination,
        },
        // Approval callback
        async (paymentId) => {
          await createEscrow(trip.id, paymentId, paymentId)
          toast({
            title: "Payment Secured",
            description: "Funds held in escrow, finding your driver...",
          })
        },
        // Completion callback
        async (paymentId, txid) => {
          toast({
            title: "Ride Booked Successfully!",
            description: `Your ${selectedRide.name} is on the way. Trip #${trip.trip_number}`,
          })

          // Reset state
          setShowBooking(false)
          setSelectedRide(null)
          setPickup("")
          setDestination("")
        },
      )
    } catch (error: any) {
      console.error("[v0] Ride booking error:", error)
      toast({
        title: "Booking Failed",
        description: error.message || "Please try again or contact support",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 safe-area-top">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <TeosLogo className="h-10 w-10" />
            <div>
              <h1 className="text-lg font-bold">TEOSPITAXI</h1>
              <p className="text-xs opacity-90">Rider</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={signIn}
                disabled={loading}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <User className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Map Placeholder */}
        <div className="relative flex-1 bg-muted min-h-[50vh]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2 p-6">
              <div className="h-24 w-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Navigation className="h-12 w-12 text-primary" />
              </div>
              {isAuthenticated ? (
                <>
                  <h2 className="text-2xl font-bold text-balance">Welcome, {user?.user.username}</h2>
                  <p className="text-muted-foreground text-pretty">Where do you want to go?</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-balance">Hello World ⭐️</h2>
                  <p className="text-muted-foreground text-pretty">Sign in with Pi to book your ride</p>
                </>
              )}
            </div>
          </div>

          {/* Location Button */}
          <button className="absolute bottom-4 right-4 h-12 w-12 bg-card shadow-lg rounded-full flex items-center justify-center border border-border">
            <Navigation className="h-5 w-5 text-primary" />
          </button>
        </div>

        {/* Booking Panel */}
        <div className="bg-background border-t border-border safe-area-bottom">
          <div className="max-w-md mx-auto p-4 space-y-4">
            {!showBooking ? (
              <>
                {/* Location Inputs */}
                <Card className="p-4 space-y-3">
                  <LocationAutocomplete
                    value={pickup}
                    onChange={(value, coords) => {
                      setPickup(value)
                      if (coords) setPickupCoords(coords)
                    }}
                    placeholder="Pickup location (Alexandria, Cairo, etc.)"
                    icon={<div className="h-4 w-4 rounded-full bg-primary flex-shrink-0" />}
                  />

                  <LocationAutocomplete
                    value={destination}
                    onChange={(value, coords) => {
                      setDestination(value)
                      if (coords) setDestCoords(coords)
                    }}
                    placeholder="Where to? (Aswan, Luxor, etc.)"
                    icon={<MapPin className="h-4 w-4 text-accent flex-shrink-0" />}
                  />
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-3 bg-transparent">
                    <Clock className="h-5 w-5" />
                    <span className="text-xs">Schedule</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-3 bg-transparent">
                    <Star className="h-5 w-5" />
                    <span className="text-xs">Favorites</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-3 bg-transparent">
                    <History className="h-5 w-5" />
                    <span className="text-xs">History</span>
                  </Button>
                </div>

                {/* Book Button */}
                <Button
                  size="lg"
                  className="w-full text-lg font-semibold"
                  onClick={handleBookRide}
                  disabled={!pickup || !destination}
                >
                  Find a Ride
                </Button>
              </>
            ) : (
              <>
                {/* Ride Options */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Choose a ride</h3>

                  {rideOptions.map((ride) => {
                    const ridePrice = fareCalculation?.fare?.totalFare || 15.5
                    const rideUsd = (ridePrice * 0.53).toFixed(2)

                    return (
                      <Card
                        key={ride.id}
                        className={`p-4 cursor-pointer hover:border-primary transition-colors ${
                          selectedRide?.id === ride.id ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => setSelectedRide(ride)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">{ride.icon}</span>
                            </div>
                            <div>
                              <div className="font-semibold">{ride.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{ride.eta} away</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold flex items-center gap-1">
                              <span className="text-accent">π</span>
                              <span>{ridePrice}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">${rideUsd}</div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>

                {selectedRide && fareCalculation && (
                  <Card className="p-4 bg-accent/10 border-accent/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center font-bold text-accent-foreground">
                        π
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Pay with Pi Network</div>
                        <div className="text-xs text-muted-foreground">
                          {fareCalculation.fare.totalFare} Pi held in escrow until ride completes
                        </div>
                      </div>
                    </div>
                    <div className="text-xs space-y-1 border-t border-accent/20 pt-2">
                      {fareCalculation.fare.breakdown?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span>π {item.amount}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-semibold border-t border-accent/20 pt-1 mt-1">
                        <span>Total</span>
                        <span>π {fareCalculation.fare.totalFare}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowBooking(false)}>
                    Back
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={handleConfirmRide}
                    disabled={!selectedRide || isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Confirm Ride"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  )
}

export default function RiderPage() {
  return (
    <PiProvider>
      <RiderApp />
    </PiProvider>
  )
}
