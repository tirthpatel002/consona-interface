import type {
  ComponentDoc,
  EngineDoc,
  HookDoc,
  InterfaceRegistry,
  PluginDoc,
  ProviderDoc,
  TypeDoc,
} from './types'

function stripDots(value: string): string {
  return value.replace(/\./g, '')
}

function pascalSegments(value: string): string {
  return value
    .split(/[-_./\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * Resolve a component (or family member) name against the AST registry.
 * Accepts export names, compound attachments (`Header`), dotted names
 * (`Calendar.Header`), and kebab/slug ids (`date-time-picker`).
 */
export function resolveComponentDoc(
  registry: InterfaceRegistry,
  rawName: string,
  rootName?: string
): ComponentDoc | undefined {
  const catalog = registry.components
  const query = rawName.trim()
  if (!query) return undefined

  const root = rootName ? catalog[rootName] : undefined
  const candidates: string[] = []

  const push = (value?: string) => {
    if (!value) return
    if (!candidates.includes(value)) candidates.push(value)
  }

  if (root?.attachments?.[query]) push(root.attachments[query])
  if (root?.attachments?.[pascalSegments(query)]) push(root.attachments[pascalSegments(query)])

  push(query)
  push(stripDots(query))
  push(pascalSegments(query))

  if (rootName) {
    push(`${rootName}${query}`)
    push(`${rootName}${stripDots(query)}`)
    push(`${rootName}${pascalSegments(query)}`)
    if (query.startsWith(rootName)) {
      const rest = query.slice(rootName.length)
      if (root?.attachments?.[rest]) push(root.attachments[rest])
      push(`${rootName}${rest}`)
    }
  }

  for (const candidate of candidates) {
    if (catalog[candidate]) return catalog[candidate]
  }

  const lower = query.toLowerCase()
  const strippedLower = stripDots(query).toLowerCase()
  for (const comp of Object.values(catalog)) {
    if (comp.name.toLowerCase() === lower || stripDots(comp.name).toLowerCase() === strippedLower) {
      return comp
    }
    if (comp.aliases?.some((alias) => alias.toLowerCase() === lower || stripDots(alias).toLowerCase() === strippedLower)) {
      return comp
    }
  }

  if (root) {
    const attachmentHit = Object.entries(root.attachments ?? {}).find(
      ([key, target]) =>
        key.toLowerCase() === lower ||
        target.toLowerCase() === lower ||
        `${root.name}${key}`.toLowerCase() === lower ||
        `${root.name}.${key}`.toLowerCase() === lower
    )
    if (attachmentHit) return catalog[attachmentHit[1]]
  }

  return undefined
}

export type AnyRegistryDoc = ComponentDoc | HookDoc | EngineDoc | ProviderDoc | TypeDoc

export interface FamilyMember {
  id: string
  displayName: string
  kind: 'component' | 'hook' | 'engine' | 'provider' | 'type'
  doc?: AnyRegistryDoc
}

/**
 * Resolves any item (component, hook, engine, provider, or type) from the registry.
 */
export function resolveAnyDoc(
  registry: InterfaceRegistry,
  rawName: string,
  rootName?: string
): { kind: 'component' | 'hook' | 'engine' | 'provider' | 'type'; doc: AnyRegistryDoc; id: string } | undefined {
  const compDoc = resolveComponentDoc(registry, rawName, rootName)
  if (compDoc) return { kind: 'component', doc: compDoc, id: compDoc.name }

  if (registry.hooks?.[rawName]) {
    return { kind: 'hook', doc: registry.hooks[rawName]!, id: rawName }
  }
  if (registry.engines?.[rawName]) {
    return { kind: 'engine', doc: registry.engines[rawName]!, id: rawName }
  }
  if (registry.providers?.[rawName]) {
    return { kind: 'provider', doc: registry.providers[rawName]!, id: rawName }
  }
  if (registry.types?.[rawName]) {
    return { kind: 'type', doc: registry.types[rawName]!, id: rawName }
  }

  // Case-insensitive fallback
  const lower = rawName.toLowerCase()
  if (registry.hooks) {
    const hit = Object.values(registry.hooks).find((h) => h.name.toLowerCase() === lower)
    if (hit) return { kind: 'hook', doc: hit, id: hit.name }
  }
  if (registry.engines) {
    const hit = Object.values(registry.engines).find((e) => e.name.toLowerCase() === lower)
    if (hit) return { kind: 'engine', doc: hit, id: hit.name }
  }
  if (registry.providers) {
    const hit = Object.values(registry.providers).find((p) => p.name.toLowerCase() === lower)
    if (hit) return { kind: 'provider', doc: hit, id: hit.name }
  }

  return undefined
}

export function listFamilyMembers(
  registry: InterfaceRegistry,
  rootName: string,
  extraNames: string[] = []
): FamilyMember[] {
  const rootComp = resolveComponentDoc(registry, rootName)
  const seen = new Set<string>()
  const members: FamilyMember[] = []

  const add = (rawName: string, displayHint?: string) => {
    const resolved = resolveAnyDoc(registry, rawName, rootComp?.name)
    const id = resolved?.id || rawName
    if (seen.has(id)) return
    seen.add(id)

    let displayName = displayHint || id
    const doc = resolved?.doc
    const kind = resolved?.kind || (rawName.startsWith('use') ? 'hook' : rawName.endsWith('Engine') ? 'engine' : rawName.endsWith('Provider') ? 'provider' : 'component')

    if (!displayHint && rootComp && resolved?.kind === 'component' && resolved.id !== rootComp.name) {
      const attachment = Object.entries(rootComp.attachments ?? {}).find(([, target]) => target === resolved.id)?.[0]
      if (attachment) {
        displayName = `${rootComp.name}.${attachment}`
      } else if (resolved.id.startsWith(rootComp.name)) {
        displayName = `${rootComp.name}.${resolved.id.slice(rootComp.name.length)}`
      }
    } else if (!displayHint && rootComp && !doc && rawName !== rootComp.name) {
      displayName = rawName.includes('.') ? rawName : `${rootComp.name}.${rawName}`
    }

    members.push({ id, displayName, kind, doc })
  }

  if (rootComp) {
    add(rootComp.name, rootComp.name)
  } else if (!extraNames.includes(rootName) && resolveAnyDoc(registry, rootName)) {
    add(rootName, rootName)
  }

  for (const extra of extraNames) add(extra)
  for (const sub of rootComp?.subComponents ?? []) add(sub)
  for (const target of Object.values(rootComp?.attachments ?? {})) add(target)
  for (const alias of rootComp?.aliases ?? []) add(alias)

  for (const slot of Object.values(rootComp?.slots ?? {})) {
    if (slot.resolvesTo) add(slot.resolvesTo)
  }

  if (members.length === 0) {
    add(rootName, rootName)
  }

  return members
}

function typeBaseName(slotType: string): string | undefined {
  const match = /ComponentType<\s*(?:React\.)?([A-Za-z][A-Za-z0-9_]*)/.exec(slotType)
  const name = match?.[1]
  if (!name || name === 'any' || name === 'SVGProps' || name === 'HTMLAttributes') return undefined
  return name
}

/** Resolve a slot occupant even when the type is `any` or an alias. */
export function inferResolvedSlotTarget(
  slot: { type: string; name?: string; description?: string; defaultComponent?: string; resolvesTo?: string },
  registry: InterfaceRegistry
): string | undefined {
  const catalog = registry.components
  const candidates: string[] = []

  const push = (value?: string) => {
    if (!value || candidates.includes(value)) return
    candidates.push(value)
  }

  push(slot.resolvesTo)

  const typeName = typeBaseName(slot.type)
  if (typeName) {
    push(typeName)
    if (typeName.endsWith('Props')) push(typeName.slice(0, -5))
  }

  push(slot.defaultComponent)

  const mentioned = slot.description?.match(/\b[A-Z][A-Za-z0-9_]+\b/g) ?? []
  for (const name of mentioned) push(name)

  if (slot.name) {
    push(slot.name.charAt(0).toUpperCase() + slot.name.slice(1))
  }

  for (const candidate of candidates) {
    if (catalog[candidate]) return candidate
  }
  return undefined
}

export function getResolvedSlots(registry: InterfaceRegistry, doc?: ComponentDoc) {
  if (!doc) return []
  return Object.entries(doc.slots).map(([name, slot]) => {
    const targetName = inferResolvedSlotTarget({ ...slot, name }, registry)
    const target = targetName ? registry.components[targetName] : undefined
    const props = {
      ...(target?.props ?? {}),
      ...(slot.props ?? {}),
    }
    return {
      name,
      slot: {
        ...slot,
        props: Object.keys(props).length > 0 ? props : slot.props,
        stateType: slot.stateType,
      },
      target,
      nestedSlots: target ? Object.keys(target.slots) : [],
    }
  })
}
