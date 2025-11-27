"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { initPiSDK, authenticateUser, type PiAuth } from "@/lib/pi-sdk"

interface PiContextType {
  isAuthenticated: boolean
  user: PiAuth | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => void
}

const PiContext = createContext<PiContextType | undefined>(undefined)

export function PiProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiAuth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize Pi SDK on mount
    initPiSDK()
    setLoading(false)
  }, [])

  const signIn = async () => {
    setLoading(true)
    try {
      const auth = await authenticateUser()
      if (auth) {
        setUser(auth)
      }
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
  }

  return (
    <PiContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </PiContext.Provider>
  )
}

export function usePi() {
  const context = useContext(PiContext)
  if (context === undefined) {
    throw new Error("usePi must be used within a PiProvider")
  }
  return context
}
