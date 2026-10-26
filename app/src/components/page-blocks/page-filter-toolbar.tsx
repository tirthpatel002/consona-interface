import React from 'react'
import { Search, X } from 'lucide-react'
import { Input, Badge } from '@consona/interface'

export interface FilterOption {
  id: string
  label: string
  count?: number
}

export interface PageFilterToolbarProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  searchPlaceholder?: string
  filterOptions?: FilterOption[]
  activeFilter?: string
  onFilterChange?: (id: string) => void
  totalResults?: number
}

export const PageFilterToolbar: React.FC<PageFilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterOptions,
  activeFilter,
  onFilterChange,
  totalResults,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 rounded-macro border border-border bg-muted/20">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="w-4 h-4 text-muted-fg absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-8 py-1.5 text-sm rounded-base border border-border bg-bg text-fg placeholder:text-muted-fg focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all font-sans"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange?.('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-fg hover:text-fg p-0.5"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {filterOptions && onFilterChange && (
          <div className="flex items-center gap-1 p-0.5 rounded-base bg-muted/40 border border-border/60">
            {filterOptions.map((opt) => {
              const isActive = activeFilter === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onFilterChange(opt.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary text-primary-fg shadow-sm font-semibold'
                      : 'text-muted-fg hover:text-fg hover:bg-muted/60'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-primary-fg/20 text-primary-fg' : 'bg-muted/80 text-muted-fg'
                      }`}
                    >
                      {opt.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {totalResults !== undefined && (
          <div className="text-xs text-muted-fg font-mono px-2 py-1">
            {totalResults} {totalResults === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>
    </div>
  )
}
