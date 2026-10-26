import React from 'react'
import { DiffViewer } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const oldSampleCode = `import { apiClient, TelemetryProvider, createTraceSpan, CacheStrategy } from '@consona/kernel-net'
import type { RequestOptions, UserPayload, ApiResponse, SessionCredentials } from '@consona/types/api'

export async function synchronizeUserData(credentials: SessionCredentials, options?: RequestOptions): Promise<ApiResponse<UserPayload>> {
  const span = createTraceSpan('sync_user_data', { accountId: credentials.accountId, region: credentials.preferredRegion })
  const endpointUrl = \`https://api.\${credentials.preferredRegion || 'us-east-1'}.consona.internal/v2/users/\${credentials.accountId}/records\`

  try {
    const rawResponse = await apiClient.get<UserPayload>(endpointUrl, { timeout: 5000, headers: { 'Authorization': \`Bearer \${credentials.token}\` } })
    const sanitized = { id: rawResponse.data.id, email: rawResponse.data.email, roles: rawResponse.data.roles, lastLogin: Date.now() }
    span.setTag('sync_status', 'legacy_success')
    return { status: 200, data: sanitized, cached: false, durationMs: span.elapsedTime() }
  } catch (err: any) {
    span.recordException(err)
    return { status: 500, error: err.message, cached: false, durationMs: span.elapsedTime() }
  } finally {
    span.finish()
  }
}`

const newSampleCode = `import { apiClient, TelemetryProvider, createTraceSpan, CacheStrategy, ExponentialBackoff } from '@consona/kernel-net'
import type { RequestOptions, UserPayload, ApiResponse, SessionCredentials, DistributedTraceContext } from '@consona/types/api'
import { userPayloadSchema, type ValidatedUserRecord } from '@/modules/identity/schemas/user-validator'

export async function synchronizeUserData(
  credentials: SessionCredentials,
  options: RequestOptions & { bypassCache?: boolean; traceContext?: DistributedTraceContext } = {}
): Promise<ApiResponse<ValidatedUserRecord>> {
  const span = createTraceSpan('sync_user_data_v3', { accountId: credentials.accountId, region: credentials.preferredRegion, traceId: options.traceContext?.traceId })
  const cacheKey = \`user:payload:\${credentials.accountId}:\${credentials.preferredRegion || 'default'}\`
  const endpointUrl = \`https://gateway.\${credentials.preferredRegion || 'us-east-1'}.consona.io/v3/tenants/\${credentials.tenantId}/users/\${credentials.accountId}/snapshot\`

  if (!options.bypassCache) {
    const cachedEntry = await CacheStrategy.distributed.get<ValidatedUserRecord>(cacheKey, { staleWhileRevalidate: 300 })
    if (cachedEntry) {
      span.setTag('cache_hit', true)
      return { status: 200, data: cachedEntry, cached: true, durationMs: span.elapsedTime() }
    }
  }

  try {
    const rawResponse = await apiClient.get<unknown>(endpointUrl, {
      timeoutMs: options.timeoutMs ?? 7500,
      retryPolicy: new ExponentialBackoff({ maxRetries: 3, baseDelayMs: 250, backoffFactor: 2 }),
      headers: { 'Authorization': \`Bearer \${credentials.token}\`, 'X-Consona-Trace-ID': options.traceContext?.traceId ?? crypto.randomUUID() }
    })

    const validatedData = await userPayloadSchema.parseAsync(rawResponse.data)
    await CacheStrategy.distributed.set(cacheKey, validatedData, { ttlSeconds: 1800, compression: 'gzip' })
    span.setAttributes({ 'sync_status': 'verified_v3', 'record_count': Object.keys(validatedData).length })
    return { status: 200, data: validatedData, cached: false, durationMs: span.elapsedTime() }
  } catch (err) {
    const normalizedError = err instanceof Error ? err : new Error(String(err))
    span.recordException(normalizedError)
    TelemetryProvider.capture('sync_failure', { tenantId: credentials.tenantId, reason: normalizedError.message })
    return { status: 502, error: normalizedError.message, cached: false, durationMs: span.elapsedTime() }
  } finally {
    span.finish()
  }
}`

