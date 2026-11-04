import React, { useMemo, useState } from 'react'
import { CheckIcon, ClipboardDocumentIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useClipboard } from '../../../../hooks/use-clipboard'
import { Button, type ButtonProps } from '../button'
import { Tab, TabList, TabPanel, Tabs, type TabListProps, type TabPanelProps, type TabProps, type TabsProps } from '../tabs'

/* ==========================================================================
   Snippet Styles
   ========================================================================== */

export const snippetStyles = tv({
  base: 'group not-typeset overflow-hidden border border-border/70 bg-bg',
  variants: {
    variant: {
      inline: 'inline-flex max-w-full items-center gap-space-xs rounded-atom px-space-sm py-space-2xs align-middle',
      block: 'flex w-full flex-col rounded-base',
    },
  },
  defaultVariants: {
    variant: 'block',
  },
})

/* ==========================================================================
   Copy Button
   ========================================================================== */

export interface SnippetCopyButtonProps extends ButtonProps {
  /** Text copied to the clipboard. */
  value?: string
}

const SnippetCopyButtonPrimitive = ({ value = '', className, ...props }: SnippetCopyButtonProps) => {
  const { copy, copied } = useClipboard()
  return (
    <Button
      size="sq-xs"
      intent="outline"
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
      className={cn(
        'shrink-0 border-border/50 bg-transparent text-muted-fg shadow-none',
        'hover:bg-secondary/70 hover:text-fg hover:border-border',
        copied && 'border-success/30 text-success hover:text-success',
        className
      )}
      onPress={() => {
        if (value) void copy(value)
      }}
      {...props}
    >
      {copied ? (
        <CheckIcon data-slot="icon" className="size-3.5" strokeWidth={1.5} />
      ) : (
        <ClipboardDocumentIcon data-slot="icon" className="size-3.5" strokeWidth={1.5} />
      )}
      <span className="sr-only">{copied ? 'Copied' : 'Copy to clipboard'}</span>
    </Button>
  )
}

export const SnippetCopyButton = createInterfaceComponent<SnippetCopyButtonProps>(
  {
    name: 'SnippetCopyButton',
    category: 'feedback',
    description: 'Copy-to-clipboard control for snippet contents with a copied confirmation state.',
    version: '1.0.0',
  },
  SnippetCopyButtonPrimitive
)

/* ==========================================================================
   Highlight Slot
   ========================================================================== */

export interface SnippetHighlightProps extends React.HTMLAttributes<HTMLPreElement> {
  /** Source code to highlight. */
  code?: string
  /** Language hint for a syntax highlighter occupant. */
  language?: string
}

const SnippetHighlightPrimitive = ({ code, language, className, children, ...props }: SnippetHighlightProps) => (
  <pre
    data-slot="snippet-highlight"
    data-language={language}
    className={cn('font-mono text-xs/5 whitespace-pre overflow-x-auto', className)}
    {...props}
  >
    {children ?? code}
  </pre>
)

export const SnippetHighlight = createInterfaceComponent<SnippetHighlightProps>(
  {
    name: 'SnippetHighlight',
    category: 'feedback',
    description: 'Syntax highlighting slot for snippet source. Swap via slots.highlight for a highlighter.',
    version: '1.0.0',
  },
  SnippetHighlightPrimitive
)

/* ==========================================================================
   Snippet Root
   ========================================================================== */

export interface SnippetSlots {
  /** Copy control. */
  copy?: React.ComponentType<SnippetCopyButtonProps>
  /** Syntax highlighter occupying the code well. */
  highlight?: React.ComponentType<SnippetHighlightProps>
}

export interface SnippetProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onCopy'>,
    VariantProps<typeof snippetStyles> {
  /** Layout: compact inline chip or block well. */
  variant?: 'inline' | 'block'
  /** Source text used for copy and highlighting. */
  code?: string
  /** Language hint forwarded to the highlight slot. */
  language?: string
  /** Max visible lines before collapse (block only). */
  maxLines?: number
  /** Controlled collapsed state. */
  isCollapsed?: boolean
  /** Uncontrolled initial collapsed state. */
  defaultCollapsed?: boolean
  /** Called when collapse state changes. */
  onCollapsedChange?: (collapsed: boolean) => void
  /** Whether the copy button is shown. */
  showCopy?: boolean
  /** Optional DOM ref. */
  ref?: React.Ref<HTMLDivElement>
  /** Slot overrides. */
  slots?: SlotComponents<SnippetSlots>
  /** Props passed into injected slots. */
  slotProps?: SlotPropsMap<SnippetSlots>
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (!node) return ''
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (React.isValidElement(node)) {
    return extractText((node.props as { children?: React.ReactNode }).children)
  }
  return ''
}

