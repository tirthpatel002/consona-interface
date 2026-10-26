import React from 'react'
import { LucideIcon } from 'lucide-react'

export interface StatItem {
  label: string
  value: string | number
  subtext?: string
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  iconColor?: string
}

export interface PageStatsBlockProps {
  stats: StatItem[]
}

export const PageStatsBlock: React.FC<PageStatsBlockProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <div
            key={idx}
            className="p-4 rounded-macro border border-border bg-card/60 backdrop-blur-sm flex flex-col justify-between hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-muted-fg uppercase tracking-wider">{stat.label}</span>
              {Icon && (
                <div className={`p-1.5 rounded-micro bg-muted/50 ${stat.iconColor || 'text-primary'}`}>
                  <Icon className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-fg font-mono tracking-tight">{stat.value}</span>
              {stat.subtext && <span className="text-[11px] text-muted-fg font-medium">{stat.subtext}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
