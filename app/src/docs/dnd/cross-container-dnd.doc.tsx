import React, { useState, useMemo, useCallback } from 'react'
import {
  DndProvider,
  DndBoard,
  SortableList,
  SortableGrid,
  Droppable,
  Draggable,
  DraggableHandle,
  DragOverlay,
  reorderWithLexoRank,
  Badge,
  Button,
  toast,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  Video,
  Music,
  Image as ImageIcon,
  FileText,
  Radio,
  Archive,
  Sparkles,
  Send,
  Trash2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Tv,
} from 'lucide-react'

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice()
  newArray.splice(to < 0 ? newArray.length + to : to, 0, newArray.splice(from, 1)[0])
  return newArray
}

// ============================================================================
// 1. Domain Entities: Omnichannel Media Studio Pipeline
// ============================================================================

export type MediaAssetType = 'video' | 'audio' | 'image' | 'article'

export interface MediaAsset {
  id: string
  title: string
  type: MediaAssetType
  sizeOrDuration: string
  author: string
  stage: 'library' | 'drafting' | 'editing' | 'review' | 'grid-showcase' | 'priority-queue' | 'archived' | 'published'
  columnId?: string
  priority?: 'urgent' | 'high' | 'normal'
  isApproved?: boolean
  isProtected?: boolean
  rank?: string
}

export interface MediaColumn {
  id: string
  title: string
  maxCapacity?: number
  rank?: string
  accept?: string | string[]
}

const INITIAL_ASSETS: MediaAsset[] = [
  // Raw library assets
  {
    id: 'asset-raw-1',
    title: 'Drone_4K_SanFrancisco.mp4',
    type: 'video',
    sizeOrDuration: '02:45 min',
    author: 'Elena Rostova',
    stage: 'library',
    columnId: 'library',
    priority: 'high',
    isApproved: true,
  },
  {
    id: 'asset-raw-2',
    title: 'Cyberpunk_Theme_Master.wav',
    type: 'audio',
    sizeOrDuration: '03:18 min',
    author: 'Marcus Vance',
    stage: 'library',
    columnId: 'library',
    priority: 'normal',
    isApproved: false,
  },
  {
    id: 'asset-raw-3',
    title: 'Brand_Identity_3D_Keyart.png',
    type: 'image',
    sizeOrDuration: '18.4 MB',
    author: 'Aria Chen',
    stage: 'library',
    columnId: 'library',
    priority: 'urgent',
    isApproved: true,
  },
  {
    id: 'asset-raw-4',
    title: 'Q3_Product_Keynote_Script.md',
    type: 'article',
    sizeOrDuration: '2,400 words',
    author: 'David Kim',
    stage: 'library',
    columnId: 'library',
    priority: 'normal',
    isApproved: false,
  },

  // Production Kanban assets
  {
    id: 'prod-1',
    title: 'Teaser_Trailer_Cut_v3.mp4',
    type: 'video',
    sizeOrDuration: '01:15 min',
    author: 'Elena Rostova',
    stage: 'drafting',
    columnId: 'drafting',
    priority: 'high',
    isApproved: false,
  },
  {
    id: 'prod-2',
    title: 'Podcast_Ep42_RoughCut.mp3',
    type: 'audio',
    sizeOrDuration: '44:20 min',
    author: 'Marcus Vance',
    stage: 'editing',
    columnId: 'editing',
    priority: 'normal',
    isApproved: true,
  },
  {
    id: 'prod-3',
    title: 'Infographic_Architecture.svg',
    type: 'image',
    sizeOrDuration: '4.2 MB',
    author: 'Aria Chen',
    stage: 'editing',
    columnId: 'editing',
    priority: 'high',
    isApproved: false,
  },
  {
    id: 'prod-4',
    title: 'Design_System_Spec_v2.pdf',
    type: 'article',
    sizeOrDuration: '5,100 words',
    author: 'David Kim',
    stage: 'review',
    columnId: 'review',
    priority: 'urgent',
    isApproved: true,
  },

  // Staged Grid assets
  {
    id: 'grid-1',
    title: 'Hero_Showcase_Reel.mp4',
    type: 'video',
    sizeOrDuration: '03:30 min',
    author: 'Elena Rostova',
    stage: 'grid-showcase',
    columnId: 'grid-showcase',
    priority: 'high',
    isApproved: true,
  },
  {
    id: 'grid-2',
    title: 'Spatial_Audio_Intro.flac',
    type: 'audio',
    sizeOrDuration: '01:45 min',
    author: 'Marcus Vance',
    stage: 'grid-showcase',
    columnId: 'grid-showcase',
    priority: 'normal',
    isApproved: true,
  },
  {
    id: 'grid-3',
    title: 'Editorial_Cover_Artwork.png',
    type: 'image',
    sizeOrDuration: '14.1 MB',
    author: 'Aria Chen',
    stage: 'grid-showcase',
    columnId: 'grid-showcase',
    priority: 'urgent',
    isApproved: true,
    isProtected: true, // Cannot be trashed
  },

  // Linear Publishing Queue assets
  {
    id: 'queue-1',
    title: 'Release_Announcement_Blog.md',
    type: 'article',
    sizeOrDuration: '1,800 words',
    author: 'David Kim',
    stage: 'priority-queue',
    columnId: 'priority-queue',
    priority: 'high',
    isApproved: true,
  },
  {
    id: 'queue-2',
    title: 'Developer_Walkthrough_Video.mp4',
    type: 'video',
    sizeOrDuration: '08:20 min',
    author: 'Elena Rostova',
    stage: 'priority-queue',
    columnId: 'priority-queue',
    priority: 'urgent',
    isApproved: true,
  },
]

const KANBAN_COLUMNS: MediaColumn[] = [
  { id: 'drafting', title: '1. Ingest & Draft', maxCapacity: 4 },
  { id: 'editing', title: '2. Post-Production', maxCapacity: 3 },
  { id: 'review', title: '3. Legal & Review', maxCapacity: 3 },
]