const SnippetPrimitive = ({
  variant = 'block',
  code,
  language,
  maxLines,
  isCollapsed: collapsedProp,
  defaultCollapsed = true,
  onCollapsedChange,
  showCopy = true,
  className,
  slots,
  slotProps,
  children,
  ref,
  ...props
}: SnippetProps) => {
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed)
  const isCollapsed = collapsedProp ?? uncontrolledCollapsed
  const setCollapsed = (next: boolean) => {
    if (collapsedProp === undefined) setUncontrolledCollapsed(next)
    onCollapsedChange?.(next)
  }

  const source = useMemo(() => code ?? extractText(children), [code, children])
  const lineCount = source.split('\n').length
  const canCollapse = variant === 'block' && typeof maxLines === 'number' && lineCount > maxLines
  const clampedLines = canCollapse && isCollapsed ? maxLines : undefined

  return (
    <SnippetProvider value={{ code: source, slots, slotProps }}>
      <div
        ref={ref}
        data-slot="snippet"
        data-variant={variant}
        className={snippetStyles({ variant, className })}
        {...props}
      >
        <div
          className={cn(
            'flex min-w-0 items-start gap-space-sm',
            variant === 'block' && 'px-space-md py-space-sm',
            variant === 'inline' && 'w-full'
          )}
        >
          <div
            className={cn('min-w-0 flex-1', canCollapse && isCollapsed && 'overflow-hidden')}
            style={clampedLines ? { maxHeight: `calc(${clampedLines} * 1.25rem)` } : undefined}
          >
            {renderSlot(
              slots?.highlight,
              {
                code: source,
                language,
                children: children ?? code,
                ...(slotProps?.highlight as object),
              },
              { defaultComponent: SnippetHighlight }
            )}
          </div>
          {showCopy &&
            renderSlot(
              slots?.copy,
              { value: source, ...(slotProps?.copy as object) },
              { defaultComponent: SnippetCopyButton }
            )}
        </div>
        {canCollapse && (
          <button
            type="button"
            data-slot="snippet-collapse"
            className="flex w-full items-center justify-center gap-space-xs border-t border-border/60 bg-muted/40 px-space-md py-space-xs text-xs font-medium text-muted-fg hover:text-fg"
            onClick={() => setCollapsed(!isCollapsed)}
          >
            <ChevronDownIcon className={cn('size-3.5 transition-transform', !isCollapsed && 'rotate-180')} />
            {isCollapsed ? `Show ${lineCount - (maxLines ?? 0)} more lines` : 'Show less'}
          </button>
        )}
      </div>
    </SnippetProvider>
  )
}

import { createCompoundContext } from '../../../../core/context'

export interface SnippetContextValue {
  /** Source code */
  code?: string
  /** Injected slots configuration */
  slots?: SlotComponents<SnippetSlots>
  /** Injected slot props overrides */
  slotProps?: SlotPropsMap<SnippetSlots>
}

export const { Provider: SnippetProvider, useCompoundContext: useSnippetContext } =
  createCompoundContext<SnippetContextValue>('Snippet')

export const Snippet = createInterfaceComponent<SnippetProps, SnippetSlots>(
  {
    name: 'Snippet',
    category: 'feedback',
    description: 'Inline or block code snippet with copy-to-clipboard, highlight slot, and multi-line collapse.',
    version: '1.0.0',
    props: {
      variant: 'block',
      showCopy: true,
      defaultCollapsed: true,
    },
    slots: {
      copy: undefined,
      highlight: undefined,
    },
  },
  SnippetPrimitive
)

export const CodeSnippet = Snippet
export interface CodeSnippetProps extends SnippetProps {}

/* ==========================================================================
   Tabbed Snippet Family
   ========================================================================== */

const SnippetTabsPrimitive = ({ className, ...props }: TabsProps) => (
  <Tabs
    data-slot="snippet-tabs"
    className={cn('w-full gap-0 overflow-hidden rounded-base border border-border/70 bg-bg', className)}
    {...props}
  />
)

export const SnippetTabs = createInterfaceComponent<TabsProps>(
  {
    name: 'SnippetTabs',
    category: 'feedback',
    description: 'Tabbed snippet shell for multi-language or multi-file code examples.',
    version: '1.0.0',
  },
  SnippetTabsPrimitive
)

const SnippetTabListPrimitive = ({ className, ...props }: TabListProps<object>) => (
  <div className="w-full overflow-x-auto border-b border-border/70 bg-muted no-scrollbar">
    <TabList
      variant="underline"
      className={cn('min-w-full border-b-0 px-space-md', className)}
      {...props}
    />
  </div>
)

export const SnippetTabList = createInterfaceComponent<TabListProps<object>>(
  {
    name: 'SnippetTabList',
    category: 'feedback',
    description: 'Language or file tab list for a tabbed snippet.',
    version: '1.0.0',
  },
  SnippetTabListPrimitive
)

const SnippetTabPrimitive = ({ className, ...props }: TabProps) => (
  <Tab variant="underline" size="sm" className={cn('shrink-0 text-xs font-medium', className)} {...props} />
)

export const SnippetTab = createInterfaceComponent<TabProps>(
  {
    name: 'SnippetTab',
    category: 'feedback',
    description: 'Individual language or file tab inside a snippet.',
    version: '1.0.0',
  },
  SnippetTabPrimitive
)

export interface SnippetTabPanelExtendedProps extends TabPanelProps {
  /** Source copied by the panel copy button. */
  code?: string
}

const SnippetTabPanelPrimitive = ({ className, children, code, ...props }: SnippetTabPanelExtendedProps) => {
  const source = code ?? (typeof children === 'string' ? children : extractText(children as React.ReactNode))
  return (
    <TabPanel className={cn('mt-0 px-space-md py-space-sm text-sm dark:bg-secondary/70', className)} {...props}>
      {(values) => (
        <div className="flex items-start justify-between gap-space-md">
          <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre py-space-2xs font-mono text-xs/5">
            {typeof children === 'function' ? children(values) : children}
          </pre>
          <SnippetCopyButton value={source} className="-me-space-xs mt-space-2xs" />
        </div>
      )}
    </TabPanel>
  )
}

export const SnippetTabPanel = createInterfaceComponent<SnippetTabPanelExtendedProps>(
  {
    name: 'SnippetTabPanel',
    category: 'feedback',
    description: 'Snippet tab panel with an inline copy control.',
    version: '1.0.0',
  },
  SnippetTabPanelPrimitive
)

Snippet.Copy = SnippetCopyButton
Snippet.Highlight = SnippetHighlight
Snippet.Tabs = SnippetTabs
Snippet.List = SnippetTabList
Snippet.Tab = SnippetTab
Snippet.Panel = SnippetTabPanel
Snippet.Code = CodeSnippet
