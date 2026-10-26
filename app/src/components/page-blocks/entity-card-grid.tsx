import React from 'react'
import { ChevronRight, LucideIcon } from 'lucide-react'
import { Badge, InfiniteScrollSection } from '@consona/interface'

export interface EntityCardItem {
  id: string
  title: string
  description?: string
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  iconColor?: string
  badge?: string
  badgeIntent?: 'primary' | 'secondary' | 'accent' | 'outline'
  tags?: string[]
  href?: string
  onClick?: () => void
  meta?: React.ReactNode
}

export interface EntityCardGridProps {
  items: EntityCardItem[]
  columns?: 2 | 3 | 4
  emptyMessage?: string
  enableInfiniteScroll?: boolean
  maxHeight?: string | number
  initialLoadCount?: number
  appendCount?: number
}

export const EntityCardItemView: React.FC<{ item: EntityCardItem }> = ({ item }) => {
  const Icon = item.icon
  return (
    <div
      key={item.id}
      onClick={item.onClick}
      className="group relative p-5 rounded-macro border border-border bg-card hover:bg-muted/30 hover:border-primary/50 transition-all duration-200 flex flex-col justify-between cursor-pointer shadow-xs hover:shadow-md h-full"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className={`p-2 rounded-base bg-muted/60 border border-border/80 group-hover:scale-105 transition-transform ${item.iconColor || 'text-primary'}`}>
                <Icon className="w-4 h-4" />
              </div>
            )}
            <h3 className="font-bold text-fg group-hover:text-primary transition-colors text-base tracking-tight">
              {item.title}
            </h3>
          </div>
          {item.badge && (
            <Badge intent={item.badgeIntent || 'outline'} size="sm" className="font-mono text-[10px]">
              {item.badge}
            </Badge>
          )}
        </div>

        {item.description && (
          <p className="text-xs text-muted-fg line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
          {item.tags?.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-fg border border-border/40">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform shrink-0">
          <span>View</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  )
}

export const EntityCardGrid: React.FC<EntityCardGridProps> = ({
  items,
  columns = 3,
  emptyMessage = 'No matching items found.',
  enableInfiniteScroll = false,
  maxHeight = 780,
  initialLoadCount = 18,
  appendCount = 12,
}) => {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center rounded-macro border border-dashed border-border bg-muted/10 text-muted-fg">
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    )
  }

  const gridColsClass =
    columns === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : columns === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  if (enableInfiniteScroll) {
    return (
      <InfiniteScrollSection
        items={items}
        initialLoadCount={initialLoadCount}
        appendCount={appendCount}
        windowSize={60}
        maxHeight={maxHeight}
        threshold={100}
        contentClassName={`grid ${gridColsClass} gap-4`}
        className="p-1 rounded-macro border border-border/40 bg-muted/5 shadow-inner"
        renderItem={(item) => <EntityCardItemView key={item.id} item={item} />}
        emptyState={
          <div className="p-12 text-center rounded-macro border border-dashed border-border bg-muted/10 text-muted-fg">
            <p className="text-sm font-medium">{emptyMessage}</p>
          </div>
        }
        endReachedComponent={
          <div className="py-4 text-center text-xs text-muted-fg font-mono border-t border-border/40 mt-3">
            ✓ All {items.length} items loaded
          </div>
        }
      />
    )
  }

  return (
    <div className={`grid ${gridColsClass} gap-4`}>
      {items.map((item) => (
        <EntityCardItemView key={item.id} item={item} />
      ))}
    </div>
  )
}
