import React, { useState } from 'react'
import {
  Draggable,
  Droppable,
  DndProvider,
  DragOverlay,
  Badge,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import { FileText, Image, FolderCheck, AlertTriangle, CheckCircle2, X } from 'lucide-react'

interface FileEntity {
  id: string
  name: string
  type: 'document' | 'media/image'
  size: string
  container: 'shelf' | 'doc-target' | 'media-target'
}

const INITIAL_FILES: FileEntity[] = [
  { id: 'doc-1', name: 'Invoice_2026.pdf', type: 'document', size: '240 KB', container: 'shelf' },
  { id: 'doc-2', name: 'Architecture_Spec.docx', type: 'document', size: '1.4 MB', container: 'shelf' },
  { id: 'doc-3', name: 'Security_Audit.pdf', type: 'document', size: '620 KB', container: 'shelf' },
  { id: 'img-1', name: 'Hero_Banner.png', type: 'media/image', size: '3.2 MB', container: 'shelf' },
  { id: 'img-2', name: 'App_Logo.png', type: 'media/image', size: '480 KB', container: 'shelf' },
]

function DraggableDroppablePlayground() {
  const [files, setFiles] = useState<FileEntity[]>(INITIAL_FILES)

  const shelfFiles = files.filter((f) => f.container === 'shelf')
  const docFiles = files.filter((f) => f.container === 'doc-target')
  const mediaFiles = files.filter((f) => f.container === 'media-target')

  const moveFile = (fileId: string, targetContainer: 'shelf' | 'doc-target' | 'media-target') => {
    setFiles((prev) =>
      prev.map((file) => (file.id === fileId ? { ...file, container: targetContainer } : file))
    )
  }

  const handleDragEnd = (event: any) => {
    if (!event.over || event.validation?.isRejected || event.isDropped === false) return
    const activeId = String(event.active.id)
    const targetId = String(event.over.id) as 'shelf' | 'doc-target' | 'media-target'
    const activeFile = files.find((f) => f.id === activeId)
    if (!activeFile) return

    // Type validation: only allow matching types
    if (targetId === 'doc-target' && activeFile.type !== 'document') {
      return
    }
    if (targetId === 'media-target' && !activeFile.type.startsWith('media/')) {
      return
    }

    moveFile(activeId, targetId)
  }

  return (
    <DndProvider onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-5 w-full max-w-2xl p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm text-fg">Multi-Container File Sorter</h4>
            <p className="text-xs text-fg-muted mt-0.5">
              Drag items into typed drop targets. Items transfer into the target and can be dragged back to the shelf.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              intent="outline"
              onPress={() => setFiles(INITIAL_FILES)}
            >
              Reset All Files
            </Button>
          </div>
        </div>

        {/* Source Shelf Droppable */}
        <Droppable id="shelf" accept="*">
          {({ isOver }) => (
            <div className={`flex flex-col gap-2 p-3 sm:p-3.5 rounded-macro border-2 border-dashed min-h-[110px] box-border transition-colors duration-150 ${
              isOver
                ? 'border-primary bg-primary-subtle/15 ring-2 ring-inset ring-primary/20'
                : 'border-border-subtle bg-bg-subtle/30'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 min-h-[24px]">
                <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
                  Storage Shelf ({shelfFiles.length} available)
                </span>
                {isOver && (
                  <span className="flex items-center">
                    <Badge size="sm" intent="primary">Drop here to return file</Badge>
                  </span>
                )}
              </div>

              {shelfFiles.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-fg-muted italic py-4 text-center">
                  All files assigned to drop targets below. Drag items back here to unassign.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {shelfFiles.map((file) => {
                    const isDoc = file.type === 'document'
                    return (
                      <Draggable key={file.id} id={file.id} type={file.type} data={file}>
                        <div className="flex items-center gap-2 px-3 py-2 bg-bg-surface rounded-base border border-border/80 shadow-xs hover:border-border-strong hover:shadow-subtle cursor-grab active:cursor-grabbing transition-all">
                          {isDoc ? <FileText className="w-4 h-4 text-primary" /> : <Image className="w-4 h-4 text-accent" />}
                          <span className="text-xs font-medium text-fg">{file.name}</span>
                          <Badge size="sm" intent={isDoc ? 'primary' : 'accent'}>
                            {file.size}
                          </Badge>
                        </div>
                      </Draggable>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </Droppable>

        {/* Typed Drop Targets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Documents Target */}
          <Droppable id="doc-target" accept="document">
            {({ isOver, isAccepted, isRejected, rejectionReason }) => (
              <Droppable.Zone className="h-[340px] min-h-[340px] p-4 flex flex-col justify-between">
                <div className="h-[140px] flex flex-col items-center justify-center text-center gap-2 w-full">
                  <div className={`p-2.5 rounded-full transition-all duration-150 ${
                    isOver && isRejected
                      ? 'bg-danger-subtle text-danger shadow-xs'
                      : isOver && isAccepted
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-bg-muted text-primary'
                  }`}>
                    {isOver && isRejected ? (
                      <AlertTriangle className="w-6 h-6 animate-bounce" />
                    ) : isOver && isAccepted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <FolderCheck className="w-6 h-6" />
                    )}
                  </div>

                  <div className="font-semibold text-xs text-fg">
                    {isOver && isRejected
                      ? rejectionReason ?? 'Type Mismatch'
                      : isOver && isAccepted
                      ? 'Release to Drop Document'
                      : 'Documents Target'}
                  </div>

                  <Badge
                    size="sm"
                    intent={
                      isOver && isRejected
                        ? 'danger'
                        : isOver && isAccepted
                        ? 'primary'
                        : 'secondary'
                    }
                  >
                    {isOver && isRejected
                      ? 'Rejected (Requires: document)'
                      : isOver && isAccepted
                      ? 'Drop Allowed'
                      : 'accept="document"'}
                  </Badge>
                </div>

                {/* Dropped Content rendered as draggable items inside target */}
                <div className="h-[150px] flex flex-col justify-start w-full pt-2.5 border-t border-border/40 text-left">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-fg-muted mb-1.5 flex-shrink-0">
                    <span>Documents in Target ({docFiles.length})</span>
                  </div>
                  {docFiles.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-[11px] text-fg-muted italic">
                      No documents stored
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto max-h-[115px] pr-1 flex flex-col gap-1.5">
                      {docFiles.map((file) => (
                        <Draggable key={file.id} id={file.id} type={file.type} data={file}>
                          <div className="flex items-center justify-between gap-2 p-2 bg-bg-surface rounded-base border border-border/80 shadow-2xs hover:border-border-strong cursor-grab active:cursor-grabbing transition-all flex-shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              <span className="text-xs font-medium text-fg truncate">{file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveFile(file.id, 'shelf')
                              }}
                              className="p-1 text-fg-muted hover:text-danger rounded-micro hover:bg-danger-subtle/30 transition-colors"
                              title="Return to Shelf"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </Draggable>
                      ))}
                    </div>
                  )}
                </div>
              </Droppable.Zone>
            )}
          </Droppable>

          {/* Media Target */}
          <Droppable id="media-target" accept="media/*">
            {({ isOver, isAccepted, isRejected, rejectionReason }) => (
              <Droppable.Zone className="h-[340px] min-h-[340px] p-4 flex flex-col justify-between">
                <div className="h-[140px] flex flex-col items-center justify-center text-center gap-2 w-full">
                  <div className={`p-2.5 rounded-full transition-all duration-150 ${
                    isOver && isRejected
                      ? 'bg-danger-subtle text-danger shadow-xs'
                      : isOver && isAccepted
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-bg-muted text-accent'
                  }`}>
                    {isOver && isRejected ? (
                      <AlertTriangle className="w-6 h-6 animate-bounce" />
                    ) : isOver && isAccepted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Image className="w-6 h-6" />
                    )}
                  </div>

                  <div className="font-semibold text-xs text-fg">
                    {isOver && isRejected
                      ? rejectionReason ?? 'Type Mismatch'
                      : isOver && isAccepted
                      ? 'Release to Drop Media'
                      : 'Media Target'}
                  </div>

                  <Badge
                    size="sm"
                    intent={
                      isOver && isRejected
                        ? 'danger'
                        : isOver && isAccepted
                        ? 'accent'
                        : 'secondary'
                    }
                  >
                    {isOver && isRejected
                      ? 'Rejected (Requires: media/*)'
                      : isOver && isAccepted
                      ? 'Drop Allowed'
                      : 'accept="media/*"'}
                  </Badge>
                </div>

                {/* Dropped Content rendered as draggable items inside target */}
                <div className="h-[150px] flex flex-col justify-start w-full pt-2.5 border-t border-border/40 text-left">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-fg-muted mb-1.5 flex-shrink-0">
                    <span>Media in Target ({mediaFiles.length})</span>
                  </div>
                  {mediaFiles.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-[11px] text-fg-muted italic">
                      No media stored
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto max-h-[115px] pr-1 flex flex-col gap-1.5">
                      {mediaFiles.map((file) => (
                        <Draggable key={file.id} id={file.id} type={file.type} data={file}>
                          <div className="flex items-center justify-between gap-2 p-2 bg-bg-surface rounded-base border border-border/80 shadow-2xs hover:border-border-strong cursor-grab active:cursor-grabbing transition-all flex-shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <Image className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                              <span className="text-xs font-medium text-fg truncate">{file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveFile(file.id, 'shelf')
                              }}
                              className="p-1 text-fg-muted hover:text-danger rounded-micro hover:bg-danger-subtle/30 transition-colors"
                              title="Return to Shelf"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </Draggable>
                      ))}
                    </div>
                  )}
                </div>
              </Droppable.Zone>
            )}
          </Droppable>
        </div>

        {/* Instant seamless Drop Overlay */}
        <DragOverlay tiltAngle={2}>
          {(active) => {
            if (!active) return null
            const item = active.data as FileEntity | undefined
            const isDoc = active.type === 'document'
            return (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-bg-surface opacity-100 rounded-base border border-border-strong shadow-strong min-w-[220px]">
                {isDoc ? <FileText className="w-4 h-4 text-primary" /> : <Image className="w-4 h-4 text-accent" />}
                <span className="text-xs font-semibold text-fg truncate">{item?.name ?? active.id}</span>
                <Badge size="sm" intent={isDoc ? 'primary' : 'accent'}>{item?.size ?? active.type}</Badge>
              </div>
            )
          }}
        </DragOverlay>
      </div>
    </DndProvider>
  )
}

export const draggableDoc: ComponentDocSpec = {
  id: 'draggable',
  name: 'Draggable',
  badge: 'Module / DnD',
  summary:
    'Universal drag-enabled wrapper component with ARIA accessibility bindings, handles, and type discriminants.',
  subcomponents: ['Draggable.Handle'],
  playground: {
    defaultProps: {},
    controls: [],
    render: () => <DraggableDroppablePlayground />,
  },
  examples: [],
  recipes: [],
  a11yNotes: ['Draggable declares role="button" and tabIndex={0} with aria-grabbed states.'],
}

export const droppableDoc: ComponentDocSpec = {
  id: 'droppable',
  name: 'Droppable',
  badge: 'Module / DnD',
  summary:
    'Intelligent drop target container supporting type acceptance rules (globs, predicates) and capacity limits.',
  subcomponents: ['Droppable.Zone'],
  playground: {
    defaultProps: {},
    controls: [],
    render: () => <DraggableDroppablePlayground />,
  },
  examples: [],
  recipes: [],
  a11yNotes: ['Droppable declares aria-dropeffect="move" with keyboard navigation cues.'],
}
