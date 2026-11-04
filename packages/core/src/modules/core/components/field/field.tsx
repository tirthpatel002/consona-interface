import React from 'react'
import {
  FieldError as FieldErrorPrimitive,
  type FieldErrorProps as RACFieldErrorProps,
  LabelContext,
  Label as RACLabel,
  type LabelProps as RACLabelProps,
  Text as RACText,
  type TextProps as RACTextProps,
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

export const labelStyles = tv({
  base: [
    'select-none text-sm/5 font-medium text-fg',
    'in-data-required:after:ml-space-xs in-data-required:after:text-danger in-data-required:after:content-["*"]',
    'in-disabled:pointer-events-none in-disabled:opacity-50 group-disabled:opacity-50',
  ],
})

export const descriptionStyles = tv({
  base: 'block text-xs/5 text-muted-fg in-disabled:opacity-50 group-disabled:opacity-50',
})

export const fieldErrorStyles = tv({
  base: 'block text-xs/5 text-danger font-medium in-disabled:opacity-50 group-disabled:opacity-50 forced-colors:text-[Mark]',
})

export const fieldStyles = tv({
  base: [
    'w-full flex flex-col gap-1.5',
    '*:data-[slot=label]:font-medium',
    'in-disabled:opacity-50 disabled:opacity-50',
  ],
})

/* ==========================================================================
   Label Primitive
   ========================================================================== */

export interface LabelProps extends RACLabelProps {
  /** Custom CSS classes for the label element. */
  className?: string
  /** Optional DOM ref attached to the label element. */
  ref?: React.Ref<HTMLLabelElement>
}

const LabelComponent = ({ className, htmlFor, slot, ref, ...props }: LabelProps) => {
  const label = (
    <RACLabel
      ref={ref as any}
      data-slot="label"
      htmlFor={htmlFor}
      slot={slot}
      className={labelStyles({ className })}
      {...props}
    />
  )

  if (htmlFor && slot === undefined) {
    return <LabelContext.Provider value={null}>{label}</LabelContext.Provider>
  }

  return label
}

export const Label = createInterfaceComponent<LabelProps>(
  {
    name: 'Label',
    category: 'form',
    description: 'Accessible form field label with auto-required asterisk and disabled state handling.',
    version: '1.0.0',
  },
  LabelComponent
)

/* ==========================================================================
   Description Primitive
   ========================================================================== */

export interface DescriptionProps extends RACTextProps {
  /** Custom CSS classes for the description element. */
  className?: string
  /** Optional DOM ref attached to the description container. */
  ref?: React.Ref<HTMLElement>
}

const DescriptionComponent = ({ className, ref, ...props }: DescriptionProps) => {
  return (
    <RACText
      ref={ref as any}
      data-slot="description"
      slot="description"
      className={descriptionStyles({ className })}
      {...props}
    />
  )
}

export const Description = createInterfaceComponent<DescriptionProps>(
  {
    name: 'Description',
    category: 'form',
    description: 'Help text description associated with accessible form controls.',
    version: '1.0.0',
  },
  DescriptionComponent
)

/* ==========================================================================
   FieldError Primitive
   ========================================================================== */

export interface FieldErrorProps extends RACFieldErrorProps {
  /** Custom CSS classes for the validation error message. */
  className?: string
  /** Optional DOM ref attached to the error message element. */
  ref?: React.Ref<HTMLElement>
}

const FieldErrorComponent = ({ className, ref, ...props }: FieldErrorProps) => {
  return (
    <FieldErrorPrimitive
      ref={ref as any}
      data-slot="error-message"
      className={fieldErrorStyles({ className })}
      {...props}
    />
  )
}

export const FieldError = createInterfaceComponent<FieldErrorProps>(
  {
    name: 'FieldError',
    category: 'form',
    description: 'Accessible validation error message rendered conditionally upon invalid input.',
    version: '1.0.0',
  },
  FieldErrorComponent
)

/* ==========================================================================
   Field Group & Layout Atoms
   ========================================================================== */

export interface FieldSlots {}

export interface FieldProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Optional DOM ref attached to the field wrapper div. */
  ref?: React.Ref<HTMLDivElement>
  /** Slot overrides map. */
  slots?: SlotComponents<FieldSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<FieldSlots>
  /** Field children elements. */
  children?: React.ReactNode
}

const FieldComponent = ({ className, ref, slots, slotProps, ...props }: FieldProps) => {
  return <div ref={ref} data-slot="field" className={fieldStyles({ className })} {...props} />
}

export const Field = createInterfaceComponent<FieldProps, FieldSlots>(
  {
    name: 'Field',
    category: 'form',
    description: 'Layout container managing vertical rhythm for label, control, and feedback text.',
    version: '1.0.0',
    slots: {

    },
  },
  FieldComponent
)

export interface FieldGroupProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Custom CSS classes for the vertical field stack. */
  className?: string
}

const FieldGroupPrimitive = ({ className, ...props }: FieldGroupProps) => {
  return <div data-slot="field-group" className={cn('flex flex-col gap-space-lg', className)} {...props} />
}

export const FieldGroup = createInterfaceComponent<FieldGroupProps>(
  {
    name: 'FieldGroup',
    category: 'form',
    description: 'Vertical stack layout for multiple related form fields.',
    version: '1.0.0',
  },
  FieldGroupPrimitive
)

export interface FieldsetProps extends React.ComponentPropsWithoutRef<'fieldset'> {
  /** Custom CSS classes for the fieldset container. */
  className?: string
}

const FieldsetPrimitive = ({ className, ...props }: FieldsetProps) => {
  return (
    <fieldset
      data-slot="fieldset"
      className={cn('flex flex-col gap-space-lg border-0 p-0 m-0', className)}
      {...props}
    />
  )
}

export const Fieldset = createInterfaceComponent<FieldsetProps>(
  {
    name: 'Fieldset',
    category: 'form',
    description: 'Semantic HTML fieldset wrapper for grouping related controls with legend support.',
    version: '1.0.0',
  },
  FieldsetPrimitive
)

export interface LegendProps extends React.ComponentPropsWithoutRef<'legend'> {
  /** Custom CSS classes for the fieldset legend text. */
  className?: string
}

const LegendPrimitive = ({ className, ...props }: LegendProps) => {
  return (
    <legend
      data-slot="legend"
      className={cn('font-semibold text-base/6 text-fg mb-space-xs data-disabled:opacity-50', className)}
      {...props}
    />
  )
}

export const Legend = createInterfaceComponent<LegendProps>(
  {
    name: 'Legend',
    category: 'form',
    description: 'Caption element for a fieldset grouping.',
    version: '1.0.0',
  },
  LegendPrimitive
)

// Namespace attachments for compound family ergonomics
Field.Label = Label
Field.Description = Description
Field.Error = FieldError
Field.Group = FieldGroup
Field.Set = Fieldset
Field.Legend = Legend

export const { Context: FieldContext, useCompoundContext: useFieldContext } =
  createCompoundContext<any>('Field')
