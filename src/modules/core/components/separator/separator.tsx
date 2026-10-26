import React from 'react'
import { Separator as DividerPrimitive, type SeparatorProps as RACSeparatorProps } from 'react-aria-components/Separator'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'

export interface SeparatorProps extends Omit<RACSeparatorProps, 'children'> {
  /** Optional children content. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Layout orientation of the dividing line: horizontal or vertical. */
  orientation?: 'horizontal' | 'vertical'
  /** Custom CSS classes passed to the separator element. */
  className?: string
  /** Optional DOM ref attached to the separator element. */
  ref?: React.Ref<HTMLElement>
}

const SeparatorPrimitive = ({
  orientation = 'horizontal',
  className,
  ref,
  ...props
}: SeparatorProps) => {
  return (
    <DividerPrimitive
      ref={ref as any}
      orientation={orientation}
      className={cn(
        'shrink-0 border-0 bg-border forced-colors:bg-[ButtonBorder]',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  )
}

export const Separator = createInterfaceComponent<SeparatorProps>(
  {
    name: 'Separator',
    category: 'layout',
    description: 'Accessible horizontal or vertical rule separator with optical border tokens.',
    version: '1.0.0',
    props: {
      orientation: 'horizontal',
    },
  },
  SeparatorPrimitive
)

/** Alias for Separator */
export const Divider = Separator
export interface DividerProps extends SeparatorProps {}

// Namespace attachments for compound family ergonomics
Separator.Divider = Divider