export const diffViewerDoc: ComponentDocSpec = {
  id: 'diff-viewer',
  name: 'DiffViewer',
  component: DiffViewer,
  summary: 'Code and text diff visualizer supporting unified inline diffs and synchronized dual-scrolling split comparison sliders.',
  subcomponents: ['DiffViewer'],
  playground: {
    defaultProps: {
      filename: 'data-synchronizer.ts',
      defaultViewMode: 'split',
      showModeSwitch: true,
      showLineNumbers: true,
      showStats: true,
      copyable: true,
      maxHeight: 460,
    },
    controls: [
      { name: 'defaultViewMode', type: 'select', options: ['split', 'unified'] },
      { name: 'showModeSwitch', type: 'boolean' },
      { name: 'showLineNumbers', type: 'boolean' },
      { name: 'showStats', type: 'boolean' },
      { name: 'copyable', type: 'boolean' },
      { name: 'maxHeight', type: 'number', min: 250, max: 700, step: 50 },
    ],
    render: (props: any) => (
      <div className="w-full max-w-5xl p-2 sm:p-4">
        <DiffViewer
          oldValue={oldSampleCode}
          newValue={newSampleCode}
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Full Pipeline Refactor (Split Slider View)',
      description: 'Side-by-side comparison with interactive divider slider inspecting an upgraded caching layer with metrics and eviction policies.',
      render: () => (
        <div className="w-full max-w-5xl">
          <DiffViewer
            filename="cache-coordinator.ts"
            defaultViewMode="split"
            showModeSwitch={true}
            maxHeight={440}
            oldValue={`export class MemoryCache<T = unknown> {
  private store = new Map<string, { value: T; createdAt: number }>()

  public get(key: string): T | undefined {
    const record = this.store.get(key)
    return record ? record.value : undefined
  }

  public set(key: string, value: T): void {
    this.store.set(key, { value, createdAt: Date.now() })
  }

  public delete(key: string): boolean {
    return this.store.delete(key)
  }

  public clear(): void {
    this.store.clear()
  }
}`}
            newValue={`export interface CacheEntry<T> { value: T; expiresAt: number; hitCount: number; byteLength: number; checksum: string }

export class DistributedLRUCache<T = unknown> {
  private readonly store = new Map<string, CacheEntry<T>>()
  private readonly maxEntries: number
  private readonly defaultTtlMs: number

  constructor(options: { maxEntries?: number; defaultTtlMs?: number; enableCompression?: boolean } = {}) {
    this.maxEntries = options.maxEntries ?? 10_000
    this.defaultTtlMs = options.defaultTtlMs ?? 60_000 * 15
  }

  public get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      Telemetry.emit('cache_expired', { key, lifetimeMs: Date.now() - (entry.expiresAt - this.defaultTtlMs) })
      return undefined
    }

    entry.hitCount++
    // Move to most recently used position in map
    this.store.delete(key)
    this.store.set(key, entry)
    return entry.value
  }

  public set(key: string, value: T, ttlMs: number = this.defaultTtlMs): void {
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value
      if (oldestKey) { this.store.delete(oldestKey); Telemetry.emit('cache_evicted_lru', { evictedKey: oldestKey }) }
    }

    const payload = JSON.stringify(value)
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs, hitCount: 0, byteLength: payload.length, checksum: hashString(payload) })
  }

  public getMetrics(): { totalEntries: number; totalBytes: number; hitRatio: number } {
    let hits = 0; let bytes = 0
    this.store.forEach((e) => { hits += e.hitCount; bytes += e.byteLength })
    return { totalEntries: this.store.size, totalBytes: bytes, hitRatio: this.store.size > 0 ? hits / this.store.size : 0 }
  }

  public clear(): void {
    this.store.clear()
    Telemetry.emit('cache_cleared', { timestamp: Date.now() })
  }
}`}
          />
        </div>
      ),
    },
    {
      title: 'Unified Production Deployment Diff (Kubernetes PodSpec)',
      description: 'Unified inline view with color-coded diff markers and line numbers for cluster workloads.',
      render: () => (
        <div className="w-full max-w-5xl">
          <DiffViewer
            filename="production-pod-spec.yaml"
            defaultViewMode="unified"
            showModeSwitch={true}
            maxHeight={380}
            oldValue={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: billing-pipeline-worker
  namespace: production
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: worker
          image: registry.consona.internal/workers/billing:v2.1.4
          env:
            - name: NODE_ENV
              value: "production"
            - name: DB_MAX_CONNECTIONS
              value: "25"
          resources:
            limits: { cpu: "1000m", memory: "1024Mi" }
            requests: { cpu: "250m", memory: "256Mi" }`}
            newValue={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: billing-pipeline-worker
  namespace: production
  labels: { tier: "financial", compliance: "sox-audit", monitored: "prometheus-v2" }
spec:
  replicas: 6
  strategy: { type: RollingUpdate, rollingUpdate: { maxSurge: "25%", maxUnavailable: "0%" } }
  template:
    spec:
      topologySpreadConstraints:
        - { maxSkew: 1, topologyKey: "topology.kubernetes.io/zone", whenUnsatisfiable: DoNotSchedule }
      containers:
        - name: worker
          image: registry.consona.io/finance/billing-pipeline-worker:v3.4.0-alpine
          imagePullPolicy: IfNotPresent
          env:
            - { name: NODE_ENV, value: "production" }
            - { name: DB_MAX_CONNECTIONS, value: "100" }
            - { name: OTEL_EXPORTER_OTLP_ENDPOINT, value: "http://otel-collector.monitoring.svc.cluster.local:4318" }
            - { name: ENABLE_DISTRIBUTED_TRANSACTIONS, value: "true" }
          securityContext: { allowPrivilegeEscalation: false, readOnlyRootFilesystem: true, runAsNonRoot: true, runAsUser: 10001 }
          resources:
            limits: { cpu: "2000m", memory: "2048Mi" }
            requests: { cpu: "500m", memory: "512Mi" }
          livenessProbe: { httpGet: { path: "/healthz/liveness", port: 8080 }, initialDelaySeconds: 15, periodSeconds: 10 }
          readinessProbe: { httpGet: { path: "/healthz/readiness", port: 8080 }, initialDelaySeconds: 5, periodSeconds: 5 }`}
          />
        </div>
      ),
    },
  ],
}
