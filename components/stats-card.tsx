import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: string
    isPositive: boolean
  }
}

export function StatsCard({ title, value, subtitle, icon: Icon, iconColor = "text-primary", trend }: StatsCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend && (
            <div className={`text-xs mt-1 ${trend.isPositive ? "text-chart-5" : "text-destructive"}`}>
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </div>
          )}
        </div>
        <div className={`h-12 w-12 bg-muted rounded-xl flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  )
}
