import * as React from 'react'
import {
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  Bars3BottomLeftIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createCompoundContext } from '../../../../core/context'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import {
  ComparePane,
  ComparePaneFirst,
  ComparePaneSecond,
  ComparePaneHandle,
  type ComparePaneProps,
} from '../compare-pane'

/* ==========================================================================
   Diff Types & Diff Computation
   ========================================================================== */

export type DiffViewMode = 'unified' | 'split'

export interface DiffLine {
  /** Line change category. */
  type: 'added' | 'deleted' | 'unchanged' | 'header'
  /** Raw line text content. */
  content: string
  /** Original line number before modification. */
  oldLineNumber?: number
  /** Resulting line number after modification. */
  newLineNumber?: number
}

/**
 * Lightweight diff computation generating line additions, deletions, and stats.
 */
export function computeLineDiff(oldText: string = '', newText: string = ''): {
  lines: DiffLine[]
  addedCount: number
  deletedCount: number
} {
  const safeOldText = typeof oldText === 'string' ? oldText : String(oldText ?? '')
  const safeNewText = typeof newText === 'string' ? newText : String(newText ?? '')
  const oldLines = safeOldText.split('\n')
  const newLines = safeNewText.split('\n')
  const lines: DiffLine[] = []
  let addedCount = 0
  let deletedCount = 0

  let oldIdx = 0
  let newIdx = 0
  let oldLineNum = 1
  let newLineNum = 1

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx < oldLines.length && newIdx < newLines.length) {
      if (oldLines[oldIdx] === newLines[newIdx]) {
        lines.push({
          type: 'unchanged',
          content: oldLines[oldIdx]!,
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
        })
        oldIdx++
        newIdx++
      } else {
        const matchInNew = newLines.indexOf(oldLines[oldIdx]!, newIdx)
        const matchInOld = oldLines.indexOf(newLines[newIdx]!, oldIdx)

        if (matchInNew !== -1 && (matchInOld === -1 || matchInNew - newIdx <= matchInOld - oldIdx)) {
          while (newIdx < matchInNew) {
            lines.push({
              type: 'added',
              content: newLines[newIdx]!,
              newLineNumber: newLineNum++,
            })
            newIdx++
            addedCount++
          }
        } else if (matchInOld !== -1) {
          while (oldIdx < matchInOld) {
            lines.push({
              type: 'deleted',
              content: oldLines[oldIdx]!,
              oldLineNumber: oldLineNum++,
            })
            oldIdx++
            deletedCount++
          }
        } else {
          lines.push({
            type: 'deleted',
            content: oldLines[oldIdx]!,
            oldLineNumber: oldLineNum++,
          })
          oldIdx++
          deletedCount++

          lines.push({
            type: 'added',
            content: newLines[newIdx]!,
            newLineNumber: newLineNum++,
          })
          newIdx++
          addedCount++
        }
      }
    } else if (oldIdx < oldLines.length) {
      lines.push({
        type: 'deleted',
        content: oldLines[oldIdx]!,
        oldLineNumber: oldLineNum++,
      })
      oldIdx++
      deletedCount++
    } else if (newIdx < newLines.length) {
      lines.push({
        type: 'added',
        content: newLines[newIdx]!,
        newLineNumber: newLineNum++,
      })
      newIdx++
      addedCount++
    }
  }

  return { lines, addedCount, deletedCount }
}

/* ==========================================================================
   DiffViewer Slots & Props
   ========================================================================== */

export interface DiffViewerSlots {
  /** Custom comparison slider component when running in split mode. */
  splitPane?: React.ComponentType<ComparePaneProps>
  /** Copy action button slot. */
  copyButton?: React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>
}

