"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { MapPin } from "lucide-react"
import { searchEgyptianLocations } from "@/lib/egyptian-locations"

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void
  placeholder: string
  icon?: React.ReactNode
}

export function LocationAutocomplete({ value, onChange, placeholder, icon }: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue)

    if (inputValue.length >= 2) {
      const results = searchEgyptianLocations(inputValue)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelectSuggestion = (suggestion: any) => {
    const displayName =
      suggestion.type === "city"
        ? `${suggestion.city}, ${suggestion.governorate}`
        : `${suggestion.name}, ${suggestion.city}`

    onChange(displayName, { lat: suggestion.lat, lng: suggestion.lng })
    setShowSuggestions(false)
  }

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="flex items-center gap-3">
        {icon}
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => value.length >= 2 && setSuggestions(searchEgyptianLocations(value))}
          className="flex-1"
          autoComplete="off"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              className="w-full px-4 py-3 text-left hover:bg-muted flex items-center gap-3 border-b border-border last:border-0"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">
                  {suggestion.type === "city" ? suggestion.city : suggestion.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {suggestion.type === "city" ? suggestion.governorate : suggestion.city}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
