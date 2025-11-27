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
  Percent,
  Tag,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Toaster } from "@/components/ui/toaster"
import { TeosLogo } from "@/components/teos-logo"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

function AdminDashboard() {
  const { isAuthenticated, user, signIn, loading } = usePi()
  const { toast } = useToast()
  const [pricingConfigs, setPricingConfigs] = useState<any[]>([])
  const [activePricing, setActivePricing] = useState<any>(null)
  const [loadingPricing, setLoadingPricing] = useState(false)

  const [newPricing, setNewPricing] = useState({
    name: "",
    baseFare: 5.0,
    perKmRate: 2.0,
    perMinuteRate: 0.5,
    minimumFare: 8.0,
    isPromotional: false,
    promotionalDiscountPercent: 0,
    promotionalMessage: "",
    validDays: 30,
  })

  // Fetch pricing configurations
  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    try {
      const response = await fetch("/api/admin/pricing")
      const data = await response.json()
      setPricingConfigs(data.pricing || [])

      const activeResponse = await fetch("/api/admin/pricing?active=true")
      const activeData = await activeResponse.json()
      setActivePricing(activeData.pricing)
    } catch (error) {
      console.error("[v0] Error fetching pricing:", error)
    }
  }

  const handleCreatePricing = async () => {
    if (!user?.user.username) {
      toast({
        title: "Error",
        description: "You must be signed in to create pricing configurations",
        variant: "destructive",
      })
      return
    }

    setLoadingPricing(true)
    try {
      const response = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: newPricing,
          createdBy: user.user.username,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Pricing configuration created successfully",
        })
        fetchPricing()
        // Reset form
        setNewPricing({
          name: "",
          baseFare: 5.0,
          perKmRate: 2.0,
          perMinuteRate: 0.5,
          minimumFare: 8.0,
          isPromotional: false,
          promotionalDiscountPercent: 0,
          promotionalMessage: "",
          validDays: 30,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create pricing configuration",
        variant: "destructive",
      })
    } finally {
      setLoadingPricing(false)
    }
  }

  const handleActivatePricing = async (configId: string) => {
    if (!user?.user.username) return

    try {
      const response = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configId,
          activatedBy: user.user.username,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Pricing configuration activated",
        })
        fetchPricing()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate pricing configuration",
        variant: "destructive",
      })
    }
  }

  const platformStats = {
    totalRides: 12453,
    totalDeliveries: 3842,
    activeDrivers: 487,
    activeRiders: 2341,
    totalRevenue: 45678.5,
    pendingVerifications: 23,
    activeDisputes: 5,
    systemHealth: 98.7,
  }

  const recentTransactions = [
    { id: "TX-2025-001", type: "Ride", amount: 15.5, status: "Completed", timestamp: "2 min ago" },
    { id: "TX-2025-002", type: "Delivery", amount: 8.5, status: "In Transit", timestamp: "5 min ago" },
    { id: "TX-2025-003", type: "Ride", amount: 22.0, status: "Completed", timestamp: "12 min ago" },
    { id: "TX-2025-004", type: "Ride", amount: 18.5, status: "Escrow", timestamp: "18 min ago" },
  ]

  const pendingVerifications = [
    { id: "DRV-145", name: "Mohamed Hassan", type: "Driver", submitted: "1 day ago", status: "Pending Review" },
    { id: "DRV-146", name: "Sarah Ahmed", type: "Driver", submitted: "2 days ago", status: "Documents Needed" },
    { id: "AGT-023", name: "Ahmed Ali", type: "Agent", submitted: "3 days ago", status: "Under Review" },
  ]

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
                <p className="text-2xl font-bold">{platformStats.totalRides.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">{platformStats.totalDeliveries.toLocaleString()}</p>
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
                  {platformStats.totalRevenue.toLocaleString()}
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
                <p className="text-2xl font-bold">{platformStats.systemHealth}%</p>
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
                  {platformStats.pendingVerifications} driver/agent applications awaiting review
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
                  {platformStats.activeDisputes} disputes requiring admin intervention
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
                    <span className="font-bold">{platformStats.activeDrivers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Riders</span>
                    <span className="font-bold">{platformStats.activeRiders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Users</span>
                    <span className="font-bold">{platformStats.activeDrivers + platformStats.activeRiders}</span>
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
                  {recentTransactions.slice(0, 3).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium">{tx.id}</div>
                        <div className="text-xs text-muted-foreground">{tx.timestamp}</div>
                      </div>
                      <Badge variant="outline">{tx.status}</Badge>
                    </div>
                  ))}
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
                  <p className="text-sm">Chart visualization placeholder</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            {/* Active Pricing Display */}
            <Card className="p-6 border-accent/30 bg-accent/5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5 text-accent" />
                    Active Pricing Configuration
                  </h3>
                  {activePricing?.isPromotional && (
                    <Badge className="mt-2 bg-accent">🎉 Promotional Pricing Active</Badge>
                  )}
                </div>
              </div>

              {activePricing ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Base Fare</span>
                      <span className="font-mono">π {activePricing.baseFare}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Per KM Rate</span>
                      <span className="font-mono">π {activePricing.perKmRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Per Minute Rate</span>
                      <span className="font-mono">π {activePricing.perMinuteRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Minimum Fare</span>
                      <span className="font-mono">π {activePricing.minimumFare}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Treasury Fee</span>
                      <span className="font-mono">{activePricing.treasuryFeePercent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Agent Commission</span>
                      <span className="font-mono">{activePricing.agentCommissionPercent}%</span>
                    </div>
                    {activePricing.isPromotional && (
                      <div className="flex justify-between text-accent">
                        <span className="text-sm font-medium">Discount</span>
                        <span className="font-mono font-bold">-{activePricing.promotionalDiscountPercent}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No active pricing configuration</p>
              )}
            </Card>

            {/* Create New Pricing */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Create New Pricing Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="pricing-name">Configuration Name</Label>
                  <Input
                    id="pricing-name"
                    placeholder="e.g., Launch Month Special"
                    value={newPricing.name}
                    onChange={(e) => setNewPricing({ ...newPricing, name: e.target.value })}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="base-fare">Base Fare (π)</Label>
                    <Input
                      id="base-fare"
                      type="number"
                      step="0.01"
                      value={newPricing.baseFare}
                      onChange={(e) => setNewPricing({ ...newPricing, baseFare: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="per-km">Per KM Rate (π)</Label>
                    <Input
                      id="per-km"
                      type="number"
                      step="0.01"
                      value={newPricing.perKmRate}
                      onChange={(e) => setNewPricing({ ...newPricing, perKmRate: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="per-minute">Per Minute Rate (π)</Label>
                    <Input
                      id="per-minute"
                      type="number"
                      step="0.01"
                      value={newPricing.perMinuteRate}
                      onChange={(e) =>
                        setNewPricing({ ...newPricing, perMinuteRate: Number.parseFloat(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimum">Minimum Fare (π)</Label>
                    <Input
                      id="minimum"
                      type="number"
                      step="0.01"
                      value={newPricing.minimumFare}
                      onChange={(e) => setNewPricing({ ...newPricing, minimumFare: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 border border-border rounded-lg">
                  <Switch
                    id="promotional"
                    checked={newPricing.isPromotional}
                    onCheckedChange={(checked) => setNewPricing({ ...newPricing, isPromotional: checked })}
                  />
                  <Label htmlFor="promotional" className="cursor-pointer">
                    This is a promotional pricing (limited time offer)
                  </Label>
                </div>

                {newPricing.isPromotional && (
                  <div className="space-y-4 p-4 bg-accent/5 border border-accent/20 rounded-lg">
                    <div>
                      <Label htmlFor="discount">Discount Percentage (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        step="1"
                        max="100"
                        value={newPricing.promotionalDiscountPercent}
                        onChange={(e) =>
                          setNewPricing({ ...newPricing, promotionalDiscountPercent: Number.parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="promo-message">Promotional Message</Label>
                      <Input
                        id="promo-message"
                        placeholder="e.g., Launch Special! Get 30% off all rides"
                        value={newPricing.promotionalMessage}
                        onChange={(e) => setNewPricing({ ...newPricing, promotionalMessage: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="valid-days">Valid for (days)</Label>
                      <Input
                        id="valid-days"
                        type="number"
                        value={newPricing.validDays}
                        onChange={(e) => setNewPricing({ ...newPricing, validDays: Number.parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCreatePricing}
                  disabled={!newPricing.name || loadingPricing || !isAuthenticated}
                  className="w-full"
                >
                  {loadingPricing ? "Creating..." : "Create Pricing Configuration"}
                </Button>
              </div>
            </Card>

            {/* All Pricing Configurations */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">All Pricing Configurations</h3>
              <div className="space-y-3">
                {pricingConfigs.map((config) => (
                  <div
                    key={config.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{config.name}</span>
                        {config.is_active && <Badge variant="default">Active</Badge>}
                        {config.is_promotional && (
                          <Badge variant="outline" className="bg-accent/10">
                            Promotional
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Base: π{config.base_fare} | Per KM: π{config.per_km_rate} | Min: π{config.minimum_fare}
                        {config.is_promotional && ` | ${config.promotional_discount_percent}% off`}
                      </div>
                    </div>
                    {!config.is_active && (
                      <Button size="sm" onClick={() => handleActivatePricing(config.id)} disabled={!isAuthenticated}>
                        Activate
                      </Button>
                    )}
                  </div>
                ))}
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
                      {platformStats.activeDrivers + platformStats.activeRiders} active accounts
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
                {recentTransactions.map((tx) => (
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
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Pending Verifications</h3>
              <div className="space-y-3">
                {pendingVerifications.map((item) => (
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
                ))}
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
