import React from 'react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Toaster as SonnerToaster, toast, type ToasterProps } from 'sonner'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { useThemeOptional } from '../../../../theme/theme-provider'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { ToastQueue } from '../../hooks/use-toast'

/* ==========================================================================
   Toast Portal (Sonner)
   ========================================================================== */

export interface ToastSlots {}

export interface ToastProps extends ToasterProps {
  /** Optional children */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Slot overrides for the portal toaster. */
  slots?: SlotComponents<ToastSlots>
  /** Props passed into injected slots. */
  slotProps?: SlotPropsMap<ToastSlots>
}

const TOAST_TOKENS = {
  '--normal-bg': 'color-mix(in oklab, var(--overlay) 92%, transparent)',
  '--normal-text': 'var(--fg)',
  '--normal-border': 'color-mix(in oklab, var(--border) 80%, transparent)',
  '--normal-bg-hover': 'var(--muted)',
  '--normal-border-hover': 'var(--border)',
  '--success-bg': 'color-mix(in oklab, var(--overlay) 92%, transparent)',
  '--success-border': 'color-mix(in oklab, var(--border) 80%, transparent)',
  '--success-text': 'var(--fg)',
  '--error-bg': 'color-mix(in oklab, var(--overlay) 92%, transparent)',
  '--error-border': 'color-mix(in oklab, var(--border) 80%, transparent)',
  '--error-text': 'var(--fg)',
  '--warning-bg': 'color-mix(in oklab, var(--overlay) 92%, transparent)',
  '--warning-border': 'color-mix(in oklab, var(--border) 80%, transparent)',
  '--warning-text': 'var(--fg)',
  '--info-bg': 'color-mix(in oklab, var(--overlay) 92%, transparent)',
  '--info-border': 'color-mix(in oklab, var(--border) 80%, transparent)',
  '--info-text': 'var(--fg)',
  '--border-radius': 'var(--radius-macro)',
  '--width': '22.5rem',
  '--gray2': 'var(--muted)',
  '--gray5': 'var(--border)',
  '--gray11': 'var(--muted-fg)',
  '--gray12': 'var(--fg)',
  fontFamily: 'var(--font-sans)',
} as React.CSSProperties

const TOAST_SURFACE = {
  padding: '12px 10px 12px 14px',
  gap: '10px',
  background: 'color-mix(in oklab, var(--overlay) 92%, transparent)',
  color: 'var(--fg)',
  borderColor: 'color-mix(in oklab, var(--border) 70%, transparent)',
  boxShadow:
    'inset 2px 0 0 var(--toast-accent, transparent), 0 1px 1px color-mix(in oklab, var(--fg) 4%, transparent), 0 18px 40px -22px color-mix(in oklab, var(--fg) 34%, transparent)',
} as React.CSSProperties

const toastShellClass = cn(
  'rounded-macro border font-sans text-[13px] leading-5 backdrop-blur-xl will-change-transform',
  '[--toast-accent:transparent]',
  'data-[type=success]:[--toast-accent:var(--success)]',
  'data-[type=error]:[--toast-accent:var(--danger)]',
  'data-[type=warning]:[--toast-accent:var(--warning)]',
  'data-[type=info]:[--toast-accent:var(--info)]',
  'data-[type=loading]:[--toast-accent:var(--muted-fg)]',
  '[&_[data-close-button]]:!opacity-0',
  'hover:[&_[data-close-button]]:!opacity-100',
  'focus-within:[&_[data-close-button]]:!opacity-100',
)

const markClass = 'grid size-7 shrink-0 place-items-center rounded-full'

function StatusMark({
  className,
  children,
}: {
  className: string
  children: React.ReactNode
}) {
  return (
    <span className={cn(markClass, className)}>
      {children}
    </span>
  )
}

const iconProps = { className: 'size-4', 'aria-hidden': true } as const

