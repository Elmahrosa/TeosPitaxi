"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, User, Navigation, Phone } from "lucide-react"

interface TripCardProps {
  trip: {
    id: string
    trip_number: string
    status: string
    estimated_fare: number
    pickup_address: string
    dropoff_address: string
    distance_km?: number
  }
  showActions?: boolean
  onAccept?: () => void
  onStart?: () => void
  onComplete?: () => void
  onContact?: () => void
}

export function TripCard({ trip, showActions = false, onAccept, onStart, onComplete, onContact }: TripCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-chart-4 text-white"
      case "accepted":
        return "bg-chart-3 text-white"
      case "in_progress":
        return "bg-chart-5 text-white"
      case "completed":
        return "bg-chart-1 text-white"
      default:
        return "bg-muted"
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">{trip.trip_number}</div>
              <div className="text-xs text-muted-foreground">
                {trip.distance_km && `${trip.distance_km.toFixed(1)} km`}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold flex items-center gap-1">
              <span className="text-accent">π</span>
              <span>{trip.estimated_fare}</span>
            </div>
            <Badge className={getStatusColor(trip.status)}>{trip.status}</Badge>
          </div>
        </div>

        <div className="space-y-2 pl-2 border-l-2 border-border ml-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm">{trip.pickup_address}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-accent" />
            <span className="text-sm">{trip.dropoff_address}</span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2">
            {trip.status === "pending" && onAccept && (
              <Button className="flex-1" onClick={onAccept}>
                Accept Trip
              </Button>
            )}
            {trip.status === "accepted" && (
              <>
                {onContact && (
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={onContact}>
                    <Phone className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                )}
                {onStart && (
                  <Button className="flex-1" onClick={onStart}>
                    <Navigation className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                )}
              </>
            )}
            {trip.status === "in_progress" && onComplete && (
              <Button className="w-full" onClick={onComplete}>
                Complete Trip
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
