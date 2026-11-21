"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PiProvider, usePi } from "@/contexts/pi-context"
import {
  Users,
  Car,
  Package,
  TrendingUp,
  Shield,
  AlertTriangle,
  DollarSign,
  Activity,
  BarChart3,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Toaster } from "@/components/ui/toaster"
import { TeosLogo } from "@/components/teos-logo"

type AdminTransaction = {
  id: string
  type: "Ride" | "Delivery"
  timestamp: string
  amount: string
  status: string
}

type PendingVerification = {
  id: string
  name: string
  type: string
  submitted: string
  status: string
}

function AdminDashboard() {
  const { isAuthenticated, user, signIn, loading } = usePi()

  const UNAVAILABLE = "—"
  const recentTransactions: AdminTransaction[] = []
  const pendingVerifications: PendingVerification[] = []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <TeosLogo className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold">TEOSPITAXI Admin</h1>
                <p className="text-xs text-muted-foreground">Governance Dashboard</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/transparency">
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Transparency Portal
                </Button>
              </Link>
              {!isAuthenticated ? (
                <Button onClick={signIn} disabled={loading}>
                  Admin Sign In
                </Button>
              ) : (
                <Badge variant="outline" className="px-3 py-1.5">
                  {user?.user.username}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rides</p>
                <p className="text-2xl font-bold">{UNAVAILABLE}</p>
              </div>
              <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center font-bold text-xl text-primary-foreground">
                π
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deliveries</p>
                <p className="text-2xl font-bold">{UNAVAILABLE}</p>
              </div>
              <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platform Revenue</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <span className="text-accent text-xl">π</span>
                  {UNAVAILABLE}
                </p>
              </div>
              <div className="h-12 w-12 bg-chart-5/10 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-chart-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold">{UNAVAILABLE}</p>
              </div>
              <div className="h-12 w-12 bg-chart-3/10 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-chart-3" />
              </div>
            </div>
          </Card>
        </div>

        {/* Alert Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 border-destructive/20 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Pending Verifications</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Verification counts are unavailable until server data is connected
                </p>
                <Button size="sm" variant="outline">
                  Review Now
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-chart-4/20 bg-chart-4/5">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-chart-4 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Active Disputes</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Dispute counts are unavailable until server data is connected
                </p>
                <Button size="sm" variant="outline">
                  View Disputes
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* User Stats */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Drivers</span>
                    <span className="font-bold">{UNAVAILABLE}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Riders</span>
                    <span className="font-bold">{UNAVAILABLE}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Users</span>
                    <span className="font-bold">{UNAVAILABLE}</span>
                  </div>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.slice(0, 3).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium">{tx.id}</div>
                          <div className="text-xs text-muted-foreground">{tx.timestamp}</div>
                        </div>
                        <Badge variant="outline">{tx.status}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No verified activity available</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Charts Placeholder */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Platform Growth
              </h3>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Charts unavailable until verified metrics are connected</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <Card className="p-6 border-accent/30 bg-accent/5">
              <h3 className="font-semibold text-lg mb-2">Pricing controls unavailable</h3>
              <p className="text-sm text-muted-foreground">
                Pricing is owned by server policy and trusted route metrics. Browser users cannot create, activate, or
                override fares, discounts, or distribution percentages. Owner-supplied policy must be configured and
                verified before any pricing surface is enabled.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active pricing policy</span>
                  <span className="font-medium">{UNAVAILABLE}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minor-unit scale</span>
                  <span className="font-medium">{UNAVAILABLE}</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">User Management</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <div className="font-medium">Total Registered Users</div>
                    <div className="text-sm text-muted-foreground">
                      {UNAVAILABLE} active accounts
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          {tx.type === "Ride" ? (
                            <Car className="h-5 w-5 text-primary" />
                          ) : (
                            <Package className="h-5 w-5 text-accent" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{tx.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {tx.type} - {tx.timestamp}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold flex items-center gap-1">
                          <span className="text-accent">π</span>
                          <span>{tx.amount}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No verified transactions available</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Pending Verifications</h3>
              <div className="space-y-3">
                {pendingVerifications.length > 0 ? (
                  pendingVerifications.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.type} - {item.id} - Submitted {item.submitted}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.status}</Badge>
                        <Button size="sm">Review</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No verification records available</p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  )
}

export default function AdminPage() {
  return (
    <PiProvider>
      <AdminDashboard />
    </PiProvider>
  )
}
