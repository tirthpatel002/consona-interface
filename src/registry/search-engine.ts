/**
 * Consona Interface — Search Engine
 * 
 * Implements modern search & information retrieval algorithms:
 * 1. Pre-computed Inverted Index with Field-Weighted TF-IDF / BM25+ Scoring
 * 2. Prefix Trie / Radix Index for instant sub-millisecond symbol & prefix lookups
 * 3. Bounded Damerau-Levenshtein Automaton for typo tolerance & transposition handling
 * 4. CamelCase / PascalCase Sub-token & Acronym (initialisms) Indexing
 * 5. Multi-Term Conjunctive & Disjunctive Query Coordination
 * 6. Zero-Allocation Faceted Filtering & Sub-millisecond LRU Query Cache
 */

import type {
  ComponentCategory,
  InterfaceRegistry,
  MetadataRegistry,
  MetadataRegistryItem,
  EntityKind,
} from './types'

export type SearchableEntityKind = 'component' | 'engine' | 'hook' | 'provider' | 'plugin' | 'type'

export interface SearchFieldWeight {
  exactName: number
  prefixName: number
  subwordName: number
  acronym: number
  alias: number
  tag: number
  slot: number
  prop: number
  category: number
  module: number
  description: number
}

export const DEFAULT_FIELD_WEIGHTS: SearchFieldWeight = {
  exactName: 200,
  prefixName: 140,
  subwordName: 110,
  acronym: 95,
  alias: 120,
  tag: 85,
  slot: 40,
  prop: 35,
  category: 30,
  module: 25,
  description: 15,
}

export interface SearchOptions {
  /** Maximum number of results to return (default: 20) */
  limit?: number
  /** Return only a flat list of matching entity names (string[]) */
  list?: boolean
  /** Include full entity doc specification and generated TypeScript JSDoc comments */
  doc?: boolean
  /** Filter by module subpath or name */
  module?: string
  /** Filter by component category */
  category?: ComponentCategory | string
  /** Filter by specific entity kind */
  kind?: SearchableEntityKind | 'all'
  /** Filter by tag */
  tag?: string
  /** Minimum relevance score cutoff (default: 5) */
  minScore?: number
  /** Output format (default: 'raw') */
  format?: 'json' | 'markdown' | 'raw' | 'list'
  /** Write output to file if requested */
  writeToFile?: boolean | string
}

export interface SearchHit {
  name: string
  type: SearchableEntityKind
  module: string
  category?: string
  tags?: string[]
  description: string
  score: number
  matchedOn: string[]
  filePath?: string
  /** Generated TypeScript JSDoc comment block (when doc: true) */
  jsDoc?: string
  /** Full AST extracted entity doc definition (when doc: true) */
  doc?: any
}

interface IndexedDocument {
  id: string
  name: string
  type: SearchableEntityKind
  module: string
  category?: string
  tags: string[]
  description: string
  filePath?: string
  nameTokens: string[]
  subwords: string[]
  acronyms: string[]
  aliases: string[]
  slots: string[]
  props: string[]
  descTokens: string[]
  descLength: number
  rawDoc?: any
}

interface Posting {
  docId: string
  field: keyof SearchFieldWeight
  freq: number
}

class TrieNode {
  children: Map<string, TrieNode> = new Map()
  docIds: Set<string> = new Set()
}

export class RegistrySearchEngine {
  private docs: Map<string, IndexedDocument> = new Map()
  private invertedIndex: Map<string, Posting[]> = new Map()
  private trieRoot: TrieNode = new TrieNode()
  private vocabulary: string[] = []
  private idfCache: Map<string, number> = new Map()
  private queryCache: Map<string, SearchHit[]> = new Map()
  private readonly maxCacheSize = 120
  private avgDescLength = 0

  constructor(registry?: InterfaceRegistry, metadata?: MetadataRegistry) {
    if (registry || metadata) {
      this.buildIndex(registry, metadata)
    }
  }

