import { useControllableState, type HeadlessHookReturn } from '../../../core/hooks'

export interface UseDisclosureOptions {
  /** Controlled open state. */
  open?: boolean
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void
}

export interface DisclosureState {
  /** Whether the disclosure surface is open. */
  isOpen: boolean
}

export type DisclosureActions = {
  /** Open the disclosure. */
  open: () => void
  /** Close the disclosure. */
  close: () => void
  /** Toggle open/closed. */
  toggle: () => void
  /** Set open state explicitly. */
  setOpen: (open: boolean) => void
}

export interface DisclosureHelpers {
  /** Inverse of isOpen. */
  isClosed: boolean
}

export interface DisclosureAriaProps {
  /** Expanded state for the trigger. */
  'aria-expanded': boolean
}

export type UseDisclosureReturn = HeadlessHookReturn<
  DisclosureState,
  DisclosureActions,
  DisclosureHelpers,
  DisclosureAriaProps
>

export function useDisclosure(options: UseDisclosureOptions = {}): UseDisclosureReturn {
  const [isOpen, setOpen] = useControllableState<boolean>({
    prop: options.open,
    defaultProp: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
  })

  return {
    state: { isOpen },
    actions: {
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen(!isOpen),
      setOpen,
    },
    helpers: { isClosed: !isOpen },
    ariaProps: { 'aria-expanded': isOpen },
  }
}
