"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PiProvider, usePi } from "@/contexts/pi-context"
import { Globe, Users, TrendingUp, Award, Menu, User, Wallet, DollarSign, UserPlus, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

function AgentApp() {
  const [referralCode, setReferralCode] = useState("TEOS-ALEX-2025")
  const { isAuthenticated, user, signIn, loading } = usePi()
  const { toast } = useToast()

  const agentStats = {
    totalReferrals: 45,
    activeDrivers: 32,
    activeRiders: 89,
    totalEarnings: 567.5,
    usdEarnings: 302.81,
    monthlyCommission: 156.3,
    tier: "Silver",
  }

  const recentReferrals = [
    { name: "Mohamed A.", type: "Driver", date: "2 days ago", status: "Active", commission: 12.5 },
    { name: "Sarah K.", type: "Rider", date: "3 days ago", status: "Active", commission: 5.0 },
    { name: "Ahmed H.", type: "Driver", date: "5 days ago", status: "Pending", commission: 0 },
  ]

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
    toast({
      title: "Referral Code Copied",
      description: "Share your code to start earning commissions",
    })
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
              <p className="text-xs opacity-90">Global Agent</p>
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
        {/* Agent Tier Badge */}
        {isAuthenticated && (
          <Card className="p-4 bg-gradient-to-r from-chart-4/10 to-chart-3/10 border-chart-4/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-chart-4/20 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-chart-4" />
                </div>
                <div>
                  <div className="font-semibold">{agentStats.tier} Agent</div>
                  <div className="text-sm text-muted-foreground">Level 2 - Keep growing!</div>
                </div>
              </div>
              <Badge className="bg-chart-4 text-white">Active</Badge>
            </div>
          </Card>
        )}

        {/* Earnings Overview */}
        <Card className="p-4">
          <h3 className="font-semibold text-lg mb-4">Total Earnings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl font-bold flex items-center gap-1">
                <span className="text-accent">π</span>
                <span>{agentStats.totalEarnings}</span>
              </div>
              <div className="text-sm text-muted-foreground">${agentStats.usdEarnings} USD</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{agentStats.totalReferrals}</div>
              <div className="text-sm text-muted-foreground">Total referrals</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
            <div>
              <div className="text-lg font-semibold flex items-center gap-1">
                <span className="text-accent">π</span>
                <span>{agentStats.monthlyCommission}</span>
              </div>
              <div className="text-sm text-muted-foreground">This month</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{agentStats.activeDrivers + agentStats.activeRiders}</div>
              <div className="text-sm text-muted-foreground">Active users</div>
            </div>
          </div>
        </Card>

        {/* Referral Code */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Your Referral Code</h3>
          <div className="flex gap-2">
            <Input value={referralCode} readOnly className="font-mono text-center text-lg font-semibold" />
            <Button onClick={copyReferralCode}>Copy</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Share this code to onboard new drivers and riders. Earn commission on every ride they complete.
          </p>
        </Card>

        {/* Commission Structure */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Commission Rates</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Driver Referral</span>
              </div>
              <span className="font-bold text-accent">5% per ride</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Rider Referral</span>
              </div>
              <span className="font-bold text-accent">3% per ride</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-chart-5" />
                <span className="text-sm font-medium">Bonus (10+ refs)</span>
              </div>
              <span className="font-bold text-chart-5">+2% extra</span>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Recent Referrals</h3>
          <div className="space-y-3">
            {recentReferrals.map((referral, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{referral.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {referral.type} - {referral.date}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {referral.status === "Active" ? (
                    <>
                      <div className="font-bold text-sm flex items-center gap-1 justify-end">
                        <span className="text-accent">π</span>
                        <span>{referral.commission}</span>
                      </div>
                      <Badge variant="outline" className="text-xs border-chart-5 text-chart-5">
                        Active
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Agent Benefits */}
        <Card className="p-4 bg-accent/10 border-accent/20">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent" />
            Agent Benefits
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-chart-5 mt-0.5 flex-shrink-0" />
              <span>Earn passive income from every referral ride</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-chart-5 mt-0.5 flex-shrink-0" />
              <span>Lifetime commissions on active referrals</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-chart-5 mt-0.5 flex-shrink-0" />
              <span>Tier bonuses for high-performing agents</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-chart-5 mt-0.5 flex-shrink-0" />
              <span>Direct Pi payments to your wallet</span>
            </li>
          </ul>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 bg-transparent">
            <DollarSign className="h-5 w-5" />
            <span className="text-sm">Withdraw</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 bg-transparent">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">Analytics</span>
          </Button>
        </div>
      </main>
      <Toaster />
    </div>
  )
}

export default function AgentPage() {
  return (
    <PiProvider>
      <AgentApp />
    </PiProvider>
  )
}
