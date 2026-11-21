"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { initPiSDK, authenticateUser, type PiAuth } from "@/lib/pi-sdk"
import { PetitionDialog } from "@/components/petition-dialog"

interface PiContextType {
  isAuthenticated: boolean
  user: PiAuth | null
  loading: boolean
  signIn: () => void
  signOut: () => Promise<void>
  showPetitionDialog: boolean
  completePiSignIn: () => Promise<void>
}

interface BrowseEvidenceResult {
  browseEvidenceId: string
  observedAt: string
  expiresAt: string
}

interface ServerSessionResult {
  csrfToken: string
  csrfEpoch: number
  expiresAt: string
  role: string
}

const PiContext = createContext<PiContextType | undefined>(undefined)

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }

  if (typeof window !== "undefined") {
    const csrfToken = window.sessionStorage.getItem("rev2e_csrf_token")
    const csrfEpoch = window.sessionStorage.getItem("rev2e_csrf_epoch")
    if (csrfToken && csrfEpoch) {
      headers["x-rev2e-csrf"] = csrfToken
      headers["x-rev2e-csrf-epoch"] = csrfEpoch
    }
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers,
    body: JSON.stringify(body),
  })

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | null

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Request failed (${response.status})`)
  }

  return payload as T
}

function applyServerSession(session: ServerSessionResult): void {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem("rev2e_csrf_token", session.csrfToken)
  window.sessionStorage.setItem("rev2e_csrf_epoch", String(session.csrfEpoch))
  window.sessionStorage.setItem("rev2e_session_role", session.role)
  window.sessionStorage.setItem("rev2e_session_expires_at", session.expiresAt)
}

function clearServerSession(): void {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem("rev2e_csrf_token")
  window.sessionStorage.removeItem("rev2e_csrf_epoch")
  window.sessionStorage.removeItem("rev2e_session_role")
  window.sessionStorage.removeItem("rev2e_session_expires_at")
}

export function PiProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiAuth | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPetitionDialog, setShowPetitionDialog] = useState(false)

  useEffect(() => {
    initPiSDK()
    queueMicrotask(() => setLoading(false))
  }, [])

  const signIn = () => {
    setShowPetitionDialog(true)
  }

  const completePiSignIn = async () => {
    setLoading(true)
    clearServerSession()

    try {
      // Browse-first authority is persisted by the server before Pi.authenticate.
      const evidence = await postJson<BrowseEvidenceResult>("/api/session/browse-evidence", {})
      if (!evidence?.browseEvidenceId) {
        throw new Error("Server browse evidence was not created")
      }

      const auth = await authenticateUser()
      if (!auth) {
        throw new Error("Pi authentication was not completed")
      }

      const session = await postJson<ServerSessionResult>("/api/session/bootstrap", {
        accessToken: auth.accessToken,
        browseEvidenceId: evidence.browseEvidenceId,
      })

      applyServerSession(session)
      setUser(auth)
    } catch (error) {
      console.error("[rev2e] Sign-in failed:", error)
      clearServerSession()
      setUser(null)
    } finally {
      setLoading(false)
      setShowPetitionDialog(false)
    }
  }

  const signOut = async () => {
    try {
      await postJson("/api/session/logout", {})
    } catch (error) {
      console.error("[rev2e] Server sign-out failed:", error)
    } finally {
      clearServerSession()
      setUser(null)
    }
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