export interface DiffViewerContextValue {
  /** Current active comparison view mode ('unified' or 'split'). */
  mode: DiffViewMode
  /** Set active view mode. */
  setMode: (mode: DiffViewMode) => void
  /** Computed diff lines. */
  lines: DiffLine[]
  /** Number of added lines. */
  addedCount: number
  /** Number of deleted lines. */
  deletedCount: number
  /** Whether the diff has just been copied to clipboard. */
  copied: boolean
  /** Trigger copy to clipboard. */
  handleCopy: () => void
  /** File name or descriptor displayed in header bar. */
  filename?: string
  /** Whether to show the unified vs split mode switcher. */
  showModeSwitch?: boolean
  /** Whether line numbers are rendered in the gutters. */
  showLineNumbers?: boolean
  /** Whether addition and deletion count badges are displayed. */
  showStats?: boolean
  /** Whether copying to clipboard is enabled. */
  copyable?: boolean
  /** Parsed maximum container height. */
  parsedHeight?: string | number
  /** Original lines array. */
  oldLinesArray: string[]
  /** Modified lines array. */
  newLinesArray: string[]
  /** First pane scroll ref for synchronization. */
  firstPaneRef: React.RefObject<HTMLDivElement | null>
  /** Second pane scroll ref for synchronization. */
  secondPaneRef: React.RefObject<HTMLDivElement | null>
  /** Scroll synchronization handler for first pane. */
  handleFirstScroll: () => void
  /** Scroll synchronization handler for second pane. */
  handleSecondScroll: () => void
  /** Slot overrides. */
  slots?: SlotComponents<DiffViewerSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<DiffViewerSlots>
}

export const { Provider: DiffViewerProvider, useCompoundContext: useDiffViewerContext } =
  createCompoundContext<DiffViewerContextValue>('DiffViewer')

export interface DiffViewerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Old / original source text. */
  oldValue?: string
  /** New / modified source text. */
  newValue?: string
  /** Precomputed raw unified diff text (optional alternate input format). */
  rawDiff?: string
  /** File name or descriptor displayed in header bar (e.g. "auth-service.ts"). */
  filename?: string
  /** Active view mode: 'unified' (inline) or 'split' (draggable slider via ComparePane). */
  viewMode?: DiffViewMode
  /** Default view mode when uncontrolled. Default is 'unified'. */
  defaultViewMode?: DiffViewMode
  /** Whether to show the unified vs split mode switcher in header. Default is true. */
  showModeSwitch?: boolean
  /** Whether line numbers are rendered in the left gutters. Default is true. */
  showLineNumbers?: boolean
  /** Whether addition and deletion count badges are displayed. Default is true. */
  showStats?: boolean
  /** Whether the copy to clipboard button is enabled. Default is true. */
  copyable?: boolean
  /** Maximum scroll container height. Default is 450. */
  maxHeight?: number | string
  /** Custom children for composite compound composition. */
  children?: React.ReactNode
  /** Slot overrides. */
  slots?: SlotComponents<DiffViewerSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<DiffViewerSlots>
}

/* ==========================================================================
   Compound Subcomponents
   ========================================================================== */

export interface DiffViewerCopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const DiffViewerCopyButtonPrimitive = ({ className, ...props }: DiffViewerCopyButtonProps) => {
  const { copied, handleCopy } = useDiffViewerContext()
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy diff"
      title={copied ? 'Copied to clipboard' : 'Copy diff to clipboard'}
      className={cn(
        'inline-flex items-center justify-center size-8 rounded-base border border-border/60 bg-muted/40 hover:bg-muted text-muted-fg hover:text-fg transition-colors cursor-pointer shrink-0',
        className
      )}
      {...props}
    >
      {copied ? (
        <ClipboardDocumentCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <ClipboardDocumentIcon className="size-4" />
      )}
    </button>
  )
}

export const DiffViewerCopyButton = createInterfaceComponent<DiffViewerCopyButtonProps>(
  {
    name: 'DiffViewerCopyButton',
    category: 'data',
    description: 'Copy button control for diff viewer with copied state confirmation.',
    version: '1.0.0',
  },
  DiffViewerCopyButtonPrimitive
)

export interface DiffViewerToolbarSlots {
  /** Copy button slot */
  copyButton?: React.ComponentType<DiffViewerCopyButtonProps>
}

export interface DiffViewerToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slot overrides map. */
  slots?: SlotComponents<DiffViewerToolbarSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<DiffViewerToolbarSlots>
  /** Whether to show the mode switch button. */
  showModeSwitch?: boolean
  /** Whether copy to clipboard is enabled. */
  copyable?: boolean
}

