"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PiProvider, usePi } from "@/contexts/pi-context"
import { Car, MapPin, DollarSign, Clock, User, Menu, Wallet, AlertCircle, Navigation } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { acceptTrip, updateTripStatus, completeTrip } from "@/lib/api-client"
import { TeosLogo } from "@/components/teos-logo"
import { DriverDocumentsForm } from "@/components/driver-documents-form"

function DriverApp() {
  const [isOnline, setIsOnline] = useState(false)
  const [activeTrip, setActiveTrip] = useState<any>(null)
  const [availableTrips, setAvailableTrips] = useState<any[]>([])
  const [todayStats, setTodayStats] = useState({
    rides: 0,
    earnings: 0,
    usdEarnings: 0,
    hours: 0,
    rating: 4.8,
  })
  const { isAuthenticated, user, signIn, loading } = usePi()
  const { toast } = useToast()
  const [showDocuments, setShowDocuments] = useState(false)

  useEffect(() => {
    if (isOnline && isAuthenticated) {
      fetchAvailableTrips()
      const interval = setInterval(fetchAvailableTrips, 5000) // Poll every 5 seconds
      return () => clearInterval(interval)
    }
  }, [isOnline, isAuthenticated])

  const fetchAvailableTrips = async () => {
    try {
      const response = await fetch("/api/trips/available")
      const data = await response.json()
      if (data.success) {
        setAvailableTrips(data.trips || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch available trips:", error)
    }
  }

  const handleAcceptTrip = async (tripId: string) => {
    if (!user?.user.uid) return

    try {
      const result = await acceptTrip(tripId, user.user.uid)
      if (result.success) {
        setActiveTrip(result.trip)
        setAvailableTrips((prev) => prev.filter((t) => t.id !== tripId))
        toast({
          title: "Trip Accepted",
          description: "Navigate to pickup location",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to accept trip",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleStartTrip = async () => {
    if (!activeTrip) return

    try {
      const result = await updateTripStatus(activeTrip.id, "in_progress")
      if (result.success) {
        setActiveTrip({ ...activeTrip, status: "in_progress" })
        toast({ title: "Trip Started", description: "Drive safely!" })
      }
    } catch (error) {
      toast({
        title: "Failed to start trip",
        variant: "destructive",
      })
    }
  }

  const handleCompleteTrip = async () => {
    if (!activeTrip) return

    try {
      const result = await completeTrip(activeTrip.id)
      if (result.success) {
        toast({
          title: "Trip Completed",
          description: `Earned π${result.driverEarnings}`,
        })
        setTodayStats((prev) => ({
          ...prev,
          rides: prev.rides + 1,
          earnings: prev.earnings + Number.parseFloat(result.driverEarnings),
        }))
        setActiveTrip(null)
      }
    } catch (error) {
      toast({
        title: "Failed to complete trip",
        variant: "destructive",
      })
    }
  }

  const handleToggleOnline = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in with Pi Network to go online",
        variant: "destructive",
      })
      return
    }
    setIsOnline(!isOnline)
    toast({
      title: isOnline ? "You're now offline" : "You're now online",
      description: isOnline ? "You won't receive new ride requests" : "Ready to accept rides",
    })
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
              <p className="text-xs opacity-90">Driver</p>
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
      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        {/* Online Status Toggle */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  isOnline ? "bg-chart-5/10" : "bg-muted"
                }`}
              >
                <Car className={`h-6 w-6 ${isOnline ? "text-chart-5" : "text-muted-foreground"}`} />
              </div>
              <div>
                <div className="font-semibold">{isOnline ? "You're Online" : "You're Offline"}</div>
                <div className="text-sm text-muted-foreground">
                  {isOnline ? "Accepting ride requests" : "Not accepting rides"}
                </div>
              </div>
            </div>
            <Switch checked={isOnline} onCheckedChange={handleToggleOnline} disabled={!isAuthenticated} />
          </div>
        </Card>

        {/* Verification Status */}
        {isAuthenticated && !showDocuments && (
          <Card className="p-4 bg-accent/10 border-accent/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-accent" />
              <div className="flex-1">
                <div className="font-semibold text-sm">Complete Driver Profile</div>
                <div className="text-xs text-muted-foreground">Upload license and vehicle documents (2020+ only)</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowDocuments(true)}>
                Upload
              </Button>
            </div>
          </Card>
        )}

        {/* Document Upload Form */}
        {showDocuments && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-screen py-8">
              <div className="max-w-2xl mx-auto px-4">
                <Button variant="ghost" onClick={() => setShowDocuments(false)} className="mb-4">
                  ← Back to Dashboard
                </Button>
                <DriverDocumentsForm />
              </div>
            </div>
          </div>
        )}

        {activeTrip && (
          <Card className="p-4 border-primary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Active Trip</h3>
                <Badge className="bg-chart-5 text-white">{activeTrip.status}</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Rider</div>
                    <div className="text-sm text-muted-foreground">{activeTrip.trip_number}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold flex items-center gap-1">
                      <span className="text-accent">π</span>
                      <span>{activeTrip.estimated_fare}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pl-2 border-l-2 border-border ml-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-sm">{activeTrip.pickup_address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-accent" />
                    <span className="text-sm">{activeTrip.dropoff_address}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {activeTrip.status === "accepted" && (
                    <>
                      <Button variant="outline" className="flex-1 bg-transparent">
                        Contact Rider
                      </Button>
                      <Button className="flex-1" onClick={handleStartTrip}>
                        <Navigation className="h-4 w-4 mr-2" />
                        Start Trip
                      </Button>
                    </>
                  )}
                  {activeTrip.status === "in_progress" && (
                    <Button className="w-full" onClick={handleCompleteTrip}>
                      Complete Trip
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {isOnline && !activeTrip && availableTrips.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Available Trips</h3>
            <div className="space-y-3">
              {availableTrips.slice(0, 3).map((trip) => (
                <div key={trip.id} className="p-3 border border-border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{trip.trip_number}</span>
                    <span className="font-bold flex items-center gap-1">
                      <span className="text-accent">π</span>
                      <span>{trip.estimated_fare}</span>
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{trip.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-2 w-2 text-accent" />
                      <span className="text-muted-foreground">{trip.dropoff_address}</span>
                    </div>
                  </div>
                  <Button size="sm" className="w-full" onClick={() => handleAcceptTrip(trip.id)}>
                    Accept Trip
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Today's Stats */}
        <Card className="p-4">
          <h3 className="font-semibold text-lg mb-4">Today's Earnings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl font-bold flex items-center gap-1">
                <span className="text-accent">π</span>
                <span>{todayStats.earnings.toFixed(2)}</span>
              </div>
              <div className="text-sm text-muted-foreground">${todayStats.usdEarnings.toFixed(2)} USD</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{todayStats.rides}</div>
              <div className="text-sm text-muted-foreground">Completed rides</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
            <div>
              <div className="text-lg font-semibold">{todayStats.hours}h</div>
              <div className="text-sm text-muted-foreground">Online time</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold flex items-center justify-end gap-1">
                {todayStats.rating}
                <span className="text-accent">★</span>
              </div>
              <div className="text-sm text-muted-foreground">Rating</div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 bg-transparent">
            <DollarSign className="h-5 w-5" />
            <span className="text-sm">Earnings</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 bg-transparent">
            <Clock className="h-5 w-5" />
            <span className="text-sm">History</span>
          </Button>
        </div>

        {/* Payment Info */}
        {isAuthenticated && (
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center font-bold text-accent-foreground">
                π
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Instant Pi Payments</div>
                <div className="text-xs text-muted-foreground">Earnings transferred immediately after each ride</div>
              </div>
            </div>
          </Card>
        )}
      </main>
      <Toaster />
    </div>
  )
}

export default function DriverPage() {
  return (
    <PiProvider>
      <DriverApp />
    </PiProvider>
  )
}
