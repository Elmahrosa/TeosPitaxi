"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PiProvider, usePi } from "@/contexts/pi-context"
import { Package, MapPin, Navigation, Clock, User, Menu, Wallet, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

function DeliveryApp() {
  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [packageSize, setPackageSize] = useState("")
  const [description, setDescription] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [showBooking, setShowBooking] = useState(false)
  const { isAuthenticated, user, signIn, loading } = usePi()
  const { toast } = useToast()

  const deliveryOptions = [
    {
      id: "express",
      name: "Express Delivery",
      icon: "⚡",
      eta: "15-30 min",
      price: 8.5,
      usdPrice: 4.53,
      description: "Fastest delivery for urgent items",
    },
    {
      id: "standard",
      name: "Standard Delivery",
      icon: "📦",
      eta: "45-60 min",
      price: 5.0,
      usdPrice: 2.67,
      description: "Regular delivery for most items",
    },
    {
      id: "scheduled",
      name: "Scheduled Delivery",
      icon: "📅",
      eta: "Choose time",
      price: 6.5,
      usdPrice: 3.47,
      description: "Pick your preferred delivery time",
    },
  ]

  const handleBookDelivery = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in with Pi Network to book a delivery",
        variant: "destructive",
      })
      return
    }

    if (pickup && destination && packageSize && recipientPhone) {
      setShowBooking(true)
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 safe-area-top">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center font-bold text-lg text-accent-foreground">
              π
            </div>
            <div>
              <h1 className="text-lg font-bold">TEOSPITAXI</h1>
              <p className="text-xs opacity-90">Bike Delivery</p>
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
        <div className="relative flex-1 bg-muted min-h-[40vh]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2 p-6">
              <div className="h-20 w-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Package className="h-10 w-10 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-balance">Fast Bike Delivery</h2>
              <p className="text-muted-foreground text-pretty">Send parcels with Pi payment</p>
            </div>
          </div>

          <button className="absolute bottom-4 right-4 h-12 w-12 bg-card shadow-lg rounded-full flex items-center justify-center border border-border">
            <Navigation className="h-5 w-5 text-primary" />
          </button>
        </div>

        {/* Booking Panel */}
        <div className="bg-background border-t border-border safe-area-bottom">
          <div className="max-w-md mx-auto p-4 space-y-4">
            {!showBooking ? (
              <>
                {/* Delivery Form */}
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-primary flex-shrink-0" />
                    <Input
                      placeholder="Pickup location"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                    <Input
                      placeholder="Delivery address"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </Card>

                {/* Package Details */}
                <Card className="p-4 space-y-3">
                  <h3 className="font-semibold">Package Details</h3>
                  <Select value={packageSize} onValueChange={setPackageSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Package size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (up to 5kg)</SelectItem>
                      <SelectItem value="medium">Medium (5-10kg)</SelectItem>
                      <SelectItem value="large">Large (10-15kg)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Package description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      placeholder="Recipient phone number"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      type="tel"
                      className="flex-1"
                    />
                  </div>
                </Card>

                {/* Book Button */}
                <Button
                  size="lg"
                  className="w-full text-lg font-semibold"
                  onClick={handleBookDelivery}
                  disabled={!pickup || !destination || !packageSize || !recipientPhone}
                >
                  Find a Courier
                </Button>
              </>
            ) : (
              <>
                {/* Delivery Options */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Choose delivery speed</h3>

                  {deliveryOptions.map((option) => (
                    <Card key={option.id} className="p-4 cursor-pointer hover:border-primary transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">{option.icon}</span>
                          </div>
                          <div>
                            <div className="font-semibold">{option.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{option.eta}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold flex items-center gap-1">
                            <span className="text-accent">π</span>
                            <span>{option.price}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">${option.usdPrice}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Payment Info */}
                <Card className="p-4 bg-accent/10 border-accent/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center font-bold text-accent-foreground">
                      π
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">Pay with Pi Network</div>
                      <div className="text-xs text-muted-foreground">
                        Payment held in escrow until delivery confirmed
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowBooking(false)}>
                    Back
                  </Button>
                  <Button size="lg" className="flex-1">
                    Confirm Delivery
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

export default function DeliveryPage() {
  return (
    <PiProvider>
      <DeliveryApp />
    </PiProvider>
  )
}
