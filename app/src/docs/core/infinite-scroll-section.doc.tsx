import React, { useState, useMemo } from 'react'
import {
  InfiniteScrollSection,
  Badge,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  BoltIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CircleStackIcon,
  PhotoIcon,
  ArrowsRightLeftIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/20/solid'

interface TelemetryEntry {
  id: number
  timestamp: string
  service: string
  latencyMs: number
  status: '200 OK' | '201 Created' | '404 Not Found' | '500 Server Error'
  endpoint: string
  payloadBytes: number
}

// Generate high-volume synthetic telemetry records (2,000 entries)
const generate2000TelemetryRecords = (): TelemetryEntry[] => {
  const services = ['auth-service', 'billing-api', 'edge-gateway', 'user-profile', 'payment-mesh', 'search-indexer', 'notification-worker']
  const endpoints = ['/v1/auth/token', '/v2/checkout/charge', '/api/users/me', '/v1/search/query', '/ws/stream', '/metrics/prometheus', '/v1/tenants/status']
  const statuses: ('200 OK' | '201 Created' | '404 Not Found' | '500 Server Error')[] = ['200 OK', '200 OK', '200 OK', '201 Created', '404 Not Found', '500 Server Error']

  const baseTime = Date.now()
  return Array.from({ length: 2000 }, (_, index) => {
    const id = index + 1
    const service = services[id % services.length]
    const endpoint = endpoints[id % endpoints.length]
    const status = statuses[id % statuses.length]
    const latencyMs = 12 + ((id * 37) % 180) + (status === '500 Server Error' ? 450 : 0)
    const payloadBytes = 256 + ((id * 83) % 4096)
    const time = new Date(baseTime - (2000 - id) * 1200).toLocaleTimeString()

    return {
      id,
      timestamp: time,
      service,
      latencyMs,
      status,
      endpoint,
      payloadBytes,
    }
  })
}

const all2000Records = generate2000TelemetryRecords()

export const infiniteScrollSectionDoc: ComponentDocSpec = {
  id: 'infinite-scroll-section',
  name: 'InfiniteScrollSection',
  component: InfiniteScrollSection,
  badge: 'Enterprise Composite',
  summary: 'High-performance bidirectional infinite scroll container with sliding memory windows, buffer thresholds, 2,000+ item capacity, and async fetch triggers.',
  subcomponents: ['InfiniteScrollSection'],
  playground: {
    defaultProps: {
      maxHeight: 360,
      initialLoadCount: 25,
      appendCount: 20,
      windowSize: 60,
    },
    controls: [
      { name: 'maxHeight', type: 'number', min: 200, max: 600, step: 20 },
      { name: 'initialLoadCount', type: 'number', min: 10, max: 100, step: 10 },
      { name: 'appendCount', type: 'number', min: 10, max: 50, step: 5 },
      { name: 'windowSize', type: 'number', min: 30, max: 150, step: 10 },
    ],
    render: (props: any) => {
      const [displayedCount, setDisplayedCount] = useState<number>(props.initialLoadCount || 25)
      const [isLoading, setIsLoading] = useState(false)
      const [windowState, setWindowState] = useState<{ start: number; end: number }>({
        start: 0,
        end: props.initialLoadCount || 25,
      })

      const activeItems = useMemo(() => {
        return all2000Records.slice(0, displayedCount)
      }, [displayedCount])

      const handleLoadMore = async () => {
        if (isLoading || displayedCount >= all2000Records.length) return
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 400))
        setDisplayedCount((prev) => Math.min(all2000Records.length, prev + (props.appendCount || 20)))
        setIsLoading(false)
      }

      const getStatusBadge = (status: TelemetryEntry['status']) => {
        switch (status) {
          case '200 OK':
            return <Badge intent="success" className="text-[10px] font-mono px-1 py-0">200</Badge>
          case '201 Created':
            return <Badge intent="primary" className="text-[10px] font-mono px-1 py-0">201</Badge>
          case '404 Not Found':
            return <Badge intent="warning" className="text-[10px] font-mono px-1 py-0">404</Badge>
          case '500 Server Error':
            return <Badge intent="danger" className="text-[10px] font-mono px-1 py-0">500</Badge>
        }
      }

      const inDomCount = Math.max(0, windowState.end - windowState.start)

      return (
        <div className="w-full max-w-2xl">
          {/* Real-time Stats Panel */}
          <div className="mb-3 p-2.5 rounded-base border border-border bg-bg-surface shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-fg">
                <CircleStackIcon className="size-4 text-primary" />
                <span>Dataset: <strong className="font-mono text-primary">{activeItems.length}</strong> / 2,000 loaded</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isLoading ? (
                  <Badge intent="warning" className="text-[10px] flex items-center gap-1">
                    <ArrowPathIcon className="size-3 animate-spin" /> Fetching Batch...
                  </Badge>
                ) : (
                  <Badge intent="success" className="text-[10px] flex items-center gap-1">
                    <CheckCircleIcon className="size-3" /> Idle (Ready)
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/40 text-[11px] font-mono">
              <div className="p-1.5 rounded-atom bg-muted/30 flex flex-col">
                <span className="text-muted-fg text-[10px]">Active Window</span>
                <strong className="text-fg">#{windowState.start + 1} – #{windowState.end}</strong>
              </div>
              <div className="p-1.5 rounded-atom bg-muted/30 flex flex-col">
                <span className="text-muted-fg text-[10px]">In DOM Nodes</span>
                <strong className="text-primary">{inDomCount} items</strong>
              </div>
              <div className="p-1.5 rounded-atom bg-muted/30 flex flex-col">
                <span className="text-muted-fg text-[10px]">Window Size Cap</span>
                <strong className="text-fg">{props.windowSize || 60} max</strong>
              </div>
              <div className="p-1.5 rounded-atom bg-muted/30 flex flex-col">
                <span className="text-muted-fg text-[10px]">Sliding Prune</span>
                <strong className={inDomCount >= (props.windowSize || 60) ? 'text-warning font-semibold' : 'text-success'}>
                  {inDomCount >= (props.windowSize || 60) ? 'Active (Capped)' : 'Buffering'}
                </strong>
              </div>
            </div>
          </div>

          <InfiniteScrollSection
            items={activeItems}
            maxHeight={props.maxHeight}
            initialLoadCount={props.initialLoadCount}
            appendCount={props.appendCount}
            windowSize={props.windowSize}
            loadingBottom={isLoading}
            hasMoreBottom={displayedCount < all2000Records.length}
            onLoadMore={handleLoadMore}
            onRenderWindowChange={(start, end) => {
              setWindowState({ start, end })
            }}
            className="border border-border rounded-base bg-card p-2 shadow-xs"
            renderItem={(item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 py-2 px-3 border-b border-border/40 hover:bg-muted/30 transition-colors text-xs font-mono"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-muted-fg/70 w-10 shrink-0 text-right">#{item.id}</span>
                  {getStatusBadge(item.status)}
                  <span className="text-fg font-semibold truncate">{item.service}</span>
                  <span className="text-muted-fg truncate hidden sm:inline">{item.endpoint}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-muted-fg text-[11px]">
                  <span className={item.latencyMs > 200 ? 'text-danger font-semibold' : 'text-fg'}>
                    {item.latencyMs}ms
                  </span>
                  <span className="w-16 text-right hidden md:inline">{item.payloadBytes} B</span>
                  <span className="text-muted-fg/70">{item.timestamp}</span>
                </div>
              </div>
            )}
          />
        </div>
      )
    },
  },
  examples: [
    {
      title: '2,000 High-Throughput Live Feed (Performance Stress Test)',
      description: 'Stream 2,000 live trace transactions with recycled memory buffers maintaining 60fps smooth momentum scrolling.',
      render: () => {
        const [count, setCount] = useState(80)
        const [isBusy, setIsBusy] = useState(false)
        const [windowRange, setWindowRange] = useState({ start: 0, end: 40 })

        const items = useMemo(() => all2000Records.slice(0, count), [count])

        return (
          <div className="w-full max-w-2xl">
            {/* Live Stats Header */}
            <div className="mb-2 p-2 rounded-base border border-border bg-bg-surface flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <BoltIcon className="size-4 text-primary shrink-0" />
                <span>Dataset: <strong className="text-fg">{items.length}</strong> / 2,000</span>
                <span className="text-muted-fg">|</span>
                <span>DOM Window: <strong className="text-primary">#{windowRange.start + 1}–#{windowRange.end}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <Badge intent="secondary" className="font-mono text-[10px]">
                  {windowRange.end - windowRange.start} rendered (cap: 40)
                </Badge>
                {isBusy ? (
                  <Badge intent="warning" className="text-[10px] animate-pulse">Loading +30...</Badge>
                ) : (
                  <Badge intent="success" className="text-[10px]">Ready</Badge>
                )}
              </div>
            </div>

            <InfiniteScrollSection
              items={items}
              maxHeight={280}
              windowSize={40}
              loadingBottom={isBusy}
              hasMoreBottom={count < 2000}
              onRenderWindowChange={(start, end) => setWindowRange({ start, end })}
              onLoadMore={async () => {
                setIsBusy(true)
                await new Promise((r) => setTimeout(r, 300))
                setCount((c) => Math.min(2000, c + 30))
                setIsBusy(false)
              }}
              className="border border-border rounded-base bg-card shadow-xs"
              renderItem={(row) => (
                <div key={row.id} className="p-2 border-b border-border/30 text-xs flex justify-between items-center font-mono hover:bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold">#{row.id}</span>
                    <span className="text-fg">{row.service}</span>
                    <span className="text-muted-fg text-[11px]">{row.endpoint}</span>
                  </div>
                  <span className="text-muted-fg">{row.timestamp}</span>
                </div>
              )}
            />
          </div>
        )
      },
    },
    {
      title: 'Bidirectional (Top & Bottom) History Stream',
      description: 'Supports loading older historical messages when scrolling to top, and newer incoming messages when scrolling to bottom with dynamic sliding memory window.',
      render: () => {
        const [startIdx, setStartIdx] = useState(500)
        const [endIdx, setEndIdx] = useState(540)
        const [loadingTop, setLoadingTop] = useState(false)
        const [loadingBottom, setLoadingBottom] = useState(false)
        const [renderWindow, setRenderWindow] = useState({ start: 0, end: 30 })

        const currentWindow = useMemo(() => {
          return all2000Records.slice(startIdx, endIdx)
        }, [startIdx, endIdx])

        const handleLoadMore = async (dir: 'top' | 'bottom' | 'start' | 'end' | 'left' | 'right') => {
          if (dir === 'top' || dir === 'start' || dir === 'left') {
            if (startIdx <= 0 || loadingTop) return
            setLoadingTop(true)
            await new Promise((r) => setTimeout(r, 450))
            setStartIdx((s) => Math.max(0, s - 15))
            setLoadingTop(false)
          } else {
            if (endIdx >= 2000 || loadingBottom) return
            setLoadingBottom(true)
            await new Promise((r) => setTimeout(r, 450))
            setEndIdx((e) => Math.min(2000, e + 15))
            setLoadingBottom(false)
          }
        }

        return (
          <div className="w-full max-w-xl">
            {/* Real-time Bidirectional Stats Bar */}
            <div className="mb-2.5 p-2.5 rounded-base border border-border bg-bg-surface shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ArrowsRightLeftIcon className="size-4 text-primary rotate-90" />
                  <span className="font-semibold text-fg">Bidirectional Sliding Buffer</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  {loadingTop ? (
                    <Badge intent="warning" className="animate-pulse flex items-center gap-1">
                      <ArrowUpIcon className="size-3" /> Prepending Top...
                    </Badge>
                  ) : loadingBottom ? (
                    <Badge intent="warning" className="animate-pulse flex items-center gap-1">
                      <ArrowDownIcon className="size-3" /> Appending Bottom...
                    </Badge>
                  ) : (
                    <Badge intent="success">Bidirectional Stable</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/40 text-[11px] font-mono">
                <div className="p-1 rounded bg-muted/30">
                  <span className="text-muted-fg text-[10px] block">Buffer Range</span>
                  <strong className="text-fg">#{startIdx + 1}–#{endIdx}</strong>
                </div>
                <div className="p-1 rounded bg-muted/30">
                  <span className="text-muted-fg text-[10px] block">Render Window</span>
                  <strong className="text-primary">#{startIdx + renderWindow.start + 1}–#{startIdx + renderWindow.end}</strong>
                </div>
                <div className="p-1 rounded bg-muted/30">
                  <span className="text-muted-fg text-[10px] block">Mounted Nodes</span>
                  <strong className="text-fg">{renderWindow.end - renderWindow.start} / cap 30</strong>
                </div>
              </div>
            </div>

            <InfiniteScrollSection
              items={currentWindow}
              maxHeight={260}
              windowSize={30}
              enableTopLoad
              loadingTop={loadingTop}
              loadingBottom={loadingBottom}
              hasMoreTop={startIdx > 0}
              hasMoreBottom={endIdx < 2000}
              onRenderWindowChange={(start, end) => setRenderWindow({ start, end })}
              onLoadMore={handleLoadMore}
              className="border border-border rounded-base bg-card shadow-xs"
              renderItem={(item) => (
                <div key={item.id} className="p-2 border-b border-border/40 text-xs font-mono flex items-center justify-between hover:bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold w-12">#{item.id}</span>
                    <span className="text-fg font-semibold">{item.service}</span>
                    <span className="text-muted-fg text-[11px] truncate">{item.endpoint}</span>
                  </div>
                  <span className="text-xs text-muted-fg">{item.timestamp}</span>
                </div>
              )}
            />
          </div>
        )
      },
    },
    {
      title: 'Bidirectional Media Grid with Sliding Window (Top & Bottom Overscroll)',
      description: '2D grid with strict maxLoadedItems sliding memory window (18 tiles max). Automatically prunes bottom tiles when prepending at the top edge without scroll jumping.',
      render: () => {
        const [allAssets] = useState(() => {
          return Array.from({ length: 180 }, (_, i) => ({
            id: i + 1,
            title: `Asset_Texture_${String(i + 1).padStart(3, '0')}.webp`,
            size: `${(1.2 + (i % 4) * 0.8).toFixed(1)} MB`,
            dimensions: '3840 x 2160',
            category: ['Textures', 'Meshes', 'Audio', 'Shaders'][i % 4],
          }))
        })

        const [startIdx, setStartIdx] = useState(40)
        const [endIdx, setEndIdx] = useState(70)
        const [loadingTop, setLoadingTop] = useState(false)
        const [loadingBottom, setLoadingBottom] = useState(false)
        const [gridWindow, setGridWindow] = useState({ start: 0, end: 18 })

        const currentGridItems = useMemo(() => {
          return allAssets.slice(startIdx, endIdx)
        }, [allAssets, startIdx, endIdx])

        const handleGridLoadMore = async (dir: 'top' | 'bottom' | 'start' | 'end' | 'left' | 'right') => {
          if (dir === 'top' || dir === 'start' || dir === 'left') {
            if (startIdx <= 0 || loadingTop) return
            setLoadingTop(true)
            await new Promise((r) => setTimeout(r, 400))
            setStartIdx((prev) => Math.max(0, prev - 6))
            setLoadingTop(false)
          } else {
            if (endIdx >= allAssets.length || loadingBottom) return
            setLoadingBottom(true)
            await new Promise((r) => setTimeout(r, 400))
            setEndIdx((prev) => Math.min(allAssets.length, prev + 6))
            setLoadingBottom(false)
          }
        }

        const mountedTiles = Math.max(0, gridWindow.end - gridWindow.start)

        return (
          <div className="w-full max-w-2xl">
            {/* Grid Live Stats Bar */}
            <div className="mb-2.5 p-2.5 rounded-base border border-border bg-bg-surface shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Squares2X2Icon className="size-4 text-primary shrink-0" />
                  <span className="font-semibold text-fg">2D Grid Sliding Window (Cap: 18 Tiles)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  {loadingTop ? (
                    <Badge intent="warning" className="animate-pulse flex items-center gap-1">
                      <ArrowUpIcon className="size-3" /> Prepending Top (+6)...
                    </Badge>
                  ) : loadingBottom ? (
                    <Badge intent="warning" className="animate-pulse flex items-center gap-1">
                      <ArrowDownIcon className="size-3" /> Appending Bottom (+6)...
                    </Badge>
                  ) : (
                    <Badge intent="success">Grid Stable</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/40 text-[11px] font-mono">
                <div className="p-1 rounded bg-muted/30">
                  <span className="text-muted-fg text-[10px] block">Dataset Buffer</span>
                  <strong className="text-fg">#{startIdx + 1}–#{endIdx} / {allAssets.length}</strong>
                </div>
                <div className="p-1 rounded bg-muted/30">
                  <span className="text-muted-fg text-[10px] block">Visible Range</span>
                  <strong className="text-primary">#{startIdx + gridWindow.start + 1}–#{startIdx + gridWindow.end}</strong>
                </div>
                <div className="p-1 rounded bg-muted/30">
                  <span className="text-muted-fg text-[10px] block">DOM Tiles Rendered</span>
                  <strong className="text-primary">{mountedTiles} tiles</strong>
                </div>
                <div className="p-1 rounded bg-muted/30">
                  <span className="text-muted-fg text-[10px] block">Top Overscroll Prune</span>
                  <strong className={mountedTiles >= 18 ? 'text-warning font-semibold' : 'text-success'}>
                    {mountedTiles >= 18 ? 'Enforced (Prunes Tail)' : 'Filling Window'}
                  </strong>
                </div>
              </div>
            </div>

            <InfiniteScrollSection
              items={currentGridItems}
              maxHeight={320}
              windowSize={18}
              initialLoadCount={18}
              appendCount={6}
              enableTopLoad
              loadingTop={loadingTop}
              loadingBottom={loadingBottom}
              hasMoreTop={startIdx > 0}
              hasMoreBottom={endIdx < allAssets.length}
              onRenderWindowChange={(start, end) => setGridWindow({ start, end })}
              onLoadMore={handleGridLoadMore}
              className="border border-border rounded-base bg-card p-2 shadow-xs"
              contentClassName="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
              renderItem={(photo) => (
                <div
                  key={photo.id}
                  className="p-3 rounded-base border border-border bg-bg-surface flex flex-col justify-between hover:border-primary/50 transition-colors shadow-xs"
                >
                  <div className="h-14 rounded-atom bg-muted/40 flex items-center justify-center mb-2">
                    <PhotoIcon className="size-5 text-muted-fg/60" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono text-primary font-bold">#{photo.id}</span>
                      <Badge intent="secondary" className="text-[9px] px-1 py-0">{photo.category}</Badge>
                    </div>
                    <div className="text-xs font-semibold text-fg truncate">{photo.title}</div>
                    <div className="text-[10px] text-muted-fg flex justify-between mt-1">
                      <span>{photo.dimensions}</span>
                      <span>{photo.size}</span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        )
      },
    },
    {
      title: 'Bidirectional Horizontal Stream (Zero-Oscillation Scroll Anchoring)',
      description: 'Horizontal infinite scroll with bidirectional left/right sliding windows (cap: 10 columns). Exact pixel-delta bounding rect anchoring prevents runaway oscillation loops.',
      render: () => {
        const [allTimelineMonths] = useState(() => {
          const startYear = 2020
          return Array.from({ length: 120 }, (_, i) => {
            const year = startYear + Math.floor(i / 12)
            const m = (i % 12) + 1
            const monthStr = `${year}-${String(m).padStart(2, '0')}`
            return {
              id: monthStr,
              num: i + 1,
              title: `${new Date(year, m - 1).toLocaleString('default', { month: 'short' })} ${year}`,
              tasks: 10 + ((i * 7) % 35),
              velocity: 85 + ((i * 13) % 15),
            }
          })
        })

        const [startMonthIdx, setStartMonthIdx] = useState(40)
        const [endMonthIdx, setEndMonthIdx] = useState(70)
        const [loadingStart, setLoadingStart] = useState(false)
        const [loadingEnd, setLoadingEnd] = useState(false)
        const [hWindow, setHWindow] = useState({ start: 0, end: 10 })

        const visibleMonths = useMemo(() => {
          return allTimelineMonths.slice(startMonthIdx, endMonthIdx)
        }, [allTimelineMonths, startMonthIdx, endMonthIdx])

        const handleHorizontalLoadMore = async (dir: 'top' | 'bottom' | 'start' | 'end' | 'left' | 'right') => {
          if (dir === 'top' || dir === 'start' || dir === 'left') {
            if (startMonthIdx <= 0 || loadingStart) return
            setLoadingStart(true)
            await new Promise((r) => setTimeout(r, 400))
            setStartMonthIdx((prev) => Math.max(0, prev - 4))
            setLoadingStart(false)
          } else {
            if (endMonthIdx >= allTimelineMonths.length || loadingEnd) return
            setLoadingEnd(true)
            await new Promise((r) => setTimeout(r, 400))
            setEndMonthIdx((prev) => Math.min(allTimelineMonths.length, prev + 4))
            setLoadingEnd(false)
          }
        }

        const mountedCards = Math.max(0, hWindow.end - hWindow.start)

        return (
          <div className="w-full max-w-2xl">
            {/* Horizontal Live Stats Bar */}
            <div className="mb-2.5 p-2.5 rounded-base border border-border bg-bg-surface shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="size-4 text-primary shrink-0" />
                  <span className="font-semibold text-fg">Horizontal Stream (Cap: 10 Columns)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  {loadingStart ? (
                    <Badge intent="warning" className="animate-pulse flex items-center gap-1">
                      <ArrowLeftIcon className="size-3" /> Prepending Left (+4)...
                    </Badge>
                  ) : loadingEnd ? (
                    <Badge intent="warning" className="animate-pulse flex items-center gap-1">
                      <ArrowRightIcon className="size-3" /> Appending Right (+4)...
                    </Badge>
                  ) : (
                    <Badge intent="success">Horizontal Anchored</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/40 text-[11px] font-mono">
                <div className="p-1 rounded bg-muted/30">
                  <span className="text-muted-fg text-[10px] block">Dataset Span</span>
                  <strong className="text-fg">#{startMonthIdx + 1}–#{endMonthIdx} / {allTimelineMonths.length}</strong>
                </div>
                <div className="p-1 rounded bg-muted/30">
                  <span className="text-muted-fg text-[10px] block">Render Window</span>
                  <strong className="text-primary">#{startMonthIdx + hWindow.start + 1}–#{startMonthIdx + hWindow.end}</strong>
                </div>
                <div className="p-1 rounded bg-muted/30">
                  <span className="text-muted-fg text-[10px] block">DOM Cards In Memory</span>
                  <strong className="text-primary">{mountedCards} cards</strong>
                </div>
                <div className="p-1 rounded bg-muted/30">
                  <span className="text-muted-fg text-[10px] block">Scroll Reposition</span>
                  <strong className="text-success font-semibold">Zero-Jitter Delta</strong>
                </div>
              </div>
            </div>

            <InfiniteScrollSection
              orientation="horizontal"
              items={visibleMonths}
              windowSize={10}
              appendCount={5}
              maxWidth="100%"
              enableStartLoad
              loadingStart={loadingStart}
              loadingEnd={loadingEnd}
              hasMoreStart={startMonthIdx > 0}
              hasMoreEnd={endMonthIdx < allTimelineMonths.length}
              onRenderWindowChange={(start, end) => setHWindow({ start, end })}
              onLoadMore={handleHorizontalLoadMore}
              className="p-2 border border-border rounded-base bg-card shadow-xs"
              renderItem={(month) => (
                <div
                  key={month.id}
                  className="w-44 p-3 rounded-base border border-border/70 bg-bg-surface flex flex-col justify-between shrink-0 shadow-xs hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                    <span className="font-semibold text-xs text-fg font-mono">{month.title}</span>
                    <Badge intent="primary" className="text-[10px] px-1 py-0">#{month.num}</Badge>
                  </div>
                  <div className="space-y-1 text-[11px] text-muted-fg">
                    <div className="flex items-center justify-between">
                      <span>Work Items</span>
                      <span className="font-mono text-fg font-medium">{month.tasks} tasks</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sprint Velocity</span>
                      <span className="font-mono text-success font-semibold">{month.velocity}%</span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        )
      },
    },
  ],
  recipes: [
    {
      title: 'Large-Scale Stream via InfiniteScrollSection.extend()',
      description: 'Pre-configure optimal thresholds and memory sliding windows for 2,000+ item feeds.',
      code: `export const TelemetryStream = InfiniteScrollSection.extend({\n  name: 'TelemetryStream',\n  props: {\n    maxHeight: 450,\n    threshold: 120,\n    windowSize: 80,\n    enableTopLoad: true,\n  },\n})`,
    },
  ],
  a11yNotes: [
    'Uses layout-effect position anchoring to maintain smooth scroll stability when loading batches.',
    'Screen readers announce progressive batch updates via live region announcements.',
  ],
}
