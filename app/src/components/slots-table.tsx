import React, { useMemo, useState } from 'react'
import type { ComponentDoc, ComponentPropDoc, ComponentSlotDoc } from '@registry/types'
import { ChevronDown, ChevronsRight, Sparkles } from 'lucide-react'
import { cn } from '@consona/interface'
import { getComponentDoc, inferResolvedSlotTarget, registry } from '../registry/registry-client'
import { TypeDisplay } from './type-display'

export interface SlotsTableProps {
  slotsDoc?: Record<string, ComponentSlotDoc>
  onOpenComponent?: (name: string) => void
}

interface SlotTreeNode {
  path: string
  name: string
  slot: ComponentSlotDoc
  target?: ComponentDoc
  payload: Record<string, ComponentPropDoc>
  children: SlotTreeNode[]
}

const MAX_DEPTH = 12

function buildSlotTree(
  slots: Record<string, ComponentSlotDoc>,
  pathPrefix: string,
  depth: number,
  visited: Set<string>
): SlotTreeNode[] {
  return Object.entries(slots).map(([name, slot]) => {
    const targetName = inferResolvedSlotTarget({ ...slot, name }, registry)
    const target = targetName ? getComponentDoc(targetName) : undefined
    const payload = {
      ...(target?.props ?? {}),
      ...(slot.props ?? {}),
    }
    const visitKey = target?.name || `${pathPrefix}.${name}`
    const canDescend = Boolean(target && depth < MAX_DEPTH && !visited.has(visitKey) && Object.keys(target.slots).length > 0)
    const nextVisited = new Set(visited)
    if (target) nextVisited.add(target.name)

    return {
      path: pathPrefix ? `${pathPrefix}.${name}` : name,
      name,
      slot,
      target,
      payload,
      children: canDescend && target
        ? buildSlotTree(target.slots, pathPrefix ? `${pathPrefix}.${name}` : name, depth + 1, nextVisited)
        : [],
    }
  })
}

function PayloadList({ payload }: { payload: Record<string, ComponentPropDoc> }) {
  return (
    <div className="grid grid-cols-1 gap-1 font-mono text-[11px]">
      {Object.entries(payload).map(([propName, propDoc]) => (
        <div
          key={propName}
          className="flex items-start justify-between gap-2 px-2.5 py-1 rounded-micro bg-bg/80 border border-border/40"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-fg break-all">{propName}</span>
            {!propDoc.optional && (
              <span className="text-danger text-[10px]" title="Required">*</span>
            )}
          </div>
          <div className="text-[10px] text-muted-fg px-1.5 py-0.2 rounded-atom bg-muted/50 border border-border/40 text-right shrink-0 max-w-[55%] break-words">
            <TypeDisplay typeString={propDoc.type} />
          </div>
        </div>
      ))}
    </div>
  )
}

function SlotTreeRow({
  node,
  depth,
  onOpenComponent,
}: {
  node: SlotTreeNode
  depth: number
  onOpenComponent?: (name: string) => void
}) {
  const [open, setOpen] = useState(depth === 0)
  const [payloadOpen, setPayloadOpen] = useState(depth === 0)
  const hasChildren = node.children.length > 0
  const hasPayload = Object.keys(node.payload).length > 0
  const nestedNames = node.children.map((child) => child.name)

  return (
    <div className={cn(depth > 0 && 'ml-4 pl-3 border-l border-border/60')}>
      <div className="rounded-base border border-border/70 bg-overlay/30 backdrop-blur-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="w-full px-3 py-2.5 flex items-start gap-2 text-left hover:bg-muted/30 transition-colors"
        >
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 mt-0.5 text-muted-fg shrink-0 transition-transform duration-200',
              open ? 'rotate-0' : '-rotate-90'
            )}
          />
          <Sparkles className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-semibold text-xs text-fg">{node.name}</span>
              {node.slot.optional && (
                <span className="text-[10px] font-mono text-muted-fg">optional</span>
              )}
              {hasChildren && (
                <span className="text-[10px] font-mono text-muted-fg">
                  {node.children.length} nested
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-fg leading-relaxed">
              {node.slot.description || `Injectable sub-component slot for ${node.name}.`}
            </p>
          </div>
        </button>

        {open && (
          <div className="px-3 pb-3 space-y-2.5">
            <div className="font-mono text-[11px] px-2 py-1 rounded-micro bg-secondary/80 border border-border/60 text-fg break-words">
              <TypeDisplay typeString={node.slot.type} />
            </div>

            {node.target && (
              <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                <span className="text-muted-fg uppercase tracking-wider font-semibold">Resolves to</span>
                {onOpenComponent ? (
                  <button
                    type="button"
                    onClick={() => onOpenComponent(node.target!.name)}
                    className="px-1.5 py-0.5 rounded-atom bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {node.target.name}
                  </button>
                ) : (
                  <span className="text-primary">{node.target.name}</span>
                )}
                {nestedNames.length > 0 && (
                  <span className="text-muted-fg">→ {nestedNames.join(', ')}</span>
                )}
              </div>
            )}

            {node.slot.variants && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-muted-fg uppercase font-mono tracking-wider font-semibold">Variants</span>
                {node.slot.variants.map((variant) => (
                  <span
                    key={variant}
                    className="px-1.5 py-0.2 rounded-atom bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono"
                  >
                    {variant}
                  </span>
                ))}
              </div>
            )}

            {node.slot.stateType && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-fg font-mono">
                <span className="font-semibold uppercase tracking-wider">State</span>
                <TypeDisplay typeString={node.slot.stateType} />
              </div>
            )}

            {hasPayload && (
              <div className="rounded-base border border-border/60 bg-muted/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPayloadOpen((value) => !value)}
                  className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono font-semibold text-muted-fg hover:text-fg transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Slot payload ({Object.keys(node.payload).length})</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200',
                      payloadOpen ? 'rotate-180' : 'rotate-0'
                    )}
                  />
                </button>
                {payloadOpen && (
                  <div className="px-2.5 pb-2.5">
                    <PayloadList payload={node.payload} />
                  </div>
                )}
              </div>
            )}

            {hasChildren && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-fg">
                  <ChevronsRight className="w-3 h-3" />
                  <span>Nested slots</span>
                </div>
                <div className="space-y-2">
                  {node.children.map((child) => (
                    <SlotTreeRow
                      key={child.path}
                      node={child}
                      depth={depth + 1}
                      onOpenComponent={onOpenComponent}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export const SlotsTable: React.FC<SlotsTableProps> = ({ slotsDoc, onOpenComponent }) => {
  const tree = useMemo(
    () => (slotsDoc ? buildSlotTree(slotsDoc, '', 0, new Set()) : []),
    [slotsDoc]
  )

  if (tree.length === 0) {
    return (
      <div className="p-4 rounded-base border border-border/60 bg-muted/20 text-muted-fg text-xs italic">
        This component does not define customizable internal sub-component slots.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tree.map((node) => (
        <SlotTreeRow
          key={node.path}
          node={node}
          depth={0}
          onOpenComponent={onOpenComponent}
        />
      ))}
    </div>
  )
}
