import React, { type HTMLAttributes } from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   DescriptionList Root
   ========================================================================== */

export interface DescriptionListSlots {}

export interface DescriptionListProps extends HTMLAttributes<HTMLDListElement> {
  /** Forwarded ref for the dl element. */
  ref?: React.Ref<HTMLDListElement>
  /** Injected slot component overrides. */
  slots?: SlotComponents<DescriptionListSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DescriptionListSlots>
}

const DescriptionListPrimitive = ({
  className,
  ref,
  ...props
}: DescriptionListProps) => {
  return (
    <dl
      ref={ref}
      data-slot="description-list"
      className={cn(
        'grid grid-cols-1 text-base/6 sm:grid-cols-[min(50%,calc(var(--spacing)*80))_auto] sm:text-sm/6 gap-y-1 sm:gap-y-0',
        className
      )}
      {...props}
    />
  )
}

export const DescriptionList = createInterfaceComponent<DescriptionListProps, DescriptionListSlots>(
  {
    name: 'DescriptionList',
    category: 'data',
    description: 'Structured key-value metadata list component with responsive grid alignment.',
    version: '1.0.0',
    slots: {

    },
  },
  DescriptionListPrimitive
)

/* ==========================================================================
   Description Term
   ========================================================================== */

export interface DescriptionTermSlots {}

export interface DescriptionTermProps extends HTMLAttributes<HTMLElement> {
  /** Forwarded ref for the dt element. */
  ref?: React.Ref<HTMLElement>
  /** Injected slot component overrides. */
  slots?: SlotComponents<DescriptionTermSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DescriptionTermSlots>
}

const DescriptionTermPrimitive = ({
  className,
  ref,
  ...props
}: DescriptionTermProps) => {
  return (
    <dt
      ref={ref}
      data-slot="description-term"
      className={cn(
        'col-start-1 border-t border-border/60 pt-3 text-muted-fg font-medium first:border-none sm:py-3',
        className
      )}
      {...props}
    />
  )
}

export const DescriptionTerm = createInterfaceComponent<DescriptionTermProps, DescriptionTermSlots>(
  {
    name: 'DescriptionTerm',
    category: 'data',
    description: 'Label term element inside a DescriptionList.',
    version: '1.0.0',
    slots: {

    },
  },
  DescriptionTermPrimitive
)

/* ==========================================================================
   Description Details
   ========================================================================== */

export interface DescriptionDetailsSlots {}

export interface DescriptionDetailsProps extends HTMLAttributes<HTMLElement> {
  /** Forwarded ref for the dd element. */
  ref?: React.Ref<HTMLElement>
  /** Injected slot component overrides. */
  slots?: SlotComponents<DescriptionDetailsSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DescriptionDetailsSlots>
}

const DescriptionDetailsPrimitive = ({
  className,
  ref,
  ...props
}: DescriptionDetailsProps) => {
  return (
    <dd
      ref={ref}
      data-slot="description-details"
      className={cn(
        'pt-1 pb-3 text-fg sm:border-t sm:border-border/60 sm:nth-2:border-none sm:py-3',
        className
      )}
      {...props}
    />
  )
}

export const DescriptionDetails = createInterfaceComponent<DescriptionDetailsProps, DescriptionDetailsSlots>(
  {
    name: 'DescriptionDetails',
    category: 'data',
    description: 'Value details element corresponding to a term inside a DescriptionList.',
    version: '1.0.0',
    slots: {

    },
  },
  DescriptionDetailsPrimitive
)

/* ==========================================================================
   Compound Family Namespace Attachments
   ========================================================================== */

DescriptionList.Term = DescriptionTerm
DescriptionList.Details = DescriptionDetails

export const { Context: DescriptionListContext, useCompoundContext: useDescriptionListContext } =
  createCompoundContext<any>('DescriptionList')
