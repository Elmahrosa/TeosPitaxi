"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { initPiSDK, authenticateUser, type PiAuth } from "@/lib/pi-sdk"
import { PetitionDialog } from "@/components/petition-dialog"

interface PiContextType {
  isAuthenticated: boolean
  user: PiAuth | null
  loading: boolean
  signIn: () => void
  signOut: () => void
  showPetitionDialog: boolean
  completePiSignIn: () => Promise<void>
}

const PiContext = createContext<PiContextType | undefined>(undefined)

export function PiProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiAuth | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPetitionDialog, setShowPetitionDialog] = useState(false)
  const [pendingSignIn, setPendingSignIn] = useState(false)

  useEffect(() => {
    // Initialize Pi SDK on mount
    initPiSDK()
    setLoading(false)
  }, [])

  const signIn = async () => {
    setShowPetitionDialog(true)
    setPendingSignIn(true)
  }

  const completePiSignIn = async () => {
    setLoading(true)
    try {
      const auth = await authenticateUser()
      if (auth) {
        setUser(auth)
      }
    } finally {
      setLoading(false)
      setShowPetitionDialog(false)
      setPendingSignIn(false)
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
        showPetitionDialog,
        completePiSignIn,
      }}
    >
      <PetitionDialog open={showPetitionDialog} onComplete={completePiSignIn} />
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