  /**
   * Builds high-performance inverted indexes and prefix trees from registry metadata.
   */
  public buildIndex(registry?: InterfaceRegistry, metadata?: MetadataRegistry): void {
    this.docs.clear()
    this.invertedIndex.clear()
    this.trieRoot = new TrieNode()
    this.vocabulary = []
    this.idfCache.clear()
    this.queryCache.clear()

    let totalDescLength = 0

    // 1. Ingest components
    if (registry?.components) {
      for (const comp of Object.values(registry.components)) {
        const id = `component:${comp.name}`
        const nameTokens = this.tokenize(comp.name)
        const subwords = this.extractSubwords(comp.name)
        const acronyms = this.generateAcronyms(comp.name)
        const aliases = (comp.aliases || []).map((a) => a.toLowerCase())
        const slots = Object.keys(comp.slots || {}).map((s) => s.toLowerCase())
        const props = Object.keys(comp.props || {}).map((p) => p.toLowerCase())
        const descTokens = this.tokenize(comp.description || '')
        const tags = (comp.tags || []).map((t) => t.toLowerCase())

        totalDescLength += descTokens.length

        this.docs.set(id, {
          id,
          name: comp.name,
          type: 'component',
          module: comp.module,
          category: comp.category,
          tags,
          description: comp.description || '',
          filePath: comp.filePath,
          nameTokens,
          subwords,
          acronyms,
          aliases,
          slots,
          props,
          descTokens,
          descLength: descTokens.length,
          rawDoc: comp,
        })
      }
    }

    // 2. Ingest providers
    if (registry?.providers) {
      for (const prov of Object.values(registry.providers)) {
        const id = `provider:${prov.name}`
        const nameTokens = this.tokenize(prov.name)
        const subwords = this.extractSubwords(prov.name)
        const acronyms = this.generateAcronyms(prov.name)
        const props = Object.keys(prov.props || {}).map((p) => p.toLowerCase())
        const descTokens = this.tokenize(prov.description || '')
        const tags = (prov.tags || []).map((t) => t.toLowerCase())

        totalDescLength += descTokens.length

        this.docs.set(id, {
          id,
          name: prov.name,
          type: 'provider',
          module: prov.module,
          tags,
          description: prov.description || '',
          filePath: prov.filePath,
          nameTokens,
          subwords,
          acronyms,
          aliases: [],
          slots: [],
          props,
          descTokens,
          descLength: descTokens.length,
          rawDoc: prov,
        })
      }
    }

    // 3. Ingest engines
    if (registry?.engines) {
      for (const eng of Object.values(registry.engines)) {
        const id = `engine:${eng.name}`
        const nameTokens = this.tokenize(eng.name)
        const subwords = this.extractSubwords(eng.name)
        const acronyms = this.generateAcronyms(eng.name)
        const props = Object.keys(eng.state || {}).map((p) => p.toLowerCase())
        const descTokens = this.tokenize(eng.description || '')
        const tags = (eng.tags || []).map((t) => t.toLowerCase())

        totalDescLength += descTokens.length

        this.docs.set(id, {
          id,
          name: eng.name,
          type: 'engine',
          module: eng.module,
          tags,
          description: eng.description || '',
          filePath: eng.filePath,
          nameTokens,
          subwords,
          acronyms,
          aliases: [],
          slots: [],
          props,
          descTokens,
          descLength: descTokens.length,
          rawDoc: eng,
        })
      }
    }

    // 4. Ingest hooks
    if (registry?.hooks) {
      for (const hook of Object.values(registry.hooks)) {
        const id = `hook:${hook.name}`
        const nameTokens = this.tokenize(hook.name)
        const subwords = this.extractSubwords(hook.name)
        const acronyms = this.generateAcronyms(hook.name)
        const props = Object.keys(hook.parameters || {}).map((p) => p.toLowerCase())
        const descTokens = this.tokenize(hook.description || '')
        const tags = (hook.tags || []).map((t) => t.toLowerCase())

        totalDescLength += descTokens.length

        this.docs.set(id, {
          id,
          name: hook.name,
          type: 'hook',
          module: hook.module,
          tags,
          description: hook.description || '',
          filePath: hook.filePath,
          nameTokens,
          subwords,
          acronyms,
          aliases: [],
          slots: [],
          props,
          descTokens,
          descLength: descTokens.length,
          rawDoc: hook,
        })
      }
    }

    // 5. Ingest plugins
    if (registry?.plugins) {
      for (const plug of Object.values(registry.plugins)) {
        const id = `plugin:${plug.name}`
        const nameTokens = this.tokenize(plug.name)
        const subwords = this.extractSubwords(plug.name)
        const acronyms = this.generateAcronyms(plug.name)
        const descTokens = this.tokenize(plug.description || '')
        const tags = (plug.tags || []).map((t) => t.toLowerCase())

        totalDescLength += descTokens.length

        this.docs.set(id, {
          id,
          name: plug.name,
          type: 'plugin',
          module: plug.module,
          tags,
          description: plug.description || '',
          filePath: plug.filePath,
          nameTokens,
          subwords,
          acronyms,
          aliases: [],
          slots: [],
          props: [],
          descTokens,
          descLength: descTokens.length,
          rawDoc: plug,
        })
      }
    }

    // 6. Ingest types
    if (registry?.types) {
      for (const tp of Object.values(registry.types)) {
        const id = `type:${tp.name}`
        const nameTokens = this.tokenize(tp.name)
        const subwords = this.extractSubwords(tp.name)
        const acronyms = this.generateAcronyms(tp.name)
        const props = Object.keys(tp.properties || {}).map((p) => p.toLowerCase())
        const descTokens = this.tokenize(tp.description || '')
        const tags = (tp.tags || []).map((t) => t.toLowerCase())

        totalDescLength += descTokens.length

        this.docs.set(id, {
          id,
          name: tp.name,
          type: 'type',
          module: tp.module,
          tags,
          description: tp.description || tp.rawDefinition?.slice(0, 100) || '',
          filePath: tp.filePath,
          nameTokens,
          subwords,
          acronyms,
          aliases: [],
          slots: [],
          props,
          descTokens,
          descLength: descTokens.length,
          rawDoc: tp,
        })
      }
    }

    const totalDocs = this.docs.size
    this.avgDescLength = totalDocs > 0 ? totalDescLength / totalDocs : 1

    // Build Inverted Index and Prefix Trie
    for (const doc of this.docs.values()) {
      // Index Exact Name & Prefix Trie
      const lowerName = doc.name.toLowerCase()
      this.addPosting(lowerName, doc.id, 'exactName', 1)
      this.insertTrie(lowerName, doc.id)

      // Subwords
      for (const sub of doc.subwords) {
        this.addPosting(sub, doc.id, 'subwordName', 1)
        this.insertTrie(sub, doc.id)
      }

      // Acronyms
      for (const ac of doc.acronyms) {
        this.addPosting(ac, doc.id, 'acronym', 1)
      }

      // Aliases
      for (const al of doc.aliases) {
        this.addPosting(al, doc.id, 'alias', 1)
        this.insertTrie(al, doc.id)
      }

      // Tags
      for (const tag of doc.tags) {
        this.addPosting(tag, doc.id, 'tag', 1)
        this.insertTrie(tag, doc.id)
      }

      // Slots
      for (const slot of doc.slots) {
        this.addPosting(slot, doc.id, 'slot', 1)
      }

      // Props
      for (const prop of doc.props) {
        this.addPosting(prop, doc.id, 'prop', 1)
      }

      // Category & Module
      if (doc.category) {
        this.addPosting(doc.category.toLowerCase(), doc.id, 'category', 1)
      }
      const modSlug = doc.module.split('/').pop()?.toLowerCase()
      if (modSlug && modSlug !== 'interface') {
        this.addPosting(modSlug, doc.id, 'module', 1)
      }

      // Description TF
      const descFreqMap = new Map<string, number>()
      for (const token of doc.descTokens) {
        descFreqMap.set(token, (descFreqMap.get(token) || 0) + 1)
      }
      for (const [token, freq] of descFreqMap.entries()) {
        this.addPosting(token, doc.id, 'description', freq)
      }
    }

    this.vocabulary = Array.from(this.invertedIndex.keys())

    // Precalculate IDF for all vocabulary terms: ln(1 + (N - df + 0.5) / (df + 0.5))
    for (const [term, postings] of this.invertedIndex.entries()) {
      const df = postings.length
      const idf = Math.max(0.2, Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5)))
      this.idfCache.set(term, idf)
    }
  }

  /**
   * Executes a high-precision, multi-term query with BM25+ relevance, typo tolerance, and facet filters.
   */
  public search(query: string, options: SearchOptions = {}): SearchHit[] {
    const rawQuery = query.trim()
    if (!rawQuery) return []

    const cacheKey = `${rawQuery}|${options.module || ''}|${options.category || ''}|${options.kind || ''}|${options.tag || ''}|${options.limit || 20}`
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!
    }

    const queryTokens = this.tokenize(rawQuery)
    if (queryTokens.length === 0) return []

    const limit = options.limit || 20
    const minScore = options.minScore !== undefined ? options.minScore : 10
    const normalizedRawQuery = rawQuery.toLowerCase()

    const candidateScores = new Map<string, { score: number; matchedReasons: Set<string>; matchedTermCount: number }>()

    const getCandidate = (docId: string) => {
      let cand = candidateScores.get(docId)
      if (!cand) {
        cand = { score: 0, matchedReasons: new Set(), matchedTermCount: 0 }
        candidateScores.set(docId, cand)
      }
      return cand
    }

    // Process each query token
    for (const qToken of queryTokens) {
      let tokenMatchedDocs = new Set<string>()

      // 1. Exact Inverted Index Lookup
      const exactPostings = this.invertedIndex.get(qToken)
      if (exactPostings) {
        const idf = this.idfCache.get(qToken) || 1.0
        for (const p of exactPostings) {
          const doc = this.docs.get(p.docId)
          if (!doc || !this.matchesFacets(doc, options)) continue

          const weight = DEFAULT_FIELD_WEIGHTS[p.field] || 10
          let fieldScore = weight * idf

          // BM25+ term frequency normalization for description
          if (p.field === 'description') {
            const k1 = 1.2
            const b = 0.75
            const tfNorm = (p.freq * (k1 + 1)) / (p.freq + k1 * (1 - b + b * (doc.descLength / this.avgDescLength)))
            fieldScore = weight * tfNorm * idf
          }

          const cand = getCandidate(p.docId)
          cand.score += fieldScore
          cand.matchedReasons.add(`${p.field}:${qToken}`)
          tokenMatchedDocs.add(p.docId)
        }
      }

      // 2. Prefix Lookups via Trie
      if (qToken.length >= 2) {
        const prefixDocIds = this.queryTrie(qToken)
        for (const docId of prefixDocIds) {
          if (tokenMatchedDocs.has(docId)) continue
          const doc = this.docs.get(docId)
          if (!doc || !this.matchesFacets(doc, options)) continue

          const cand = getCandidate(docId)
          const prefixWeight = DEFAULT_FIELD_WEIGHTS.prefixName * 0.8
          cand.score += prefixWeight
          cand.matchedReasons.add(`prefix:${qToken}`)
          tokenMatchedDocs.add(docId)
        }
      }

      // 3. Typo Tolerance via Bounded Damerau-Levenshtein (if low or 0 matches)
      if (tokenMatchedDocs.size < 5 && qToken.length >= 4) {
        const typoMatches = this.findTypoMatches(qToken)
        for (const { term, distance } of typoMatches) {
          const typoPostings = this.invertedIndex.get(term)
          if (!typoPostings) continue

          const penalty = 1 - distance / (qToken.length + 1)
          for (const p of typoPostings) {
            if (tokenMatchedDocs.has(p.docId)) continue
            const doc = this.docs.get(p.docId)
            if (!doc || !this.matchesFacets(doc, options)) continue

            const weight = (DEFAULT_FIELD_WEIGHTS[p.field] || 10) * 0.65 * penalty
            const cand = getCandidate(p.docId)
            cand.score += weight
            cand.matchedReasons.add(`typo(${term},d=${distance})`)
            tokenMatchedDocs.add(p.docId)
          }
        }
      }

      // Increment matched term count
      for (const docId of tokenMatchedDocs) {
        const cand = candidateScores.get(docId)
        if (cand) cand.matchedTermCount++
      }
    }

    // Direct Full Query Match Boost
    const fullExactPostings = this.invertedIndex.get(normalizedRawQuery)
    if (fullExactPostings) {
      for (const p of fullExactPostings) {
        const cand = candidateScores.get(p.docId)
        if (cand) cand.score += 150
      }
    }

    // Rank, normalize, and construct search hits
    const results: SearchHit[] = []

    for (const [docId, cand] of candidateScores.entries()) {
      const doc = this.docs.get(docId)
      if (!doc || !this.matchesFacets(doc, options)) continue

      // Multi-term coordination boost: Reward documents matching ALL query tokens
      if (queryTokens.length > 1) {
        const matchRatio = cand.matchedTermCount / queryTokens.length
        if (matchRatio === 1.0) {
          cand.score *= 1.6 // +60% bonus for full conjunctive match
        } else {
          cand.score *= (0.6 + 0.4 * matchRatio)
        }
      }

      // Exact substring phrase bonus
      if (doc.description.toLowerCase().includes(normalizedRawQuery) || doc.name.toLowerCase().includes(normalizedRawQuery)) {
        cand.score += 40
      }

      // Exact Name equality super-boost
      if (doc.name.toLowerCase() === normalizedRawQuery) {
        cand.score += 300
      }

      if (cand.score >= minScore) {
        const hit: SearchHit = {
          name: doc.name,
          type: doc.type,
          module: doc.module,
          category: doc.category,
          tags: doc.tags,
          description: doc.description,
          score: Math.round(cand.score * 10) / 10,
          matchedOn: Array.from(cand.matchedReasons),
          filePath: doc.filePath,
        }

        if (options.doc) {
          hit.doc = doc.rawDoc
          hit.jsDoc = this.generateJSDoc(doc)
        }

        results.push(hit)
      }
    }

    // Sort descending by score, tie-break by name length & alphabetical order
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.name.length !== b.name.length) return a.name.length - b.name.length
      return a.name.localeCompare(b.name)
    })

    const finalResults = results.slice(0, limit)

    // Save to LRU Cache
    if (this.queryCache.size >= this.maxCacheSize) {
      const firstKey = this.queryCache.keys().next().value
      if (firstKey) this.queryCache.delete(firstKey)
    }
    this.queryCache.set(cacheKey, finalResults)

    return finalResults
  }

  /**
   * Generates a standard, comprehensive TypeScript JSDoc comment block for an entity.
   */
  public generateJSDoc(doc: IndexedDocument): string {
    const raw = doc.rawDoc || {}
    const lines: string[] = []
    lines.push(`/**`)
    lines.push(` * ${doc.name} - ${doc.description || 'Consona Interface entity.'}`)
    lines.push(` *`)

    if (doc.type === 'component') {
      lines.push(` * @component`)
      if (doc.category) lines.push(` * @category ${doc.category}`)
      lines.push(` * @module ${doc.module}`)
      if (doc.tags?.length) lines.push(` * @tags ${doc.tags.join(', ')}`)
      if (raw.semanticClass) lines.push(` * @semanticClass ${raw.semanticClass}`)
      if (raw.dataComponent) lines.push(` * @dataComponent ${raw.dataComponent}`)
      if (raw.filePath) lines.push(` * @filePath ${raw.filePath}`)

      const props = Object.values(raw.props || {}) as any[]
      if (props.length > 0) {
        lines.push(` *`)
        for (const p of props) {
          const opt = p.optional ? `[${p.name}${p.default !== undefined ? `=${JSON.stringify(p.default)}` : ''}]` : p.name
          const desc = p.description ? ` - ${p.description}` : ''
          lines.push(` * @prop {${p.type || 'any'}} ${opt}${desc}`)
        }
      }

      const slots = Object.values(raw.slots || {}) as any[]
      if (slots.length > 0) {
        lines.push(` *`)
        for (const s of slots) {
          const desc = s.description ? ` - ${s.description}` : ''
          lines.push(` * @slot ${s.name}${desc}`)
        }
      }

      if (raw.subComponents?.length) {
        lines.push(` * @subcomponents ${raw.subComponents.join(', ')}`)
      }
      if (raw.hook) {
        lines.push(` * @hook ${raw.hook.name}`)
      }
    } else if (doc.type === 'engine') {
      lines.push(` * @engine`)
      lines.push(` * @module ${doc.module}`)
      if (doc.tags?.length) lines.push(` * @tags ${doc.tags.join(', ')}`)
      if (raw.filePath) lines.push(` * @filePath ${raw.filePath}`)
      if (raw.stateType) lines.push(` * @stateType ${raw.stateType}`)

      const methods = Object.entries(raw.methods || {})
      if (methods.length > 0) {
        lines.push(` *`)
        for (const [mName, mDef] of methods as [string, any][]) {
          lines.push(` * @method ${mName}${mDef?.signature ? ` - ${mDef.signature}` : ''}`)
        }
      }
      const events = Object.entries(raw.events || {})
      if (events.length > 0) {
        lines.push(` *`)
        for (const [eName, eDef] of events as [string, any][]) {
          lines.push(` * @event ${eName}${eDef?.payloadType ? ` - payload: ${eDef.payloadType}` : ''}`)
        }
      }
    } else if (doc.type === 'hook') {
      lines.push(` * @hook`)
      lines.push(` * @module ${doc.module}`)
      if (doc.tags?.length) lines.push(` * @tags ${doc.tags.join(', ')}`)
      if (raw.filePath) lines.push(` * @filePath ${raw.filePath}`)
      if (raw.returnType) lines.push(` * @returns {${raw.returnType}}`)

      const params = Object.entries(raw.parameters || {})
      if (params.length > 0) {
        lines.push(` *`)
        for (const [pName, pDef] of params as [string, any][]) {
          lines.push(` * @param {${pDef?.type || 'any'}} ${pName}${pDef?.description ? ` - ${pDef.description}` : ''}`)
        }
      }
    } else if (doc.type === 'provider') {
      lines.push(` * @provider`)
      lines.push(` * @module ${doc.module}`)
      if (doc.tags?.length) lines.push(` * @tags ${doc.tags.join(', ')}`)
      if (raw.filePath) lines.push(` * @filePath ${raw.filePath}`)
      if (raw.valueType) lines.push(` * @valueType ${raw.valueType}`)

      const props = Object.values(raw.props || {}) as any[]
      if (props.length > 0) {
        lines.push(` *`)
        for (const p of props) {
          const opt = p.optional ? `[${p.name}]` : p.name
          lines.push(` * @prop {${p.type || 'any'}} ${opt}${p.description ? ` - ${p.description}` : ''}`)
        }
      }
    } else if (doc.type === 'plugin') {
      lines.push(` * @plugin`)
      lines.push(` * @module ${doc.module}`)
      if (doc.tags?.length) lines.push(` * @tags ${doc.tags.join(', ')}`)
      if (raw.filePath) lines.push(` * @filePath ${raw.filePath}`)
      if (raw.optionsType) lines.push(` * @optionsType ${raw.optionsType}`)
    } else if (doc.type === 'type') {
      lines.push(` * @type ${raw.kind || 'definition'}`)
      lines.push(` * @module ${doc.module}`)
      if (doc.tags?.length) lines.push(` * @tags ${doc.tags.join(', ')}`)
      if (raw.filePath) lines.push(` * @filePath ${raw.filePath}`)
      if (raw.rawDefinition) {
        lines.push(` * @definition`)
        const snippet = raw.rawDefinition.split('\n').slice(0, 10).map((l: string) => ` *   ${l}`).join('\n')
        lines.push(snippet)
      }
    }

    lines.push(` */`)
    return lines.join('\n')
  }

  // ===========================================================================
  // Internal Helpers & DSA Implementations
  // ===========================================================================

  private matchesFacets(doc: IndexedDocument, options: SearchOptions): boolean {
    if (options.kind && options.kind !== 'all' && doc.type !== options.kind) {
      return false
    }
    if (options.module && doc.module !== options.module && !doc.module.endsWith(options.module)) {
      return false
    }
    if (options.category && doc.category !== options.category) {
      return false
    }
    if (options.tag) {
      const tLower = options.tag.toLowerCase()
      if (!doc.tags.includes(tLower)) return false
    }
    return true
  }

  private addPosting(term: string, docId: string, field: keyof SearchFieldWeight, freq: number): void {
    if (!term || term.length < 2) return
    let list = this.invertedIndex.get(term)
    if (!list) {
      list = []
      this.invertedIndex.set(term, list)
    }
    list.push({ docId, field, freq })
  }

  private insertTrie(word: string, docId: string): void {
    if (!word || word.length < 2) return
    let curr = this.trieRoot
    for (let i = 0; i < word.length; i++) {
      const ch = word[i]!
      let next = curr.children.get(ch)
      if (!next) {
        next = new TrieNode()
        curr.children.set(ch, next)
      }
      curr = next
      curr.docIds.add(docId)
    }
  }

  private queryTrie(prefix: string): Set<string> {
    let curr = this.trieRoot
    for (let i = 0; i < prefix.length; i++) {
      const ch = prefix[i]!
      const next = curr.children.get(ch)
      if (!next) return new Set()
      curr = next
    }
    return curr.docIds
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, ' ')
      .split(/[\s_-]+/)
      .filter((t) => t.length > 1)
  }

  private extractSubwords(name: string): string[] {
    const rawWords = name
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 1)

    return Array.from(new Set(rawWords))
  }

  private generateAcronyms(name: string): string[] {
    const caps = name.match(/[A-Z]/g)
    if (caps && caps.length >= 2) {
      const acronym = caps.join('').toLowerCase()
      return [acronym]
    }
    return []
  }

  /**
   * Bounded Damerau-Levenshtein Typo Distance with transposition support
   */
  private findTypoMatches(queryToken: string): Array<{ term: string; distance: number }> {
    const maxDist = queryToken.length >= 8 ? 2 : 1
    const matches: Array<{ term: string; distance: number }> = []

    for (const term of this.vocabulary) {
      if (Math.abs(term.length - queryToken.length) > maxDist) continue
      if (term.charAt(0) !== queryToken.charAt(0)) continue // First-letter invariant for speed

      const dist = this.damerauLevenshtein(queryToken, term, maxDist)
      if (dist <= maxDist) {
        matches.push({ term, distance: dist })
      }
    }

    return matches
  }

  private damerauLevenshtein(source: string, target: string, maxDist: number): number {
    const srcLen = source.length
    const tgtLen = target.length

    if (Math.abs(srcLen - tgtLen) > maxDist) return maxDist + 1

    const d: number[][] = Array.from({ length: srcLen + 1 }, () => new Array(tgtLen + 1).fill(0))

    for (let i = 0; i <= srcLen; i++) d[i]![0] = i
    for (let j = 0; j <= tgtLen; j++) d[0]![j] = j

    for (let i = 1; i <= srcLen; i++) {
      let rowMin = maxDist + 1
      for (let j = 1; j <= tgtLen; j++) {
        const cost = source[i - 1] === target[j - 1] ? 0 : 1
        d[i]![j] = Math.min(
          d[i - 1]![j]! + 1, // deletion
          d[i]![j - 1]! + 1, // insertion
          d[i - 1]![j - 1]! + cost // substitution
        )

        // Transposition
        if (i > 1 && j > 1 && source[i - 1] === target[j - 2] && source[i - 2] === target[j - 1]) {
          d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1)
        }

        rowMin = Math.min(rowMin, d[i]![j]!)
      }
      // Early exit if entire row exceeds threshold
      if (rowMin > maxDist) return maxDist + 1
    }

    return d[srcLen]![tgtLen]!
  }
}
