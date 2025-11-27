"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PiProvider } from "@/contexts/pi-context"
import { Shield, FileText, TrendingUp, Users, DollarSign, CheckCircle, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

function TransparencyPortal() {
  const auditReports = [
    {
      title: "Q1 2025 Financial Audit",
      date: "March 31, 2025",
      status: "Published",
      type: "Financial",
    },
    {
      title: "Security & Privacy Assessment",
      date: "March 15, 2025",
      status: "Published",
      type: "Security",
    },
    {
      title: "Community Governance Report",
      date: "February 28, 2025",
      status: "Published",
      type: "Governance",
    },
  ]

  const platformMetrics = {
    totalTransactions: 16295,
    totalVolume: 234567.5,
    averageRating: 4.7,
    disputeRate: 0.3,
    resolutionTime: "2.4 hours",
    platformFee: "5%",
  }

  const governancePrinciples = [
    {
      title: "Open Financial Records",
      description: "All platform fees and revenue distributions are publicly auditable on the Pi blockchain",
      icon: DollarSign,
    },
    {
      title: "Community Oversight",
      description: "Major platform decisions require community vote from verified stakeholders",
      icon: Users,
    },
    {
      title: "Regular Audits",
      description: "Quarterly independent audits of financial records, security, and governance practices",
      icon: FileText,
    },
    {
      title: "Fair Dispute Resolution",
      description: "Transparent dispute resolution process with community arbitrators",
      icon: Shield,
    },
  ]

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
                <p className="text-xs text-muted-foreground">Open governance & audit records</p>
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

      <main className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Hero Section */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            Civic-First Platform
          </div>
          <h2 className="text-4xl font-bold mb-4">Built on Transparency</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            TEOSPITAXI operates with complete transparency. All transactions, governance decisions, and audit reports
            are publicly accessible.
          </p>
        </div>

        {/* Platform Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
            <p className="text-2xl font-bold">{platformMetrics.totalTransactions.toLocaleString()}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
            <p className="text-xl font-bold flex items-center justify-center gap-1">
              <span className="text-accent">π</span>
              {platformMetrics.totalVolume.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Avg Rating</p>
            <p className="text-2xl font-bold">{platformMetrics.averageRating}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Dispute Rate</p>
            <p className="text-2xl font-bold">{platformMetrics.disputeRate}%</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Resolution Time</p>
            <p className="text-xl font-bold">{platformMetrics.resolutionTime}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Platform Fee</p>
            <p className="text-2xl font-bold">{platformMetrics.platformFee}</p>
          </Card>
        </div>

        {/* Governance Principles */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Governance Principles</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {governancePrinciples.map((principle, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <principle.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">{principle.title}</h4>
                    <p className="text-sm text-muted-foreground">{principle.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Audit Reports */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Audit Reports</h3>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              View All Reports
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {auditReports.map((report, idx) => (
              <Card key={idx} className="p-6 hover:border-primary transition-colors cursor-pointer">
                <div className="space-y-3">
                  <Badge variant="outline">{report.type}</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">{report.title}</h4>
                    <p className="text-sm text-muted-foreground">{report.date}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Report
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Transaction Transparency */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Transaction Transparency
          </h3>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              All transactions on TEOSPITAXI are recorded on the Pi blockchain. Every ride and delivery payment
              includes:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-chart-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Blockchain transaction hash for verification</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-chart-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Timestamp and immutable record of payment</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-chart-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Clear breakdown of fees and commission distribution</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-chart-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Escrow protection until service completion</span>
              </li>
            </ul>
          </div>
        </Card>

        {/* Community Participation */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="text-xl font-semibold mb-3">Join the Governance</h3>
          <p className="text-muted-foreground mb-4">
            Verified drivers, riders, and agents can participate in platform governance. Propose changes, vote on
            policies, and help shape the future of TEOSPITAXI.
          </p>
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Join Community Forum
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
