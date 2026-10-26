import React from 'react'

export interface AutoVariantGridProps {
  component: React.ComponentType<any>
  intents?: string[]
  sizes?: string[]
  defaultProps?: Record<string, any>
  label?: string
}

export const AutoVariantGrid: React.FC<AutoVariantGridProps> = ({
  component: Component,
  intents = ['primary', 'secondary', 'accent', 'danger', 'warning', 'success', 'outline', 'ghost'],
  sizes = ['xs', 'sm', 'md', 'lg'],
  defaultProps = {},
  label = 'Action',
}) => {
  return (
    <div className="w-full space-y-6">
      {/* Intent Matrix */}
      <div>
        <div className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">
          Semantic Intent Ramps
        </div>
        <div className="flex flex-wrap gap-2.5 items-center">
          {intents.map((intent) => (
            <Component key={intent} intent={intent} {...defaultProps}>
              {intent.charAt(0).toUpperCase() + intent.slice(1)}
            </Component>
          ))}
        </div>
      </div>

      {/* Size Matrix */}
      <div>
        <div className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">
          Optical Size Scale
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {sizes.map((size) => (
            <Component key={size} size={size} {...defaultProps}>
              {label} ({size.toUpperCase()})
            </Component>
          ))}
        </div>
      </div>
    </div>
  )
}
