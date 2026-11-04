import React from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'

/* ==========================================================================
   AspectRatio Presets & Root Primitive
   ========================================================================== */

export type AspectRatioPreset = '16/9' | '4/3' | '1/1' | '21/9' | '9/16' | '3/2' | '2/3'

const presetMap: Record<AspectRatioPreset, number> = {
  '16/9': 16 / 9,
  '4/3': 4 / 3,
  '1/1': 1,
  '21/9': 21 / 9,
  '9/16': 9 / 16,
  '3/2': 3 / 2,
  '2/3': 2 / 3,
}

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Numeric aspect ratio ratio value (width / height, e.g. 16/9 = 1.777) */
  ratio?: number
  /** Standard ratio preset: 16/9, 4/3, 1/1, 21/9, 9/16, 3/2, 2/3 */
  preset?: AspectRatioPreset
  /** Additional CSS class names */
  className?: string
}

const AspectRatioPrimitive = ({
  ratio,
  preset,
  className,
  style,
  children,
  ...props
}: AspectRatioProps) => {
  const calculatedRatio = ratio !== undefined ? ratio : (preset ? presetMap[preset] : 16 / 9)

  return (
    <div
      data-slot="aspect-ratio"
      className={cn('relative w-full overflow-hidden', className)}
      style={{ aspectRatio: `${calculatedRatio}`, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

export const AspectRatio = createInterfaceComponent<AspectRatioProps>(
  {
    name: 'AspectRatio',
    category: 'layout',
    description: 'Container enforcing exact geometric width-to-height proportions across responsive viewports.',
    version: '1.0.0',
    props: {
      preset: '16/9',
    },
  },
  AspectRatioPrimitive
)
