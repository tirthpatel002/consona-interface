import type React from 'react'
import type { ComponentDoc } from '@registry/types'

export type ControlType = 'text' | 'select' | 'boolean' | 'number'

export interface PlaygroundControlDef {
  name: string
  label?: string
  type: ControlType
  options?: string[]
  defaultValue?: any
  min?: number
  max?: number
  step?: number
  description?: string
}

export interface PlaygroundConfig<P = any> {
  defaultProps: P
  controls: PlaygroundControlDef[]
  render?: (props: P) => React.ReactNode
  code?: string
  /** Default or minimum canvas height in pixels (e.g. 480 or '500px') */
  minHeight?: number | string
  /** Default canvas height preset: compact (280px), regular (380px), tall (540px) */
  defaultHeight?: 'compact' | 'regular' | 'tall'
  /** Initial layout structure: split (side-by-side) or stacked (full width canvas on top) */
  defaultLayout?: 'split' | 'stacked'
}

export interface ExampleDef {
  id?: string
  title: string
  description?: string
  render: () => React.ReactNode
  code?: string
  /** Minimum canvas height for this example */
  minHeight?: number | string
  /** Custom wrapper CSS class */
  className?: string
}

export interface ComponentDocSpec<P = any> {
  id: string
  name: string
  component?: any
  subpath?: string
  badge?: string
  summary?: string
  subcomponents?: string[]
  playground?: PlaygroundConfig<P>
  examples?: ExampleDef[]
  // Additional markdown / notes
  recipes?: {
    title: string
    description?: string
    code: string
  }[]
  a11yNotes?: string[]
}