const DiffViewerToolbarPrimitive = ({
  className,
  children,
  slots: directSlots,
  slotProps: directSlotProps,
  showModeSwitch: propShowModeSwitch,
  copyable: propCopyable,
  ...props
}: DiffViewerToolbarProps) => {
  const {
    mode,
    setMode,
    showModeSwitch: ctxShowModeSwitch,
    copyable: ctxCopyable,
    slots: ctxSlots,
    slotProps: ctxSlotProps,
  } = useDiffViewerContext()
  const showModeSwitch = propShowModeSwitch ?? ctxShowModeSwitch
  const copyable = propCopyable ?? ctxCopyable
  const copyButtonSlot = directSlots?.copyButton ?? ctxSlots?.copyButton
  const copyButtonProps = { ...ctxSlotProps?.copyButton, ...directSlotProps?.copyButton }

  return (
    <div className={cn('flex items-center gap-space-sm', className)} {...props}>
      {children ?? (
        <>
          {showModeSwitch && (
            <div className="flex items-center rounded-base border border-border/60 bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setMode('unified')}
                className={cn(
                  'flex items-center gap-1.5 rounded-micro px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                  mode === 'unified'
                    ? 'bg-primary text-primary-fg shadow-2xs font-semibold'
                    : 'text-muted-fg hover:text-fg'
                )}
                aria-label="Unified view"
              >
                <Bars3BottomLeftIcon className="size-3.5" />
                <span>Unified</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('split')}
                className={cn(
                  'flex items-center gap-1.5 rounded-micro px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                  mode === 'split'
                    ? 'bg-primary text-primary-fg shadow-2xs font-semibold'
                    : 'text-muted-fg hover:text-fg'
                )}
                aria-label="Split comparison view"
              >
                <AdjustmentsHorizontalIcon className="size-3.5" />
                <span>Split</span>
              </button>
            </div>
          )}

          {copyable &&
            renderSlot(copyButtonSlot, copyButtonProps, {
              defaultComponent: DiffViewerCopyButton,
            })}
        </>
      )}
    </div>
  )
}

export const DiffViewerToolbar = createInterfaceComponent<DiffViewerToolbarProps, DiffViewerToolbarSlots>(
  {
    name: 'DiffViewerToolbar',
    category: 'data',
    description: 'Toolbar containing view mode toggle and copy buttons.',
    version: '1.0.0',
    slots: {
      copyButton: DiffViewerCopyButton,
    },
  },
  DiffViewerToolbarPrimitive
)

export interface DiffViewerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** File name or descriptor displayed in header bar. */
  filename?: string
  /** Whether addition and deletion count badges are displayed. */
  showStats?: boolean
}

const DiffViewerHeaderPrimitive = ({
  className,
  children,
  filename: propFilename,
  showStats: propShowStats,
  ...props
}: DiffViewerHeaderProps) => {
  const {
    filename: ctxFilename,
    showStats: ctxShowStats,
    addedCount,
    deletedCount,
  } = useDiffViewerContext()
  const filename = propFilename ?? ctxFilename
  const showStats = propShowStats ?? ctxShowStats

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3.5 py-2.5 bg-muted/30 border-b border-border/60 select-none',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <div className="flex items-center gap-space-sm min-w-0">
            {filename && (
              <span className="font-mono text-xs font-semibold text-fg truncate">
                {filename}
              </span>
            )}
            {showStats && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-micro bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  +{addedCount}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-micro bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold">
                  -{deletedCount}
                </span>
              </div>
            )}
          </div>
          <DiffViewerToolbar />
        </>
      )}
    </div>
  )
}

export const DiffViewerHeader = createInterfaceComponent<DiffViewerHeaderProps>(
  {
    name: 'DiffViewerHeader',
    category: 'data',
    description: 'Header container displaying diff filename, additions, deletions, and controls.',
    version: '1.0.0',
  },
  DiffViewerHeaderPrimitive
)

export interface DiffViewerUnifiedProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum container height. */
  maxHeight?: number | string
  /** Whether line numbers are rendered in the gutters. */
  showLineNumbers?: boolean
}