function getMediaIcon(type: MediaAssetType) {
  switch (type) {
    case 'video':
      return <Video className="w-3.5 h-3.5 text-primary shrink-0" />
    case 'audio':
      return <Music className="w-3.5 h-3.5 text-secondary shrink-0" />
    case 'image':
      return <ImageIcon className="w-3.5 h-3.5 text-accent shrink-0" />
    case 'article':
      return <FileText className="w-3.5 h-3.5 text-warning shrink-0" />
  }
}

function getPriorityBadge(priority?: string) {
  switch (priority) {
    case 'urgent':
      return <Badge size="sm" intent="danger">Urgent</Badge>
    case 'high':
      return <Badge size="sm" intent="warning">High</Badge>
    default:
      return <Badge size="sm" intent="secondary">Normal</Badge>
  }
}

// ============================================================================
// 2. Interactive Main Playground: Studio Command Center
// ============================================================================

export interface CrossContainerPlaygroundProps {
  allowExternalDraggables?: boolean
  enforceApprovalForPublish?: boolean
  protectMasterAssets?: boolean
  showActionZones?: boolean
}

function CrossContainerStudioPlayground({
  allowExternalDraggables = true,
  enforceApprovalForPublish = true,
  protectMasterAssets = true,
  showActionZones = true,
}: CrossContainerPlaygroundProps) {
  const [assets, setAssets] = useState<MediaAsset[]>(INITIAL_ASSETS)
  const [publishedCount, setPublishedCount] = useState(0)
  const [archivedCount, setArchivedCount] = useState(0)

  // Subsets
  const libraryAssets = useMemo(() => assets.filter((a) => a.stage === 'library'), [assets])
  const boardAssets = useMemo(() => assets.filter((a) => ['drafting', 'editing', 'review'].includes(a.stage)), [assets])
  const gridAssets = useMemo(() => assets.filter((a) => a.stage === 'grid-showcase'), [assets])
  const queueAssets = useMemo(() => assets.filter((a) => a.stage === 'priority-queue'), [assets])

  // Live Cross-Container Positional Sorting Drag Over Resolver
  const handleUniversalDragOver = useCallback((event: any) => {
    const { active, over } = event
    if (!over) return
    if (event.validation?.isRejected) return

    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    // Don't live-transfer into action targets (Instant Broadcast, Archive Vault) while dragging
    if (overId === 'instant-broadcast-target' || overId === 'archive-vault-target') {
      return
    }

    setAssets((prev) => {
      const activeIndex = prev.findIndex((a) => a.id === activeId)
      if (activeIndex === -1) return prev
      const activeAsset = prev[activeIndex]

      // 1. Hovering over another card item
      const overIndex = prev.findIndex((a) => a.id === overId)
      if (overIndex !== -1) {
        const overAsset = prev[overIndex]
        const targetStage = overAsset.stage
        const targetColumnId = overAsset.columnId ?? targetStage

        // Only update if moving to a DIFFERENT container/stage!
        // Intra-container sorting is handled natively by SortableContext for smooth 60fps drag & scroll without re-rendering.
        if (activeAsset.stage !== targetStage) {
          const targetColConfig = KANBAN_COLUMNS.find((c) => c.id === targetStage)
          if (targetColConfig?.maxCapacity != null) {
            const currentStageCount = prev.filter((a) => a.stage === targetStage).length
            if (currentStageCount >= targetColConfig.maxCapacity) {
              return prev
            }
          }

          const updatedActive = {
            ...activeAsset,
            stage: targetStage,
            columnId: targetColumnId,
          }
          const next = [...prev]
          next.splice(activeIndex, 1)
          const newOverIndex = next.findIndex((a) => a.id === overId)
          next.splice(newOverIndex >= 0 ? newOverIndex : next.length, 0, updatedActive)
          return next
        }
        return prev
      }

      // 2. Hovering over a container or empty column dropzone
      let targetStage: MediaAsset['stage'] | null = null
      if (overId === 'library-shelf' || overId === 'library') targetStage = 'library'
      else if (overId === 'grid-showcase') targetStage = 'grid-showcase'
      else if (overId === 'priority-queue' || overId === 'schedule-list') targetStage = 'priority-queue'
      else if (['drafting', 'editing', 'review'].includes(overId)) targetStage = overId as MediaAsset['stage']

      if (targetStage && activeAsset.stage !== targetStage) {
        const targetColConfig = KANBAN_COLUMNS.find((c) => c.id === targetStage)
        if (targetColConfig?.maxCapacity != null) {
          const currentStageCount = prev.filter((a) => a.stage === targetStage).length
          if (currentStageCount >= targetColConfig.maxCapacity) {
            return prev
          }
        }

        const updatedActive = {
          ...activeAsset,
          stage: targetStage,
          columnId: targetStage,
        }
        const next = [...prev]
        next.splice(activeIndex, 1)
        next.push(updatedActive)
        return next
      }

      return prev
    })
  }, [])

  // Unified Drag End Resolver across all containers
  const handleUniversalDragEnd = useCallback((event: any) => {
    if (!event.over) return

    // If DndProvider rejected the drop (capacity reached, type mismatch, predicate rejection), abort
    if (event.validation?.isRejected) {
      return
    }

    const activeId = String(event.active.id)
    const overId = String(event.over.id)

    // 1. Check Drop onto "Instant Broadcast / Deploy" Droppable
    if (overId === 'instant-broadcast-target') {
      const activeAsset = assets.find((a) => a.id === activeId)
      if (!activeAsset) return
      if (enforceApprovalForPublish && !activeAsset.isApproved) {
        toast.error(`Publish Rejected: "${activeAsset.title}" is not approved for live broadcast yet. Approve in Review first.`)
        return
      }
      setAssets((prev) => prev.filter((a) => a.id !== activeId))
      setPublishedCount((c) => c + 1)
      toast.success(`Broadcast Live: "${activeAsset.title}" was instantly pushed to production CDN streams.`)
      return
    }

    // 2. Check Drop onto "Secure Archive Vault" Droppable
    if (overId === 'archive-vault-target') {
      const activeAsset = assets.find((a) => a.id === activeId)
      if (!activeAsset) return
      if (protectMasterAssets && activeAsset.isProtected) {
        toast.error(`Protected Asset: "${activeAsset.title}" is a locked master asset and cannot be archived.`)
        return
      }
      setAssets((prev) => prev.filter((a) => a.id !== activeId))
      setArchivedCount((c) => c + 1)
      toast.warning(`Archived: "${activeAsset.title}" moved to offsite secure vault.`)
      return
    }

    const activeAsset = assets.find((a) => a.id === activeId)
    if (!activeAsset) return

    // Rejection check for cross-stage drop to maxed-out column
    let targetStage: string | null = null
    const overAsset = assets.find((a) => a.id === overId)
    if (overAsset) {
      targetStage = overAsset.stage
    } else if (['drafting', 'editing', 'review', 'library', 'grid-showcase', 'priority-queue'].includes(overId)) {
      targetStage = overId
    }

    if (targetStage && activeAsset.stage !== targetStage) {
      const targetColConfig = KANBAN_COLUMNS.find((c) => c.id === targetStage)
      if (targetColConfig?.maxCapacity != null) {
        const currentStageCount = assets.filter((a) => a.stage === targetStage).length
        if (currentStageCount >= targetColConfig.maxCapacity) {
          return
        }
      }
    }

    // 3. Intra-container reordering & final drop positional commit
    setAssets((prev) => {
      const activeIndex = prev.findIndex((a) => a.id === activeId)
      const overIndex = prev.findIndex((a) => a.id === overId)
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        return arrayMove(prev, activeIndex, overIndex)
      }
      return prev
    })

    const finalActiveAsset = assets.find((a) => a.id === activeId)
    if (!finalActiveAsset) return

    // Feedback for completed drop
    if (finalActiveAsset.stage === 'library') {
      toast.info(`Asset Placed: "${finalActiveAsset.title}" in Raw Asset Drawer.`)
    } else if (finalActiveAsset.stage === 'grid-showcase') {
      toast.info(`Asset Placed: "${finalActiveAsset.title}" in Featured Showcase.`)
    } else if (finalActiveAsset.stage === 'priority-queue') {
      toast.info(`Asset Placed: "${finalActiveAsset.title}" in Broadcast Schedule.`)
    } else if (['drafting', 'editing', 'review'].includes(finalActiveAsset.stage)) {
      const colTitle = KANBAN_COLUMNS.find((c) => c.id === finalActiveAsset.stage)?.title ?? finalActiveAsset.stage
      toast.success(`Asset Placed: "${finalActiveAsset.title}" in ${colTitle}`)
    }
  }, [assets, enforceApprovalForPublish, protectMasterAssets])

  const handleReset = () => {
    setAssets(INITIAL_ASSETS)
    setPublishedCount(0)
    setArchivedCount(0)
    toast.info('Workspace Reset: Restored initial studio media state.')
  }

  return (
    <DndProvider onDragOver={handleUniversalDragOver} onDragEnd={handleUniversalDragEnd}>
      <div className="flex flex-col gap-5 w-full max-w-5xl p-4 sm:p-5 bg-bg-surface rounded-macro border border-border/70 shadow-sm text-fg">
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-fg flex items-center gap-2">
                <Tv className="w-4 h-4 text-primary" />
                Omnichannel Media & Broadcast Pipeline
              </h3>
              <Badge size="sm" intent="primary">Multi-Container DnD</Badge>
            </div>
            <p className="text-xs text-fg-muted mt-1">
              Drag creative media across the <strong>Asset Drawer</strong>, <strong>Kanban Board</strong>, <strong>Showcase Grid</strong>, <strong>Release Queue</strong>, and <strong>Action Targets</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-fg-muted mr-2">
              <span>Live: <strong className="text-success">{publishedCount}</strong></span>
              <span>•</span>
              <span>Vault: <strong className="text-fg">{archivedCount}</strong></span>
            </div>
            <Button size="sm" intent="outline" onPress={handleReset} className="gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              Reset State
            </Button>
          </div>
        </div>

        {/* TOP SECTION: 1. Asset Drawer (Palette Draggables) */}
        {allowExternalDraggables && (
          <Droppable id="library-shelf" accept="*">
            {({ isOver }) => (
              <div
                className={`flex flex-col gap-2 p-3.5 rounded-macro border-2 border-dashed transition-all duration-150 ${isOver
                    ? 'border-primary bg-primary-subtle/15 ring-2 ring-inset ring-primary/20'
                    : 'border-border-subtle bg-bg-subtle/40'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
                      Raw Asset Ingestion Drawer ({libraryAssets.length} assets ready)
                    </span>
                  </div>
                  {isOver && <Badge size="sm" intent="primary">Drop here to unassign asset</Badge>}
                </div>

                {libraryAssets.length === 0 ? (
                  <div className="p-3 text-center text-xs text-fg-muted italic">
                    All raw assets deployed into production pipeline. Drag any card back here to return it to library.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {libraryAssets.map((asset) => (
                      <Draggable
                        key={asset.id}
                        id={asset.id}
                        type={asset.type}
                        data={asset}
                      >
                        <div className="group flex items-center gap-2.5 px-3 py-2 bg-bg-surface rounded-base border border-border/80 shadow-xs hover:border-primary/60 hover:shadow-subtle cursor-grab active:cursor-grabbing transition-all select-none">
                          <DraggableHandle className="text-fg-muted group-hover:text-fg" />
                          {getMediaIcon(asset.type)}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-fg truncate max-w-[170px]">
                              {asset.title}
                            </span>
                            <span className="text-[10px] text-fg-muted">
                              {asset.sizeOrDuration} • {asset.author}
                            </span>
                          </div>
                          {getPriorityBadge(asset.priority)}
                        </div>
                      </Draggable>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Droppable>
        )}

        {/* MIDDLE SECTION: 2. Production Kanban Board */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Active Production Stages (Kanban Board)
            </span>
            <span className="text-[11px] text-fg-muted">
              {boardAssets.length} active workstreams
            </span>
          </div>

          <DndBoard
            columns={KANBAN_COLUMNS}
            items={boardAssets}
            groupBy={(item: any) => item.stage ?? item.columnId}
            onItemsChange={(newBoardItems) => {
              setAssets((prev) => {
                const otherAssets = prev.filter((a) => !['drafting', 'editing', 'review'].includes(a.stage))
                return [...otherAssets, ...newBoardItems]
              })
            }}
            className="w-full"
            renderItem={(item: any) => (
              <div className="flex flex-col gap-1.5 p-2.5 bg-bg-surface rounded-base border border-border/80 shadow-xs hover:border-border-strong transition-all">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getMediaIcon(item.type)}
                    <span className="text-xs font-medium text-fg truncate">{item.title}</span>
                  </div>
                  {getPriorityBadge(item.priority)}
                </div>
                <div className="flex items-center justify-between text-[10px] text-fg-muted pt-1 border-t border-border/40">
                  <span>{item.author}</span>
                  <span className="flex items-center gap-1">
                    {item.isApproved ? (
                      <span className="text-success flex items-center gap-0.5 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    ) : (
                      <span className="text-warning flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> Draft
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
          />
        </div>

        {/* BOTTOM SPLIT SECTION: 3. Staging Grid & 4. Publishing Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 3. Sortable Staging Grid (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-2 p-3 bg-bg-subtle/30 rounded-macro border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                Featured Showcase Gallery (2D Sortable Grid)
              </span>
              <Badge size="sm" intent="accent">{gridAssets.length} Staged</Badge>
            </div>

            <SortableGrid
              columns={2}
              className="min-h-[120px] p-2 bg-bg-surface/50 rounded-base border border-dashed border-border-subtle"
            >
              {gridAssets.map((asset, idx) => (
                <SortableGrid.Item
                  key={asset.id}
                  id={asset.id}
                  index={idx}
                  data={asset}
                  className="bg-bg-surface border border-border shadow-xs hover:border-primary/50 transition-all p-3 rounded-base"
                >
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {getMediaIcon(asset.type)}
                        <span className="text-xs font-semibold text-fg truncate max-w-[130px]">
                          {asset.title}
                        </span>
                      </div>
                      {asset.isProtected && <Badge size="sm" intent="secondary">Locked</Badge>}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-fg-muted">
                      <span>{asset.sizeOrDuration}</span>
                      <span className="text-success text-[10px] font-medium">Ready</span>
                    </div>
                  </div>
                </SortableGrid.Item>
              ))}
            </SortableGrid>
          </div>

          {/* 4. Sortable Priority Queue (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-2 p-3 bg-bg-subtle/30 rounded-macro border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-secondary" />
                Broadcast Schedule (1D Sortable List)
              </span>
              <Badge size="sm" intent="secondary">{queueAssets.length} Queued</Badge>
            </div>

            <SortableList
              className="min-h-[120px] p-2 bg-bg-surface/50 rounded-base border border-dashed border-border-subtle"
            >
              {queueAssets.map((asset, idx) => (
                <SortableList.Item
                  key={asset.id}
                  id={asset.id}
                  index={idx}
                  data={asset}
                  className="p-2 bg-bg-surface rounded-base border border-border/80 shadow-xs text-xs"
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      {getMediaIcon(asset.type)}
                      <span className="font-medium text-fg truncate max-w-[140px]">{asset.title}</span>
                    </div>
                    <Badge size="sm" intent="primary">{asset.sizeOrDuration}</Badge>
                  </div>
                </SortableList.Item>
              ))}
            </SortableList>
          </div>
        </div>

        {/* BOTTOM ACTION ZONES: Instant Publish & Vault Droppables */}
        {showActionZones && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Deploy / Instant Broadcast Target */}
            <Droppable
              id="instant-broadcast-target"
              accept="*"
              rule={({ active }) => {
                const asset = (active?.data as MediaAsset) || active
                return !enforceApprovalForPublish || Boolean(asset?.isApproved)
              }}
            >
              {({ isOver, isRejected }) => (
                <div
                  className={`flex items-center gap-3 p-3.5 rounded-macro border-2 border-dashed transition-all duration-150 ${isOver
                      ? isRejected
                        ? 'border-danger bg-danger-subtle/25 text-danger ring-2 ring-inset ring-danger/40'
                        : 'border-success bg-success-subtle/25 text-success ring-2 ring-inset ring-success/40 scale-[1.01]'
                      : 'border-border-subtle bg-bg-subtle/30 text-fg-muted'
                    }`}
                >
                  <div className="w-10 h-10 rounded-base bg-success-subtle/30 text-success flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-xs text-fg">
                      Direct Deploy / Instant Broadcast
                    </h5>
                    <p className="text-[11px] text-fg-muted truncate">
                      {isOver
                        ? isRejected
                          ? '❌ Rejection: Asset must be approved before broadcast'
                          : '✨ Drop now to broadcast to CDN streams'
                        : 'Drag any approved media here to go live'}
                    </p>
                  </div>
                </div>
              )}
            </Droppable>

            {/* Archive / Vault Target */}
            <Droppable
              id="archive-vault-target"
              accept="*"
              rule={({ active }) => {
                const asset = (active?.data as MediaAsset) || active
                return !protectMasterAssets || !Boolean(asset?.isProtected)
              }}
            >
              {({ isOver, isRejected }) => (
                <div
                  className={`flex items-center gap-3 p-3.5 rounded-macro border-2 border-dashed transition-all duration-150 ${isOver
                      ? isRejected
                        ? 'border-danger bg-danger-subtle/25 text-danger ring-2 ring-inset ring-danger/40'
                        : 'border-warning bg-warning-subtle/25 text-warning ring-2 ring-inset ring-warning/40 scale-[1.01]'
                      : 'border-border-subtle bg-bg-subtle/30 text-fg-muted'
                    }`}
                >
                  <div className="w-10 h-10 rounded-base bg-warning-subtle/30 text-warning flex items-center justify-center shrink-0">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-xs text-fg">
                      Secure Vault / Cold Archive
                    </h5>
                    <p className="text-[11px] text-fg-muted truncate">
                      {isOver
                        ? isRejected
                          ? '❌ Rejection: Locked master assets cannot be vaulted'
                          : '📦 Drop now to move to cold archive'
                        : 'Drag non-protected assets here to archive'}
                    </p>
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        )}

        {/* Floating portal drag overlay */}
        <DragOverlay>
          {(active) => {
            const asset = active?.data as MediaAsset | undefined
            if (!asset) return null
            return (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-bg-surface/95 backdrop-blur-md rounded-base border border-primary shadow-xl ring-2 ring-primary/30 text-fg text-xs font-medium cursor-grabbing">
                {getMediaIcon(asset.type)}
                <span>{asset.title}</span>
                {getPriorityBadge(asset.priority)}
              </div>
            )
          }}
        </DragOverlay>
      </div>
    </DndProvider>
  )
}

// ============================================================================
// 3. Example 1: Palette to Kanban Ingestion
// ============================================================================

function PaletteToKanbanExample() {
  const [drawerItems, setDrawerItems] = useState([
    { id: 'raw-audio-1', title: 'Studio_Voiceover_Take2.wav', type: 'audio' as MediaAssetType, duration: '04:15 min' },
    { id: 'raw-video-1', title: 'B-Roll_Tokyo_Neon_Night.mp4', type: 'video' as MediaAssetType, duration: '01:50 min' },
  ])

  const [columns, setColumns] = useState([
    {
      id: 'recording',
      title: 'Recording Studio',
      items: [
        { id: 'rec-1', title: 'Intro_Jingle_Mix.flac', type: 'audio' as MediaAssetType, duration: '00:30 min' },
      ],
    },
    {
      id: 'vfx',
      title: 'VFX & Color Grade',
      items: [
        { id: 'vfx-1', title: 'Main_Title_Sequence.mov', type: 'video' as MediaAssetType, duration: '00:45 min' },
      ],
    },
  ])

  const handleDragOver = (event: any) => {
    if (!event.over) return
    const activeId = String(event.active.id)
    const overId = String(event.over.id)
    if (activeId === overId) return

    // Drag from drawer into column
    const drawerItem = drawerItems.find((item) => item.id === activeId)
    const targetCol = columns.find(
      (c) => c.id === overId || c.items.some((i) => i.id === overId)
    )

    if (drawerItem && targetCol) {
      setDrawerItems((prev) => prev.filter((i) => i.id !== activeId))
      setColumns((prev) =>
        prev.map((col) => {
          if (col.id === targetCol.id) {
            const overIndex = col.items.findIndex((i) => i.id === overId)
            const nextItems = [...col.items]
            if (overIndex !== -1) {
              nextItems.splice(overIndex, 0, drawerItem)
            } else {
              nextItems.push(drawerItem)
            }
            return { ...col, items: nextItems }
          }
          return col
        })
      )
      return
    }

    // Drag between columns
    const sourceCol = columns.find((c) => c.items.some((i) => i.id === activeId))
    if (sourceCol && targetCol && sourceCol.id !== targetCol.id) {
      const item = sourceCol.items.find((i) => i.id === activeId)
      if (item) {
        setColumns((prev) =>
          prev.map((col) => {
            if (col.id === sourceCol.id) {
              return { ...col, items: col.items.filter((i) => i.id !== activeId) }
            }
            if (col.id === targetCol.id) {
              const overIndex = col.items.findIndex((i) => i.id === overId)
              const nextItems = [...col.items]
              if (overIndex !== -1) {
                nextItems.splice(overIndex, 0, item)
              } else {
                nextItems.push(item)
              }
              return { ...col, items: nextItems }
            }
            return col
          })
        )
      }
    }
  }

  const handleDragEnd = (event: any) => {
    if (!event.over || event.validation?.isRejected || event.isDropped === false) return
    const activeId = String(event.active.id)
    const overId = String(event.over.id)

    const targetCol = columns.find(
      (c) => c.id === overId || c.items.some((i) => i.id === overId)
    )
    if (targetCol) {
      toast.success(`Asset Placed in ${targetCol.title}`)
    }
  }

  return (
    <DndProvider onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4 w-full p-4 bg-bg-surface rounded-macro border border-border/60">
        <div className="flex flex-col gap-1">
          <h4 className="font-semibold text-sm text-fg">Asset Palette $\rightarrow$ Multi-Column Kanban Ingestion</h4>
          <p className="text-xs text-fg-muted">
            Drag unassigned audio and video tracks directly into specific studio columns.
          </p>
        </div>

        {/* Ingestion Palette */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-bg-subtle/40 rounded-base border border-dashed border-border-subtle">
          <span className="text-xs font-semibold text-fg-muted mr-1">Raw Palette:</span>
          {drawerItems.length === 0 ? (
            <span className="text-xs text-fg-muted italic">All tracks assigned to board columns.</span>
          ) : (
            drawerItems.map((item) => (
              <Draggable key={item.id} id={item.id} type={item.type} data={item}>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface rounded-base border border-border/80 shadow-xs hover:border-primary text-xs font-medium cursor-grab active:cursor-grabbing">
                  {getMediaIcon(item.type)}
                  <span>{item.title}</span>
                  <Badge size="sm" intent="secondary">{item.duration}</Badge>
                </div>
              </Draggable>
            ))
          )}
        </div>

        {/* Board Columns */}
        <DndBoard
          columns={columns}
          onColumnsChange={(cols) => setColumns(cols as any)}
          renderItem={(item: any) => (
            <div className="flex items-center justify-between p-2 bg-bg-surface rounded-base border border-border shadow-xs text-xs">
              <div className="flex items-center gap-2">
                {getMediaIcon(item.type)}
                <span className="font-medium text-fg truncate max-w-[160px]">{item.title}</span>
              </div>
              <span className="text-[10px] text-fg-muted">{item.duration}</span>
            </div>
          )}
        />
      </div>
    </DndProvider>
  )
}

// ============================================================================
// 4. Example 2: 2D Grid to 1D Linear Queue Transfer
// ============================================================================

function GridToListTransferExample() {
  const [gridItems, setGridItems] = useState([
    { id: 'tile-1', title: 'Product_3D_Render.png', type: 'image' as MediaAssetType, resolution: '4K' },
    { id: 'tile-2', title: 'Explainer_Animation.mp4', type: 'video' as MediaAssetType, resolution: '1080p' },
  ])

  const [queueItems, setQueueItems] = useState([
    { id: 'list-1', title: 'Release_Notes_Draft.md', type: 'article' as MediaAssetType, resolution: 'v2.4' },
  ])

  const handleDragOver = (event: any) => {
    if (!event.over || event.validation?.isRejected) return
    const activeId = String(event.active.id)
    const overId = String(event.over.id)
    if (activeId === overId) return

    // From Grid to List
    const fromGrid = gridItems.find((i) => i.id === activeId)
    if (fromGrid && (overId === 'schedule-list' || queueItems.some((i) => i.id === overId))) {
      const overIndex = queueItems.findIndex((i) => i.id === overId)
      setGridItems((prev) => prev.filter((i) => i.id !== activeId))
      setQueueItems((prev) => {
        const next = [...prev]
        if (overIndex !== -1) {
          next.splice(overIndex, 0, fromGrid)
        } else {
          next.push(fromGrid)
        }
        return next
      })
      return
    }

    // From List to Grid
    const fromList = queueItems.find((i) => i.id === activeId)
    if (fromList && (overId === 'showcase-grid' || gridItems.some((i) => i.id === overId))) {
      const overIndex = gridItems.findIndex((i) => i.id === overId)
      setQueueItems((prev) => prev.filter((i) => i.id !== activeId))
      setGridItems((prev) => {
        const next = [...prev]
        if (overIndex !== -1) {
          next.splice(overIndex, 0, fromList)
        } else {
          next.push(fromList)
        }
        return next
      })
    }
  }

  const handleDragEnd = (event: any) => {
    if (!event.over || event.validation?.isRejected || event.isDropped === false) return
    const activeId = String(event.active.id)
    const overId = String(event.over.id)

    const gridOldIdx = gridItems.findIndex((i) => i.id === activeId)
    const gridNewIdx = gridItems.findIndex((i) => i.id === overId)
    if (gridOldIdx !== -1 && gridNewIdx !== -1 && gridOldIdx !== gridNewIdx) {
      setGridItems((prev) => reorderWithLexoRank(prev, gridOldIdx, gridNewIdx))
    }

    const listOldIdx = queueItems.findIndex((i) => i.id === activeId)
    const listNewIdx = queueItems.findIndex((i) => i.id === overId)
    if (listOldIdx !== -1 && listNewIdx !== -1 && listOldIdx !== listNewIdx) {
      setQueueItems((prev) => reorderWithLexoRank(prev, listOldIdx, listNewIdx))
    }

    const fromGrid = gridItems.find((i) => i.id === activeId)
    const fromList = queueItems.find((i) => i.id === activeId)

    if (fromGrid) {
      toast.info(`Moved to Grid: Placed "${fromGrid.title}"`)
    } else if (fromList) {
      toast.info(`Added to Schedule: Queued "${fromList.title}"`)
    }
  }

  return (
    <DndProvider onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4 w-full p-4 bg-bg-surface rounded-macro border border-border/60">
        <div className="flex flex-col gap-1">
          <h4 className="font-semibold text-sm text-fg">2D Showcase Grid $\leftrightarrow$ 1D Broadcast Queue</h4>
          <p className="text-xs text-fg-muted">
            Transfer media cards dynamically between a multi-column visual grid and a sequential priority list.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 2D Grid */}
          <div className="flex flex-col gap-2 p-3 bg-bg-subtle/30 rounded-macro border border-border/60">
            <span className="text-xs font-semibold text-fg-muted uppercase">2D Showcase Grid</span>
            <SortableGrid
              id="showcase-grid"
              columns={2}
            >
              {gridItems.map((item, idx) => (
                <SortableGrid.Item
                  key={item.id}
                  id={item.id}
                  index={idx}
                  data={item}
                  className="p-3 bg-bg-surface rounded-base border border-border/80 shadow-xs flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-medium text-fg truncate">
                    {getMediaIcon(item.type)}
                    <span className="truncate">{item.title}</span>
                  </div>
                  <Badge size="sm" intent="primary" className="self-start">{item.resolution}</Badge>
                </SortableGrid.Item>
              ))}
            </SortableGrid>
          </div>

          {/* 1D List */}
          <div className="flex flex-col gap-2 p-3 bg-bg-subtle/30 rounded-macro border border-border/60">
            <span className="text-xs font-semibold text-fg-muted uppercase">1D Broadcast Queue</span>
            <SortableList
              id="schedule-list"
            >
              {queueItems.map((item, idx) => (
                <SortableList.Item
                  key={item.id}
                  id={item.id}
                  index={idx}
                  data={item}
                  className="p-2.5 bg-bg-surface rounded-base border border-border/80 shadow-xs text-xs"
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2">
                      {getMediaIcon(item.type)}
                      <span className="font-medium text-fg truncate max-w-[130px]">{item.title}</span>
                    </div>
                    <Badge size="sm" intent="secondary">{item.resolution}</Badge>
                  </div>
                </SortableList.Item>
              ))}
            </SortableList>
          </div>
        </div>
      </div>
    </DndProvider>
  )
}

// ============================================================================
// 5. Example 3: Conditional Drop Targets with Rejection Rules
// ============================================================================

function ConditionalActionTargetsExample() {
  const [items, setItems] = useState([
    { id: 'act-1', title: 'Keynote_Stream_Ready.mp4', type: 'video' as MediaAssetType, approved: true, isProtected: false },
    { id: 'act-2', title: 'Internal_Memo_Draft.docx', type: 'article' as MediaAssetType, approved: false, isProtected: false },
    { id: 'act-3', title: 'Brand_Logo_Master.svg', type: 'image' as MediaAssetType, approved: true, isProtected: true },
  ])

  const handleDragEnd = (event: any) => {
    if (!event.over) return
    const activeId = String(event.active.id)
    const overId = String(event.over.id)
    const activeItem = items.find((i) => i.id === activeId)
    if (!activeItem) return

    if (overId === 'live-stream-target') {
      if (!activeItem.approved) {
        toast.error('Rejected: Cannot broadcast unapproved drafts.')
        return
      }
      setItems((prev) => prev.filter((i) => i.id !== activeId))
      toast.success(`Stream Deployed: "${activeItem.title}" is now broadcasting.`)
    }

    if (overId === 'trash-target') {
      if (activeItem.isProtected) {
        toast.error('Protected Asset: Locked master assets cannot be deleted.')
        return
      }
      setItems((prev) => prev.filter((i) => i.id !== activeId))
      toast.warning(`Deleted: Moved "${activeItem.title}" to trash.`)
    }
  }

  return (
    <DndProvider onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4 w-full p-4 bg-bg-surface rounded-macro border border-border/60">
        <div className="flex flex-col gap-1">
          <h4 className="font-semibold text-sm text-fg">Type Discrimination & Rejection Feedback</h4>
          <p className="text-xs text-fg-muted">
            Drag items into the targets below. Notice how unapproved drafts are rejected by the live stream, and locked master files are rejected by the trash.
          </p>
        </div>

        {/* Source items */}
        <div className="flex flex-wrap gap-2.5 p-3 bg-bg-subtle/40 rounded-base border border-border-subtle">
          {items.map((item) => (
            <Draggable key={item.id} id={item.id} type={item.type} data={item}>
              <div className="flex items-center gap-2 px-3 py-2 bg-bg-surface rounded-base border border-border/80 shadow-xs cursor-grab active:cursor-grabbing text-xs">
                {getMediaIcon(item.type)}
                <span className="font-medium text-fg">{item.title}</span>
                {item.isProtected && <Badge size="sm" intent="danger">Protected</Badge>}
                {item.approved ? (
                  <Badge size="sm" intent="success">Approved</Badge>
                ) : (
                  <Badge size="sm" intent="warning">Draft</Badge>
                )}
              </div>
            </Draggable>
          ))}
        </div>

        {/* Target Action Zones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Droppable
            id="live-stream-target"
            accept="*"
            rule={({ active }) => Boolean((active?.data as any)?.approved)}
          >
            {({ isOver, isRejected }) => (
              <div
                className={`flex items-center gap-3 p-3.5 rounded-macro border-2 border-dashed transition-all ${isOver
                    ? isRejected
                      ? 'border-danger bg-danger-subtle/25 text-danger'
                      : 'border-success bg-success-subtle/25 text-success'
                    : 'border-border-subtle bg-bg-subtle/30 text-fg-muted'
                  }`}
              >
                <Radio className="w-5 h-5 text-success shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold block text-fg">Live Broadcast Target</span>
                  <span className="text-[11px] text-fg-muted">
                    {isOver && isRejected ? '❌ Rejection: Item is not approved' : 'Requires Approved Status'}
                  </span>
                </div>
              </div>
            )}
          </Droppable>

          <Droppable
            id="trash-target"
            accept="*"
            rule={({ active }) => !Boolean((active?.data as any)?.isProtected)}
          >
            {({ isOver, isRejected }) => (
              <div
                className={`flex items-center gap-3 p-3.5 rounded-macro border-2 border-dashed transition-all ${isOver
                    ? isRejected
                      ? 'border-danger bg-danger-subtle/25 text-danger'
                      : 'border-warning bg-warning-subtle/25 text-warning'
                    : 'border-border-subtle bg-bg-subtle/30 text-fg-muted'
                  }`}
              >
                <Trash2 className="w-5 h-5 text-danger shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold block text-fg">Trash Bin</span>
                  <span className="text-[11px] text-fg-muted">
                    {isOver && isRejected ? '❌ Rejection: Locked master asset' : 'Rejects Protected Items'}
                  </span>
                </div>
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </DndProvider>
  )
}

// ============================================================================
// 6. Component Documentation Specification Export
// ============================================================================

export const crossContainerDndDoc: ComponentDocSpec<CrossContainerPlaygroundProps> = {
  id: 'cross-container-dnd',
  name: 'Cross-Container DnD',
  badge: 'Composite Pattern',
  subpath: '@consona/interface/dnd',
  summary:
    'Complete multi-container drag-and-drop choreography enabling seamless item transfers across Kanban Boards, 2D Sortable Grids, 1D Sortable Lists, and specialized Droppable action zones under a unified DndProvider.',
  subcomponents: [
    'DndProvider',
    'DndBoard',
    'SortableGrid',
    'SortableList',
    'Droppable',
    'Draggable',
    'DragOverlay',
  ],
  playground: {
    defaultProps: {
      allowExternalDraggables: true,
      enforceApprovalForPublish: true,
      protectMasterAssets: true,
      showActionZones: true,
    },
    controls: [
      {
        name: 'allowExternalDraggables',
        label: 'Asset Drawer Palette',
        type: 'boolean',
        defaultValue: true,
        description: 'Enable dragging unassigned raw media from the top shelf drawer.',
      },
      {
        name: 'enforceApprovalForPublish',
        label: 'Enforce Approval for Broadcast',
        type: 'boolean',
        defaultValue: true,
        description: 'Reject unapproved draft assets dropped onto the Instant Broadcast target.',
      },
      {
        name: 'protectMasterAssets',
        label: 'Protect Master Files',
        type: 'boolean',
        defaultValue: true,
        description: 'Reject protected master files dropped onto the Cold Archive vault.',
      },
      {
        name: 'showActionZones',
        label: 'Show Action Targets',
        type: 'boolean',
        defaultValue: true,
        description: 'Display Instant Broadcast and Secure Vault action droppables.',
      },
    ],
    render: (props) => <CrossContainerStudioPlayground {...props} />,
    code: `import { DndProvider, DndBoard, SortableGrid, SortableList, Droppable, Draggable } from '@consona/interface'

function MediaProductionStudio() {
  const [assets, setAssets] = useState(INITIAL_MEDIA_ASSETS)

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // 1. Check special action drop targets
    if (over.id === 'instant-broadcast') {
      publishAsset(active.id)
      return
    }
    if (over.id === 'archive-vault') {
      archiveAsset(active.id)
      return
    }

    // 2. Transfer between Board, Grid, or List
    moveAssetAcrossContainers(active.id, over.id)
  }

  return (
    <DndProvider onDragEnd={handleDragEnd}>
      {/* 1. Unassigned Asset Drawer */}
      <Droppable id="library-shelf">
        {assets.filter(a => a.stage === 'library').map(asset => (
          <Draggable key={asset.id} id={asset.id} type={asset.type} data={asset}>
            <AssetCard asset={asset} />
          </Draggable>
        ))}
      </Droppable>

      {/* 2. Production Kanban Board */}
      <DndBoard columns={PRODUCTION_STAGES} items={boardAssets} />

      {/* 3. Featured 2D Staging Grid */}
      <SortableGrid columns={2}>
        {stagedGridAssets.map((asset, idx) => (
          <SortableGrid.Item key={asset.id} id={asset.id} index={idx} data={asset}>
            <ShowcaseCard asset={asset} />
          </SortableGrid.Item>
        ))}
      </SortableGrid>

      {/* 4. Linear 1D Release Queue */}
      <SortableList>
        {releaseQueueAssets.map((asset, idx) => (
          <SortableList.Item key={asset.id} id={asset.id} index={idx} data={asset}>
            <QueueRow asset={asset} />
          </SortableList.Item>
        ))}
      </SortableList>

      {/* 5. Typed Action Droppables */}
      <Droppable id="instant-broadcast" rule={({ active }) => active.data.isApproved}>
        {({ isOver, isRejected }) => (
          <BroadcastDropZone isRejected={isRejected} />
        )}
      </Droppable>
    </DndProvider>
  )
}`,
  },
  examples: [
    {
      id: 'palette-to-kanban',
      title: '1. Asset Library to Kanban Board Ingestion',
      description:
        'Dragging unassigned media assets from a floating palette into multi-stage Kanban production columns.',
      render: () => <PaletteToKanbanExample />,
    },
    {
      id: 'grid-to-list-transfer',
      title: '2. 2D Visual Showcase Grid ↔ 1D Priority Broadcast Schedule',
      description:
        'Bi-directional item migration between a 2D SortableGrid and a 1D SortableList with automatic LexoRank reordering.',
      render: () => <GridToListTransferExample />,
    },
    {
      id: 'conditional-action-targets',
      title: '3. Conditional Action Targets with Acceptance & Rejection Rules',
      description:
        'Real-time rule evaluation displaying visual states (isAccepted, isRejected) and acoustic feedback when hovering over incompatible drop targets.',
      render: () => <ConditionalActionTargetsExample />,
    },
  ],
  recipes: [
    {
      title: 'Unified Cross-Container Event Dispatching',
      description:
        'Wiring a centralized onDragEnd handler that orchestrates transfers across heterogeneous containers.',
      code: `function handleUniversalDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over || active.id === over.id) return

  const sourceContainerId = active.data?.current?.containerId
  const targetContainerId = over.data?.current?.containerId ?? over.id

  if (targetContainerId === 'action-zone') {
    executeAction(active.id)
    return
  }

  // Update container assignments immutably
  setContainers(prev => moveItemAcrossContainers(prev, {
    activeId: active.id,
    overId: over.id
  }))
}`,
    },
    {
      title: 'Fail-Closed Rule Evaluation for Action Targets',
      description:
        'Protect sensitive operations by asserting predicate rules and emitting acoustic warnings on invalid drops.',
      code: `const protectRule: DropRulePredicate = ({ active, target }) => {
  if (active.data?.isProtected) {
    return false // Rejected
  }
  return true // Accepted
}`,
    },
  ],
  a11yNotes: [
    'Keyboard Drag & Drop: Press Space or Enter on any grab handle to pick up an item, use Arrow keys to traverse across Boards, Grids, and Droppables, then press Enter or Space to commit drop.',
    'Screen Reader State: Active grab status is broadcast via aria-grabbed and target drop zones announce aria-dropeffect.',
    'Acoustic Feedback: Dynamic sound synthesis plays gentle pickup tones, tonal movement strides, and distinct rejection buzzes on unauthorized drop targets.',
  ],
}
