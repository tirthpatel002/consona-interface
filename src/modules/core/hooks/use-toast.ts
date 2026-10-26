import { useState, type ReactNode } from 'react'
import { toast as sonnerToast, type ExternalToast } from 'sonner'
import type { HeadlessHookReturn } from '../../../core/hooks'

export type ToastIntent = 'default' | 'success' | 'error' | 'warning' | 'info'

export interface ToastPayload {
  /** Primary toast title. */
  title: string
  /** Optional supporting description. */
  description?: string
  /** Semantic intent mapped onto Sonner rich colors. */
  intent?: ToastIntent
  /** Auto-dismiss timeout in milliseconds. */
  duration?: number
  /** Optional action button. */
  action?: { label: string; onClick: () => void }
  /** Additional Sonner options. */
  options?: ExternalToast
}

export interface UseToastOptions {
  /** Default auto-dismiss timeout in milliseconds. */
  duration?: number
}

export interface ToastState {
  /** Most recently enqueued toast id. */
  lastId: string | number | null
  /** Number of toasts enqueued during this hook lifetime. */
  count: number
}

export type ToastActions = {
  /** Enqueue a toast with an explicit payload. */
  show: (payload: ToastPayload) => string | number
  /** Enqueue a success toast. */
  success: (title: string, options?: Omit<ToastPayload, 'title' | 'intent'>) => string | number
  /** Enqueue an error toast. */
  error: (title: string, options?: Omit<ToastPayload, 'title' | 'intent'>) => string | number
  /** Enqueue a warning toast. */
  warning: (title: string, options?: Omit<ToastPayload, 'title' | 'intent'>) => string | number
  /** Enqueue an info toast. */
  info: (title: string, options?: Omit<ToastPayload, 'title' | 'intent'>) => string | number
  /** Dismiss one toast, or all when id is omitted. */
  dismiss: (id?: string | number) => void
  /** Dismiss every visible toast. */
  dismissAll: () => void
}

export interface ToastHelpers {
  /** Shared queue used by the portal. */
  queue: typeof ToastQueue
}

export interface ToastAriaProps {
  /** Live region role for status announcements. */
  role: 'status'
  /** Polite live region. */
  'aria-live': 'polite'
}

export type UseToastReturn = HeadlessHookReturn<
  ToastState,
  ToastActions,
  ToastHelpers,
  ToastAriaProps
>

function enqueue(payload: ToastPayload, defaultDuration?: number): string | number {
  const duration = payload.duration ?? defaultDuration
  const options: ExternalToast = {
    description: payload.description,
    duration,
    action: payload.action
      ? { label: payload.action.label, onClick: payload.action.onClick }
      : undefined,
    ...payload.options,
  }

  switch (payload.intent) {
    case 'success':
      return sonnerToast.success(payload.title, options)
    case 'error':
      return sonnerToast.error(payload.title, options)
    case 'warning':
      return sonnerToast.warning(payload.title, options)
    case 'info':
      return sonnerToast.info(payload.title, options)
    default:
      return sonnerToast(payload.title, options)
  }
}

export interface ToastPromiseResult<T> {
  unwrap: () => Promise<T>
}

export interface ToastPromiseOptions<T> {
  loading?: ReactNode
  success?: ReactNode | ((value: T) => ReactNode)
  error?: ReactNode | ((error: unknown) => ReactNode)
  description?: ReactNode
  finally?: () => void | Promise<void>
  duration?: number
  id?: string | number
}

function toastPromise<T>(
  promise: Promise<T> | (() => Promise<T>),
  options?: ToastPromiseOptions<T>
): ToastPromiseResult<T> {
  return sonnerToast.promise(promise, options as never) as unknown as ToastPromiseResult<T>
}

export const ToastQueue = {
  add: (payload: ToastPayload) => enqueue(payload),
  success: (title: string, options?: Omit<ToastPayload, 'title' | 'intent'>) =>
    enqueue({ title, intent: 'success', ...options }),
  error: (title: string, options?: Omit<ToastPayload, 'title' | 'intent'>) =>
    enqueue({ title, intent: 'error', ...options }),
  warning: (title: string, options?: Omit<ToastPayload, 'title' | 'intent'>) =>
    enqueue({ title, intent: 'warning', ...options }),
  info: (title: string, options?: Omit<ToastPayload, 'title' | 'intent'>) =>
    enqueue({ title, intent: 'info', ...options }),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  promise: toastPromise,
}

export function useToast(options: UseToastOptions = {}): UseToastReturn {
  const [lastId, setLastId] = useState<string | number | null>(null)
  const [count, setCount] = useState(0)

  const track = (id: string | number) => {
    setLastId(id)
    setCount((value) => value + 1)
    return id
  }

  return {
    state: { lastId, count },
    actions: {
      show: (payload) => track(enqueue(payload, options.duration)),
      success: (title, extra) => track(enqueue({ title, intent: 'success', ...extra }, options.duration)),
      error: (title, extra) => track(enqueue({ title, intent: 'error', ...extra }, options.duration)),
      warning: (title, extra) => track(enqueue({ title, intent: 'warning', ...extra }, options.duration)),
      info: (title, extra) => track(enqueue({ title, intent: 'info', ...extra }, options.duration)),
      dismiss: (id) => sonnerToast.dismiss(id),
      dismissAll: () => sonnerToast.dismiss(),
    },
    helpers: { queue: ToastQueue },
    ariaProps: {
      role: 'status',
      'aria-live': 'polite',
    },
  }
}