const TOAST_ICONS = {
  success: (
    <StatusMark className="bg-success/10 text-success-subtle-fg">
      <CheckCircleIcon {...iconProps} />
    </StatusMark>
  ),
  info: (
    <StatusMark className="bg-info/10 text-info-subtle-fg">
      <InformationCircleIcon {...iconProps} />
    </StatusMark>
  ),
  warning: (
    <StatusMark className="bg-warning/15 text-warning-subtle-fg">
      <ExclamationTriangleIcon {...iconProps} />
    </StatusMark>
  ),
  error: (
    <StatusMark className="bg-danger/10 text-danger-subtle-fg">
      <ExclamationCircleIcon {...iconProps} />
    </StatusMark>
  ),
  loading: (
    <StatusMark className="bg-muted text-muted-fg">
      <span className="size-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
    </StatusMark>
  ),
  close: <XMarkIcon className="size-3.5" aria-hidden />,
}

const ToastPrimitive = ({
  className,
  toastOptions,
  theme,
  icons,
  richColors = false,
  closeButton = true,
  gap = 10,
  offset = 16,
  style,
  slots: _slots,
  slotProps: _slotProps,
  ...props
}: ToastProps) => {
  const themeCtx = useThemeOptional()
  const resolvedTheme = theme ?? (themeCtx?.resolvedMode as ToasterProps['theme']) ?? 'system'

  return (
    <SonnerToaster
      theme={resolvedTheme}
      richColors={richColors}
      closeButton={closeButton}
      gap={gap}
      offset={offset}
      icons={{ ...TOAST_ICONS, ...icons }}
      className={cn('toaster group font-sans', className)}
      toastOptions={{
        ...toastOptions,
        className: cn(toastShellClass, toastOptions?.className),
        classNames: {
          ...toastOptions?.classNames,
          toast: cn(toastShellClass, toastOptions?.classNames?.toast),
          title: cn(
            '!text-[13px] !font-medium !leading-5 !tracking-[-0.011em] !text-fg',
            toastOptions?.classNames?.title,
          ),
          description: cn(
            '!text-xs !font-normal !leading-snug !text-muted-fg',
            toastOptions?.classNames?.description,
          ),
          content: cn('!min-w-0 !gap-0.5', toastOptions?.classNames?.content),
          icon: cn(
            '!m-0 !grid !size-7 !min-w-7 !place-items-center !bg-transparent',
            toastOptions?.classNames?.icon,
          ),
          actionButton: cn(
            '!ml-1 !h-7 !rounded-base !border-0 !bg-transparent !px-2 !text-xs !font-medium !text-fg !shadow-none hover:!bg-muted',
            toastOptions?.classNames?.actionButton,
          ),
          cancelButton: cn(
            '!h-7 !rounded-base !border-0 !bg-transparent !px-2 !text-xs !font-medium !text-muted-fg !shadow-none hover:!bg-muted hover:!text-fg',
            toastOptions?.classNames?.cancelButton,
          ),
          closeButton: cn(
            '!absolute !top-0 !right-0 !left-auto !z-10 !m-0 !flex !size-5 !transform-none !translate-x-1/3 !-translate-y-1/3 !items-center !justify-center !rounded-full !border !border-border !bg-overlay !p-0 !text-muted-fg !opacity-0 !shadow-sm !transition-opacity !duration-200',
            'rtl:!right-auto rtl:!left-0 rtl:!-translate-x-1/3',
            'hover:!bg-muted hover:!text-fg',
            'focus-visible:!opacity-100 focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-ring',
            toastOptions?.classNames?.closeButton,
          ),
        },
        style: {
          ...TOAST_SURFACE,
          ...toastOptions?.style,
        },
      }}
      style={{ ...TOAST_TOKENS, ...style }}
      {...props}
    />
  )
}

export const Toast = createInterfaceComponent<ToastProps, ToastSlots>(
  {
    name: 'Toast',
    category: 'feedback',
    description: 'Portal toast region with stacked notifications, swipe-to-dismiss, timeouts, and action buttons.',
    version: '1.0.0',
    props: {},
    slots: {

    },
  },
  ToastPrimitive
)

export const ToastProvider = Toast

Toast.Provider = ToastProvider
Toast.Queue = ToastQueue

export { toast }
