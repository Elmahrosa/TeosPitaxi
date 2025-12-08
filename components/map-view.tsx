"use client"

import { useEffect, useRef, useState } from "react"
import { Navigation } from "lucide-react"

interface MapViewProps {
  pickup?: { lat: number; lng: number }
  dropoff?: { lat: number; lng: number }
  currentLocation?: { lat: number; lng: number }
  showRoute?: boolean
  className?: string
}

export function MapView({ pickup, dropoff, currentLocation, showRoute, className }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&libraries=places`
      script.async = true
      script.onload = () => setMapLoaded(true)
      document.head.appendChild(script)
    } else {
      setMapLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google) return

    // Initialize map centered on pickup or current location
    const center = pickup || currentLocation || { lat: 31.2001, lng: 29.9187 } // Alexandria, Egypt

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 14,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
    })

    // Add pickup marker
    if (pickup) {
      new window.google.maps.Marker({
        position: pickup,
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#6366f1",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
        title: "Pickup Location",
      })
    }

    // Add dropoff marker
    if (dropoff) {
      new window.google.maps.Marker({
        position: dropoff,
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#f59e0b",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
        title: "Dropoff Location",
      })
    }

    // Add current location marker
    if (currentLocation) {
      new window.google.maps.Marker({
        position: currentLocation,
        map,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#10b981",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
        title: "Current Location",
      })
    }

    // Draw route if both pickup and dropoff exist
    if (showRoute && pickup && dropoff) {
      const directionsService = new window.google.maps.DirectionsService()
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#6366f1",
          strokeWeight: 4,
        },
      })

      directionsService.route(
        {
          origin: pickup,
          destination: dropoff,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            directionsRenderer.setDirections(result)
          }
        },
      )
    }
  }, [mapLoaded, pickup, dropoff, currentLocation, showRoute])

  if (!mapLoaded) {
    return (
      <div className={`relative bg-muted flex items-center justify-center ${className}`}>
        <div className="text-center space-y-2">
          <Navigation className="h-12 w-12 text-muted-foreground mx-auto animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  return <div ref={mapRef} className={className} />
}
