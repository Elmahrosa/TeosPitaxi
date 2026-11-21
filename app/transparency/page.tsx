"use client"
import React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PiProvider } from "@/contexts/pi-context"
import { Shield, FileText, TrendingUp, Users, DollarSign, CheckCircle, ExternalLink, Loader2, Clock, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

function TransparencyPortal() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch transparency stats on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/transparency/stats")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setStats(data.stats)
        setLoading(false)
      } catch (err) {
        console.error("Failed to fetch transparency stats:", err)
        setError(err instanceof Error ? err.message : "Failed to load transparency data")
        setLoading(false)
      }
    }

    fetchStats()

    // Refresh data every 30 seconds to keep it reasonably current
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center font-bold text-xl text-primary-foreground">
                  π
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Transparency Portal</h1>
                  <p className="text-xs text-muted-foreground">Server-verified release-candidate records</p>
                </div>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-4">
          <div className="text-center py-12">
            <Shield className="h-8 w-8 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-bold mb-4">Loading Transparency Data...</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Please wait while we load the latest platform statistics.
            </p>
            <Loader2 className="h-6 w-6 mx-auto mt-4 text-primary" />
          </div>
        </main>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center font-bold text-xl text-primary-foreground">
                  π
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Transparency Portal</h1>
                  <p className="text-xs text-muted-foreground">Server-verified release-candidate records</p>
                </div>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-4">
          <div className="text-center py-12">
            <Shield className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <h2 className="text-3xl font-bold mb-4">Error Loading Data</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {error}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Format number with commas and decimal places
  const formatNumber = (num: number, decimals = 0) => {
    if (num === null || num === undefined) return "0"
    return Number(num).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  // Format timestamp to relative time
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "unknown"
    const now = new Date()
    const then = new Date(dateString)
    const diffMs = now.getTime() - then.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`
    return "just now";
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center font-bold text-xl text-primary-foreground">
                π
              </div>
              <div>
                <h1 className="text-2xl font-bold">Transparency Portal</h1>
                <p className="text-xs text-muted-foreground">Server-verified release-candidate records</p>
              </div>
            </Link>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Hero Section */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            Civic-First Platform
          </div>
          <h2 className="text-4xl font-bold mb-4">Release Candidate Transparency</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            This portal shows only server-verified data when the trusted verifier boundary is connected. It does not
            claim that all records are public, permanent, immutable, or verifiable on the Pi blockchain.
          </p>
        </div>

        {/* Platform Metrics */}
        <Card className="p-6 text-center">
          <p className="text-lg font-semibold mb-2">Platform statistics unavailable</p>
          <p className="text-sm text-muted-foreground">
            Counts, volume, balances, and recent activity are shown only after trusted server data is connected and
            verified. No totals are fabricated in this release candidate.
          </p>
        </Card>

        {/* Financial Distribution */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Approved Split
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-lg mb-2">
                <span className="font-medium">Driver</span>
                <span className="font-bold text-accent">85% qualified / 90% no agent</span>
              </div>
              <div className="flex items-center justify-between text-lg mb-2">
                <span className="font-medium">TEOS Treasury</span>
                <span className="font-bold text-accent">10%</span>
              </div>
              <div className="flex items-center justify-between text-lg mb-2">
                <span className="font-medium">Qualified agent only</span>
                <span className="font-bold text-accent">5% / 0% otherwise</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Amounts are server-derived in integer minor units. No treasury balance or transaction history is
                published by this release candidate.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Transactions
            </h3>
            <p className="text-muted-foreground">No verified transaction history is available</p>
          </Card>
        </div>

        {/* Governance Principles */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Governance Principles</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Card key="financial" className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Policy Terms</h4>
                  <p className="text-sm text-muted-foreground">
                    The approved split is documented in server policy; no blockchain auditability is claimed
                  </p>
                </div>
              </div>
            </Card>
            <Card key="oversight" className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Governance Pending</h4>
                  <p className="text-sm text-muted-foreground">
                    Constitution and stakeholder rules remain owner-supplied and uninitialized
                  </p>
                </div>
              </div>
            </Card>
            <Card key="audits" className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Audit Evidence Pending</h4>
                  <p className="text-sm text-muted-foreground">
                    No completed audit, penetration test, or quarterly review is claimed
                  </p>
                </div>
              </div>
            </Card>
            <Card key="disputes" className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Dispute Process Pending</h4>
                  <p className="text-sm text-muted-foreground">
                    Review timelines and appeal routes require owner-defined policy
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Community Participation */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Governance Participation Unavailable
          </h3>
          <p className="text-muted-foreground mb-4">
            Verified governance participation is not enabled in this release candidate. Constitution, voter eligibility,
            and forum configuration remain owner-supplied.
          </p>
          <Button className="w-full" disabled>
            <Users className="h-4 w-4 mr-2" />
            Community Forum Unavailable
          </Button>
        </Card>
      </main>
    </div>
  )
}

export default function TransparencyPage() {
  return (
    <PiProvider>
      <TransparencyPortal />
    </PiProvider>
  )
}