const DiffViewerUnifiedPrimitive = ({
  className,
  maxHeight: _maxHeight,
  showLineNumbers: propShowLineNumbers,
  ...props
}: DiffViewerUnifiedProps) => {
  const { lines, showLineNumbers: ctxShowLineNumbers, parsedHeight } = useDiffViewerContext()
  const showLineNumbers = propShowLineNumbers ?? ctxShowLineNumbers

  return (
    <div
      style={{ maxHeight: parsedHeight }}
      className={cn('overflow-auto bg-bg overscroll-contain', className)}
      {...props}
    >
      <div className="flex flex-col py-1 font-mono text-xs leading-6 min-w-full w-max">
        {lines.map((line: DiffLine, idx: number) => {
          const isAdd = line.type === 'added'
          const isDel = line.type === 'deleted'
          const isHeader = line.type === 'header'

          return (
            <div
              key={idx}
              className={cn(
                'flex items-center px-2 py-0.5 transition-colors border-l-2 w-full min-w-full',
                isAdd &&
                  'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-medium border-emerald-500',
                isDel &&
                  'bg-rose-500/15 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300 font-medium border-rose-500',
                isHeader &&
                  'bg-sky-500/15 dark:bg-sky-500/25 text-sky-800 dark:text-sky-300 font-semibold border-sky-500',
                !isAdd && !isDel && !isHeader && 'text-fg/85 border-transparent hover:bg-muted/20'
              )}
            >
              {showLineNumbers && (
                <div className="flex items-center shrink-0 select-none text-[10px]">
                  <span
                    className={cn(
                      'w-8 text-right pr-1 font-mono',
                      isDel ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-muted-fg/60'
                    )}
                  >
                    {line.oldLineNumber ?? ''}
                  </span>
                  <span
                    className={cn(
                      'w-8 text-right pr-2 font-mono',
                      isAdd ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-fg/60'
                    )}
                  >
                    {line.newLineNumber ?? ''}
                  </span>
                </div>
              )}
              <span
                className={cn(
                  'w-4 shrink-0 text-center font-bold select-none text-xs',
                  isAdd && 'text-emerald-600 dark:text-emerald-400',
                  isDel && 'text-rose-600 dark:text-rose-400',
                  isHeader && 'text-sky-600 dark:text-sky-400',
                  !isAdd && !isDel && !isHeader && 'text-transparent'
                )}
              >
                {isAdd ? '+' : isDel ? '-' : isHeader ? '@' : ' '}
              </span>
              <span className="whitespace-pre font-mono flex-1">{line.content}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const DiffViewerUnified = createInterfaceComponent<DiffViewerUnifiedProps>(
  {
    name: 'DiffViewerUnified',
    category: 'data',
    description: 'Unified inline view with additions, deletions, and gutter line numbers.',
    version: '1.0.0',
  },
  DiffViewerUnifiedPrimitive
)

export interface DiffViewerSplitSlots {
  /** Comparison pane slot */
  splitPane?: React.ComponentType<ComparePaneProps>
}

export interface DiffViewerSplitProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slot overrides map. */
  slots?: SlotComponents<DiffViewerSplitSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<DiffViewerSplitSlots>
  /** Maximum container height. */
  maxHeight?: number | string
  /** Whether line numbers are rendered in the gutters. */
  showLineNumbers?: boolean
}

const DiffViewerSplitPrimitive = ({
  className,
  slots: directSlots,
  slotProps: directSlotProps,
  maxHeight: _maxHeight,
  showLineNumbers: propShowLineNumbers,
  ...props
}: DiffViewerSplitProps) => {
  const {
    parsedHeight,
    oldLinesArray,
    newLinesArray,
    showLineNumbers: ctxShowLineNumbers,
    firstPaneRef,
    secondPaneRef,
    handleFirstScroll,
    handleSecondScroll,
    slots: ctxSlots,
    slotProps: ctxSlotProps,
  } = useDiffViewerContext()

  const showLineNumbers = propShowLineNumbers ?? ctxShowLineNumbers

  const splitPaneSlot = directSlots?.splitPane ?? ctxSlots?.splitPane
  const splitPaneProps = { ...ctxSlotProps?.splitPane, ...directSlotProps?.splitPane }

  const defaultContent = (
    <ComparePane
      orientation="horizontal"
      defaultPosition={50}
      className="size-full rounded-base border border-border/60 bg-bg font-mono text-xs overflow-hidden"
      {...splitPaneProps}
    >
      {/* Left Side: Original (Before) */}
      <ComparePaneFirst className="bg-bg text-fg select-text">
        <div
          ref={firstPaneRef}
          onScroll={handleFirstScroll}
          className="size-full overflow-auto p-3 overscroll-contain bg-rose-500/[0.03] dark:bg-rose-950/[0.15]"
        >
          <div className="flex flex-col font-mono text-xs leading-6 min-w-full w-max">
            {oldLinesArray.map((line: string, idx: number) => (
              <div
                key={idx}
                className="flex items-center px-1 rounded-atom hover:bg-rose-500/10 text-rose-900 dark:text-rose-200 w-full min-w-full"
              >
                {showLineNumbers && (
                  <span className="w-9 shrink-0 text-right pr-3 text-rose-600 dark:text-rose-400 font-semibold select-none text-[11px]">
                    {idx + 1}
                  </span>
                )}
                <span className="whitespace-pre font-mono">{line}</span>
              </div>
            ))}
          </div>
        </div>
      </ComparePaneFirst>

      {/* Right Side: Modified (After) */}
      <ComparePaneSecond className="bg-bg text-fg select-text">
        <div
          ref={secondPaneRef}
          onScroll={handleSecondScroll}
          className="size-full overflow-auto p-3 overscroll-contain bg-emerald-500/[0.03] dark:bg-emerald-950/[0.15]"
        >
          <div className="flex flex-col font-mono text-xs leading-6 min-w-full w-max">
            {newLinesArray.map((line: string, idx: number) => (
              <div
                key={idx}
                className="flex items-center px-1 rounded-atom hover:bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 w-full min-w-full"
              >
                {showLineNumbers && (
                  <span className="w-9 shrink-0 text-right pr-3 text-emerald-600 dark:text-emerald-400 font-semibold select-none text-[11px]">
                    {idx + 1}
                  </span>
                )}
                <span className="whitespace-pre font-mono">{line}</span>
              </div>
            ))}
          </div>
        </div>
      </ComparePaneSecond>

      <ComparePaneHandle />
    </ComparePane>
  )

  return (
    <div
      className={cn('relative p-2.5 bg-muted/10', className)}
      style={{ height: parsedHeight }}
      {...props}
    >
      {splitPaneSlot && splitPaneSlot !== ComparePane ? renderSlot(splitPaneSlot, splitPaneProps) : defaultContent}
    </div>
  )
}

export const DiffViewerSplit = createInterfaceComponent<DiffViewerSplitProps, DiffViewerSplitSlots>(
  {
    name: 'DiffViewerSplit',
    category: 'data',
    description: 'Draggable split comparison view with synchronized dual-pane scrolling.',
    version: '1.0.0',
    slots: {
      splitPane: undefined,
    },
  },
  DiffViewerSplitPrimitive
)

export interface DiffViewerContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const DiffViewerContentPrimitive = ({ className, children, ...props }: DiffViewerContentProps) => {
  const { mode } = useDiffViewerContext()

  return (
    <div className={cn('relative w-full', className)} {...props}>
      {children ?? (mode === 'split' ? <DiffViewerSplit /> : <DiffViewerUnified />)}
    </div>
  )
}

export const DiffViewerContent = createInterfaceComponent<DiffViewerContentProps>(
  {
    name: 'DiffViewerContent',
    category: 'data',
    description: 'Dynamic content body resolving split or unified views.',
    version: '1.0.0',
  },
  DiffViewerContentPrimitive
)

/* ==========================================================================
   DiffViewer Root Primitive
   ========================================================================== */

const DiffViewerPrimitive = ({
  oldValue = '',
  newValue = '',
  rawDiff,
  filename,
  viewMode: controlledMode,
  defaultViewMode = 'unified',
  showModeSwitch = true,
  showLineNumbers = true,
  showStats = true,
  copyable = true,
  maxHeight = 450,
  slots = {},
  slotProps = {},
  className,
  children,
  ...props
}: DiffViewerProps) => {
  const [internalMode, setInternalMode] = React.useState<DiffViewMode>(
    controlledMode ?? defaultViewMode
  )
  const mode = controlledMode ?? internalMode
  const [copied, setCopied] = React.useState(false)

  // Synchronized scrolling refs for ComparePane in split (slider) mode
  const firstPaneRef = React.useRef<HTMLDivElement | null>(null)
  const secondPaneRef = React.useRef<HTMLDivElement | null>(null)
  const isSyncingScroll = React.useRef(false)

  const handleFirstScroll = () => {
    if (isSyncingScroll.current) return
    isSyncingScroll.current = true
    if (firstPaneRef.current && secondPaneRef.current) {
      secondPaneRef.current.scrollTop = firstPaneRef.current.scrollTop
      secondPaneRef.current.scrollLeft = firstPaneRef.current.scrollLeft
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false
    })
  }

  const handleSecondScroll = () => {
    if (isSyncingScroll.current) return
    isSyncingScroll.current = true
    if (firstPaneRef.current && secondPaneRef.current) {
      secondPaneRef.current.scrollTop = secondPaneRef.current.scrollTop
      secondPaneRef.current.scrollLeft = secondPaneRef.current.scrollLeft
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false
    })
  }

  const { lines, addedCount, deletedCount } = React.useMemo(() => {
    if (rawDiff) {
      const rawLines = rawDiff.split('\n')
      let add = 0
      let del = 0
      const parsed: DiffLine[] = rawLines.map((l) => {
        if (l.startsWith('+') && !l.startsWith('+++')) {
          add++
          return { type: 'added', content: l.substring(1) }
        }
        if (l.startsWith('-') && !l.startsWith('---')) {
          del++
          return { type: 'deleted', content: l.substring(1) }
        }
        if (l.startsWith('@@')) {
          return { type: 'header', content: l }
        }
        return { type: 'unchanged', content: l.startsWith(' ') ? l.substring(1) : l }
      })
      return { lines: parsed, addedCount: add, deletedCount: del }
    }
    return computeLineDiff(oldValue, newValue)
  }, [oldValue, newValue, rawDiff])

  const handleCopy = () => {
    const textToCopy = newValue || rawDiff || lines.map((l) => l.content).join('\n')
    navigator.clipboard?.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const oldLinesArray = React.useMemo(() => oldValue.split('\n'), [oldValue])
  const newLinesArray = React.useMemo(() => newValue.split('\n'), [newValue])
  const parsedHeight = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight

  const contextValue = React.useMemo<DiffViewerContextValue>(
    () => ({
      mode,
      setMode: setInternalMode,
      lines,
      addedCount,
      deletedCount,
      copied,
      handleCopy,
      filename,
      showModeSwitch,
      showLineNumbers,
      showStats,
      copyable,
      parsedHeight,
      oldLinesArray,
      newLinesArray,
      firstPaneRef,
      secondPaneRef,
      handleFirstScroll,
      handleSecondScroll,
      slots,
      slotProps,
    }),
    [
      mode,
      lines,
      addedCount,
      deletedCount,
      copied,
      filename,
      showModeSwitch,
      showLineNumbers,
      showStats,
      copyable,
      parsedHeight,
      oldLinesArray,
      newLinesArray,
      slots,
      slotProps,
    ]
  )

  return (
    <DiffViewerProvider value={contextValue}>
      <div
        data-slot="diff-viewer"
        className={cn(
          'w-full flex flex-col rounded-base border border-border/70 bg-bg overflow-hidden shadow-xs text-fg',
          className
        )}
        {...props}
      >
        {children != null ? (
          children
        ) : (
          <>
            <DiffViewerHeader />
            <DiffViewerContent />
          </>
        )}
      </div>
    </DiffViewerProvider>
  )
}

/* ==========================================================================
   Main Component Factory
   ========================================================================== */

export const DiffViewer = createInterfaceComponent<DiffViewerProps, DiffViewerSlots>(
  {
    name: 'DiffViewer',
    category: 'data',
    description:
      'Side-by-side or unified code diff viewer with live addition/deletion metrics and draggable comparison split.',
    version: '1.0.0',
    props: {
      defaultViewMode: 'unified',
      showModeSwitch: true,
      showLineNumbers: true,
      showStats: true,
      copyable: true,
      maxHeight: 450,
    },
    slots: {
      splitPane: undefined,
      copyButton: DiffViewerCopyButton,
    },
  },
  DiffViewerPrimitive
)

DiffViewer.Header = DiffViewerHeader
DiffViewer.Toolbar = DiffViewerToolbar
DiffViewer.Content = DiffViewerContent
DiffViewer.Unified = DiffViewerUnified
DiffViewer.Split = DiffViewerSplit
DiffViewer.Copy = DiffViewerCopyButton
