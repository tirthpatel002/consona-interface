import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import type {
  ComponentCategory,
  ComponentDoc,
  ComponentPropDoc,
  ComponentSlotDoc,
  EngineDoc,
  HookDoc,
  InterfaceRegistry,
  MetadataRegistry,
  MetadataRegistryItem,
  ModuleSummaryDoc,
  PluginDoc,
  ProviderDoc,
  TypeDoc,
  RegistryGraphEdge,
} from './types'
import { inferResolvedSlotTarget } from './resolve.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REGISTRY_DIR = __dirname
const SRC_DIR = path.resolve(__dirname, '..')
const ROOT_DIR = path.resolve(SRC_DIR, '..')

function getPackageName(): string {
  try {
    const pkgPath = path.join(ROOT_DIR, 'package.json')
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
      if (pkg.name) return pkg.name
    }
  } catch {
    // fallback
  }
  return '@consona/interface'
}

const PACKAGE_NAME = getPackageName()

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function getAllFiles(dir: string, extensions = ['.ts', '.tsx']): string[] {
  let results: string[] = []
  if (!fs.existsSync(dir)) return results
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git' && file !== 'registry') {
        results = results.concat(getAllFiles(filePath, extensions))
      }
    } else {
      if (
        extensions.some((ext) => file.endsWith(ext)) &&
        !file.endsWith('.d.ts') &&
        !file.endsWith('.test.ts') &&
        !file.endsWith('.test.tsx') &&
        !filePath.includes('/registry/')
      ) {
        results.push(filePath)
      }
    }
  }
  return results
}

/**
 * Dynamically resolves the package export subpath based on file path location.
 */
function resolveModuleSubpath(filePath: string): string {
  const rel = path.relative(SRC_DIR, filePath).replace(/\\/g, '/')
  
  const moduleMatch = /^modules\/([^/]+)/.exec(rel)
  if (moduleMatch) {
    const namespace = moduleMatch[1]!
    if (namespace === 'core') return PACKAGE_NAME
    return `${PACKAGE_NAME}/${namespace}`
  }

  if (rel.startsWith('registry/')) {
    return `${PACKAGE_NAME}/registry`
  }

  return PACKAGE_NAME
}

function formatModuleName(subpath: string): string {
  if (subpath === PACKAGE_NAME) return 'Core'
  const segment = subpath.replace(`${PACKAGE_NAME}/`, '')
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

function extractJSDocDescription(code: string, targetName: string): string {
  const declRegex = new RegExp(`(?:export\\s+)?(?:const|class|function|interface|type)\\s+${targetName}\\b`)
  const match = declRegex.exec(code)
  if (!match) return ''

  const prefix = code.slice(0, match.index).trimEnd()
  if (!prefix.endsWith('*/')) return ''

  const lastCommentOpen = prefix.lastIndexOf('/*')
  if (lastCommentOpen === -1) return ''
  if (!prefix.slice(lastCommentOpen).startsWith('/**')) return ''

  const commentBody = prefix.slice(lastCommentOpen + 3, -2)
  if (commentBody.includes('*/')) return ''

  const cleaned = commentBody
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter((line) => line.length > 0 && !line.startsWith('@'))
    .join(' ')
  return cleaned
}

function splitCamelOrPascal(str: string): string[] {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2)
}

function normalizeTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/^[@#]/, '')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const DOMAIN_KEYWORD_RULES: Array<{ test: RegExp; tag: string }> = [
  // Media & Audio
  { test: /\b(audio|sound|speech|voice|waveform|mic)\b|Audio|Sound|Voice|Speech|Waveform/i, tag: 'audio' },
  { test: /\b(record|recording|recorder)\b|Record/i, tag: 'recording' },
  { test: /\b(player|playback)\b|Player/i, tag: 'player' },
  // Charts & Dataviz
  { test: /\b(chart|charts|graph|plot|dataviz|timeseries|series)\b|Chart|Graph|Plot/i, tag: 'charts' },
  // Geospatial
  { test: /\b(map|maps|geo|geospatial|pin|marker)\b|Map|Geo/i, tag: 'maps' },
  // Temporal
  { test: /\b(calendar|date|time|clock|temporal|picker|duration)\b|Calendar|Date|Time|Clock/i, tag: 'calendar' },
  // Data & Tables
  { test: /\b(table|grid|virtual|datatable|virtualgrid)\b|Table|Grid/i, tag: 'table' },
  // Navigation
  { test: /\b(breadcrumb|breadcrumbs)\b|Breadcrumb/i, tag: 'breadcrumbs' },
  { test: /\b(sidebar|drawer)\b|Sidebar/i, tag: 'sidebar' },
  { test: /\b(nav|navigation|menu|navbar|route|outlet)\b|Nav|Menu/i, tag: 'navigation' },
  { test: /\b(stepper|wizard)\b|Stepper/i, tag: 'stepper' },
  // Overlay & Dialogs
  { test: /\b(modal|dialog|popover|sheet|spotlight|overlay|tooltip|dropdown)\b|Dialog|Modal|Popover|Sheet|Spotlight|Overlay/i, tag: 'overlay' },
  // Feedback
  { test: /\b(toast|alert|badge|loader|loader|progress|status|notification)\b|Toast|Alert|Loader|Loader|Progress/i, tag: 'feedback' },
  // Forms & Inputs
  { test: /\b(input|select|form|checkbox|radio|slider|switch|combobox)\b|Input|Select|Checkbox|Radio|Slider|Switch/i, tag: 'form' },
  // Theming & Visuals
  { test: /\b(theme|dark|light|color|palette)\b|Theme/i, tag: 'theme' },
  { test: /\b(glass|glassmorphism)\b|Glass/i, tag: 'glassmorphism' },
  { test: /\b(orb|sphere|glow)\b|Orb/i, tag: 'orb' },
  { test: /\b(tour|onboard|onboarding|walkthrough)\b|Onboard|Tour/i, tag: 'onboarding' },
  { test: /\b(pane|panes|dock|splitter|workspace)\b|Pane|Dock/i, tag: 'panes' },
  { test: /\b(generative|canvas|surface)\b|Generative/i, tag: 'generative' },
]

function extractTags(
  code: string,
  targetName: string,
  configBlock?: string,
  category?: string,
  moduleSubpath?: string
): string[] {
  const explicitTags: string[] = []

  // 1. Explicit tags in configBlock: tags: ['a', 'b']
  if (configBlock) {
    const tagsMatch = /tags\s*:\s*\[([\s\S]*?)\]/.exec(configBlock)
    if (tagsMatch && tagsMatch[1]) {
      const items = tagsMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/^['"`]|['"`]$/g, ''))
        .filter(Boolean)
      for (const item of items) {
        const clean = normalizeTag(item)
        if (clean) explicitTags.push(clean)
      }
    }
  }

  // Also check if static tags is defined in class or object
  const staticTagsMatch = new RegExp(`(?:static\\s+)?tags\\s*=\\s*\\[([\\s\\S]*?)\\]`).exec(code)
  if (staticTagsMatch && staticTagsMatch[1]) {
    const items = staticTagsMatch[1]
      .split(',')
      .map((s) => s.trim().replace(/^['"`]|['"`]$/g, ''))
      .filter(Boolean)
    for (const item of items) {
      const clean = normalizeTag(item)
      if (clean) explicitTags.push(clean)
    }
  }

  // JSDoc @tags, @tag, @keywords
  const declRegex = new RegExp(`(?:export\\s+)?(?:const|class|function|interface|type)\\s+${targetName}\\b`)
  const match = declRegex.exec(code)
  if (match) {
    const prefix = code.slice(0, match.index).trimEnd()
    if (prefix.endsWith('*/')) {
      const lastCommentOpen = prefix.lastIndexOf('/*')
      if (lastCommentOpen !== -1 && prefix.slice(lastCommentOpen).startsWith('/**')) {
        const commentBody = prefix.slice(lastCommentOpen + 3, -2)
        const jsDocTagMatches = commentBody.matchAll(/@(?:tags|tag|keywords)\s+([^\n\r]+)/g)
        for (const jm of jsDocTagMatches) {
          const rawTags = jm[1]!.split(/[,|\s]+/)
          for (const rt of rawTags) {
            const clean = normalizeTag(rt)
            if (clean) explicitTags.push(clean)
          }
        }
      }
    }
  }

  // If explicit tags were defined in source code, honor them exclusively (deduped, max 5)
  if (explicitTags.length > 0) {
    return Array.from(new Set(explicitTags)).slice(0, 5).sort()
  }

  // 2. High-signal semantic fallback inference (strictly 1 to 3 curated tags)
  const inferred = new Set<string>()

  // A. Module namespace (e.g. charts, media, navigation, data, temporal, overlay, maps, generative, panes, onboarding, orb, glass)
  if (moduleSubpath) {
    const modSegment = moduleSubpath.split('/').pop()?.replace(/^@consona\//, '')
    if (modSegment && modSegment !== 'interface' && modSegment !== 'core' && modSegment !== 'registry') {
      inferred.add(normalizeTag(modSegment))
    }
  }

  // B. Specific curated concept matches from target name
  for (const rule of DOMAIN_KEYWORD_RULES) {
    if (rule.test.test(targetName)) {
      inferred.add(rule.tag)
    }
  }

  // C. Category (only if still under 3 tags and adds distinct value)
  if (category && category !== 'general' && category !== 'core' && inferred.size < 2) {
    inferred.add(normalizeTag(category))
  }

  // Cap at max 4 tags per entity to avoid any context bloat
  return Array.from(inferred).filter((t) => t.length > 1).slice(0, 4).sort()
}

interface InterfaceRecord {
  extendsClause?: string
  body: string
}

function skipWhitespace(code: string, index: number): number {
  while (index < code.length && /\s/.test(code[index]!)) index++
  return index
}

function skipBalanced(code: string, index: number, open: string, close: string): number {
  if (code[index] !== open) return index
  let depth = 1
  index++
  while (index < code.length && depth > 0) {
    if (code[index] === open) depth++
    else if (code[index] === close) depth--
    index++
  }
  return index
}

function findInterfaceBlock(code: string, interfaceName: string): InterfaceRecord | null {
  const startRe = new RegExp(`(?:export\\s+)?interface\\s+${interfaceName}\\b`)
  const start = startRe.exec(code)
  if (!start) return null

  let i = start.index + start[0].length
  i = skipWhitespace(code, i)
  if (code[i] === '<') i = skipBalanced(code, i, '<', '>')
  i = skipWhitespace(code, i)

  let extendsClause: string | undefined
  if (code.slice(i, i + 7) === 'extends') {
    i += 7
    const extStart = i
    let angle = 0
    while (i < code.length) {
      const ch = code[i]!
      if (ch === '<') angle++
      else if (ch === '>') angle--
      else if (ch === '{' && angle === 0) break
      i++
    }
    extendsClause = code.slice(extStart, i).trim()
  }

  i = skipWhitespace(code, i)
  if (code[i] !== '{') return null
  const bodyStart = i + 1
  i = skipBalanced(code, i, '{', '}')
  return { extendsClause, body: code.slice(bodyStart, i - 1) }
}

function collectInterfaceCatalog(code: string, catalog: Record<string, InterfaceRecord>) {
  const nameRe = /(?:export\s+)?interface\s+([A-Z][A-Za-z0-9_]*)\b/g
  let match
  while ((match = nameRe.exec(code)) !== null) {
    const name = match[1]!
    const block = findInterfaceBlock(code, name)
    if (block) catalog[name] = block
  }
}

function splitTopLevel(source: string, separator: string): string[] {
  const parts: string[] = []
  let current = ''
  let angle = 0
  let brace = 0
  let paren = 0
  for (const ch of source) {
    if (ch === '<') angle++
    else if (ch === '>') angle--
    else if (ch === '{') brace++
    else if (ch === '}') brace--
    else if (ch === '(') paren++
    else if (ch === ')') paren--
    if (ch === separator && angle === 0 && brace === 0 && paren === 0) {
      if (current.trim()) parts.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function parentInterfaceNames(extendsClause: string): string[] {
  const names: string[] = []
  for (const token of splitTopLevel(extendsClause, ',')) {
    const omit = /(?:Omit|Pick|Partial|Required|Readonly)<\s*([A-Za-z][A-Za-z0-9_]*)/.exec(token)
    if (omit) {
      names.push(omit[1]!)
      continue
    }
    const clean = token.replace(/<[\s\S]*$/, '').trim()
    if (
      clean &&
      /^[A-Z]/.test(clean) &&
      !clean.startsWith('React') &&
      !clean.startsWith('RAC') &&
      !clean.startsWith('VariantProps') &&
      !clean.startsWith('HTMLAttributes') &&
      !clean.startsWith('SVGProps')
    ) {
      names.push(clean)
    }
  }
  return names
}

function extractGenericArg(type: string, typeName: string): string | undefined {
  const needle = `${typeName}<`
  const idx = type.indexOf(needle)
  if (idx === -1) return undefined
  let i = idx + needle.length
  let depth = 1
  let inner = ''
  while (i < type.length && depth > 0) {
    if (type[i] === '<') depth++
    else if (type[i] === '>') depth--
    if (depth > 0) inner += type[i]
    i++
  }
  return inner.trim()
}

function parseInterfaceMembers(body: string): Array<{ name: string; optional: boolean; type: string; description?: string }> {
  const members: Array<{ name: string; optional: boolean; type: string; description?: string }> = []
  const lines = body.split('\n')
  let currentJSDoc = ''

  for (const raw of lines) {
    const line = raw.trim()
    if (line.startsWith('/**')) {
      currentJSDoc = line.replace(/^\/\*\*|\*\/$/g, '').trim()
      continue
    }
    if (line === '*/' || line.startsWith('*/')) continue
    if (line.startsWith('*')) {
      const text = line.replace(/^\*\s?/, '').replace(/\*\/$/, '').trim()
      if (text) currentJSDoc = (currentJSDoc ? `${currentJSDoc} ` : '') + text
      continue
    }

    const memberMatch = /^([a-zA-Z0-9_$]+)(\??)\s*:\s*(.+)$/.exec(line)
    if (!memberMatch) continue
    members.push({
      name: memberMatch[1]!,
      optional: Boolean(memberMatch[2]) || memberMatch[3]!.includes('undefined'),
      type: memberMatch[3]!.replace(/;$/, '').trim(),
      description: currentJSDoc || undefined,
    })
    currentJSDoc = ''
  }

  return members
}

function extractValidValues(type: string): ComponentPropDoc['validValues'] {
  if (!type || type.includes('=>') || type.includes('{') || type.includes('<') || type.includes('(')) {
    return undefined
  }
  const parts = splitTopLevel(type, '|')
    .map((part) => part.trim().replace(/;$/, ''))
    .filter((part) => part && part !== 'undefined' && part !== 'null')
  if (parts.length < 2) return undefined

  const values: Array<string | number | boolean> = []
  for (const part of parts) {
    const quoted = /^['"]([^'"]+)['"]$/.exec(part)
    if (quoted) {
      values.push(quoted[1]!)
      continue
    }
    if (part === 'true' || part === 'false') {
      values.push(part === 'true')
      continue
    }
    if (/^-?\d+(\.\d+)?$/.test(part)) {
      values.push(Number(part))
      continue
    }
    return undefined
  }
  return values.map(String)
}

function toPropDoc(
  name: string,
  type: string,
  optional: boolean,
  description?: string
): ComponentPropDoc {
  return {
    name,
    type,
    optional,
    description,
    validValues: extractValidValues(type),
  }
}

function propsEqual(left?: ComponentPropDoc, right?: ComponentPropDoc): boolean {
  if (!left || !right) return false
  return (
    left.type === right.type &&
    left.optional === right.optional &&
    (left.description || '') === (right.description || '')
  )
}

function deltaSlotProps(
  slotProps: Record<string, ComponentPropDoc> | undefined,
  targetProps: Record<string, ComponentPropDoc>
): Record<string, ComponentPropDoc> | undefined {
  if (!slotProps) return undefined
  const delta: Record<string, ComponentPropDoc> = {}
  for (const [name, prop] of Object.entries(slotProps)) {
    if (!propsEqual(prop, targetProps[name])) delta[name] = prop
  }
  return Object.keys(delta).length > 0 ? delta : undefined
}

const INTRINSIC_RAC_PROPS: Record<string, Array<{ name: string; type: string; optional: boolean; description: string }>> = {
  RACProgressBarProps: [
    { name: 'value', type: 'number', optional: true, description: 'Current progress value (0-100 by default).' },
    { name: 'minValue', type: 'number', optional: true, description: 'Minimum value. Defaults to 0.' },
    { name: 'maxValue', type: 'number', optional: true, description: 'Maximum value. Defaults to 100.' },
    { name: 'isIndeterminate', type: 'boolean', optional: true, description: 'Whether progress is indeterminate.' },
  ],
  ProgressBarProps: [
    { name: 'value', type: 'number', optional: true, description: 'Current progress value (0-100 by default).' },
    { name: 'minValue', type: 'number', optional: true, description: 'Minimum value. Defaults to 0.' },
    { name: 'maxValue', type: 'number', optional: true, description: 'Maximum value. Defaults to 100.' },
    { name: 'isIndeterminate', type: 'boolean', optional: true, description: 'Whether progress is indeterminate.' },
  ],
  RACMeterProps: [
    { name: 'value', type: 'number', optional: true, description: 'Current meter value (0-100 by default).' },
    { name: 'minValue', type: 'number', optional: true, description: 'Minimum value. Defaults to 0.' },
    { name: 'maxValue', type: 'number', optional: true, description: 'Maximum value. Defaults to 100.' },
  ],
  MeterProps: [
    { name: 'value', type: 'number', optional: true, description: 'Current meter value (0-100 by default).' },
    { name: 'minValue', type: 'number', optional: true, description: 'Minimum value. Defaults to 0.' },
    { name: 'maxValue', type: 'number', optional: true, description: 'Maximum value. Defaults to 100.' },
  ],
  RACButtonProps: [
    { name: 'children', type: 'ReactNode', optional: true, description: 'Button label or content.' },
    { name: 'isDisabled', type: 'boolean', optional: true, description: 'Whether the button is disabled.' },
  ],
  RACSwitchProps: [
    { name: 'isSelected', type: 'boolean', optional: true, description: 'Whether the switch is selected (controlled).' },
    { name: 'defaultSelected', type: 'boolean', optional: true, description: 'Whether the switch is selected by default (uncontrolled).' },
    { name: 'isDisabled', type: 'boolean', optional: true, description: 'Whether the switch is disabled.' },
    { name: 'children', type: 'ReactNode', optional: true, description: 'Switch label content.' },
  ],
  RACCheckboxProps: [
    { name: 'isSelected', type: 'boolean', optional: true, description: 'Whether the checkbox is selected (controlled).' },
    { name: 'defaultSelected', type: 'boolean', optional: true, description: 'Whether the checkbox is selected by default (uncontrolled).' },
    { name: 'isIndeterminate', type: 'boolean', optional: true, description: 'Whether the checkbox is in an indeterminate state.' },
    { name: 'isDisabled', type: 'boolean', optional: true, description: 'Whether the checkbox is disabled.' },
    { name: 'children', type: 'ReactNode', optional: true, description: 'Checkbox label content.' },
  ],
  RACTextFieldProps: [
    { name: 'value', type: 'string', optional: true, description: 'Current text value (controlled).' },
    { name: 'defaultValue', type: 'string', optional: true, description: 'Initial text value (uncontrolled).' },
    { name: 'isDisabled', type: 'boolean', optional: true, description: 'Whether the text field is disabled.' },
    { name: 'isReadOnly', type: 'boolean', optional: true, description: 'Whether the text field is read-only.' },
    { name: 'isRequired', type: 'boolean', optional: true, description: 'Whether user input is required.' },
  ],
  RACSearchFieldProps: [
    { name: 'value', type: 'string', optional: true, description: 'Current search query (controlled).' },
    { name: 'defaultValue', type: 'string', optional: true, description: 'Initial search query (uncontrolled).' },
    { name: 'isDisabled', type: 'boolean', optional: true, description: 'Whether the search field is disabled.' },
  ],
  RACNumberFieldProps: [
    { name: 'value', type: 'number', optional: true, description: 'Current numeric value (controlled).' },
    { name: 'defaultValue', type: 'number', optional: true, description: 'Initial numeric value (uncontrolled).' },
    { name: 'minValue', type: 'number', optional: true, description: 'Minimum allowed value.' },
    { name: 'maxValue', type: 'number', optional: true, description: 'Maximum allowed value.' },
    { name: 'step', type: 'number', optional: true, description: 'Increment/decrement step size.' },
    { name: 'isDisabled', type: 'boolean', optional: true, description: 'Whether the number field is disabled.' },
  ],
  RACSliderProps: [
    { name: 'value', type: 'number | number[]', optional: true, description: 'Current slider value (controlled).' },
    { name: 'defaultValue', type: 'number | number[]', optional: true, description: 'Initial slider value (uncontrolled).' },
    { name: 'minValue', type: 'number', optional: true, description: 'Minimum slider value. Defaults to 0.' },
    { name: 'maxValue', type: 'number', optional: true, description: 'Maximum slider value. Defaults to 100.' },
    { name: 'step', type: 'number', optional: true, description: 'Step increment. Defaults to 1.' },
    { name: 'isDisabled', type: 'boolean', optional: true, description: 'Whether the slider is disabled.' },
  ],
}

function extractIntrinsicBaseProps(extendsClause: string): Record<string, ComponentPropDoc> {
  const result: Record<string, ComponentPropDoc> = {}
  const omitsChildren = /Omit<[\s\S]*?['"]children['"]/.test(extendsClause)
  const omitsValue = /Omit<[\s\S]*?['"]value['"]/.test(extendsClause)

  for (const [baseName, defs] of Object.entries(INTRINSIC_RAC_PROPS)) {
    if (extendsClause.includes(baseName)) {
      for (const def of defs) {
        if (def.name === 'children' && omitsChildren) continue
        if (def.name === 'value' && omitsValue) continue
        result[def.name] = toPropDoc(def.name, def.type, def.optional, def.description)
      }
    }
  }

  // If extending standard React HTML element props without omitting children, include children
  if (
    !omitsChildren &&
    !result.children &&
    /(?:ComponentProps|ComponentPropsWithoutRef|ComponentPropsWithRef|HTMLAttributes|ButtonHTMLAttributes|AnchorHTMLAttributes|LabelHTMLAttributes|TextareaHTMLAttributes)</.test(
      extendsClause
    ) &&
    !/InputHTMLAttributes/.test(extendsClause)
  ) {
    result.children = toPropDoc('children', 'ReactNode', true, 'Child content.')
  }

  return result
}

function extractInterfaceProps(
  interfaceName: string,
  catalog: Record<string, InterfaceRecord>,
  visited = new Set<string>()
): Record<string, ComponentPropDoc> {
  if (visited.has(interfaceName)) return {}
  visited.add(interfaceName)

  const record = catalog[interfaceName]
  if (!record) return {}

  let props: Record<string, ComponentPropDoc> = {}
  if (record.extendsClause) {
    props = { ...props, ...extractIntrinsicBaseProps(record.extendsClause) }
    for (const parent of parentInterfaceNames(record.extendsClause)) {
      props = { ...props, ...extractInterfaceProps(parent, catalog, visited) }
    }
  }

  for (const member of parseInterfaceMembers(record.body)) {
    props[member.name] = toPropDoc(member.name, member.type, member.optional, member.description)
  }

  return props
}

const TIER_1_PRIMARY_PROPS = [
  'data',
  'matrix',
  'items',
  'steps',
  'columns',
  'rows',
  'options',
  'nodes',
  'links',
  'tracks',
  'files',
  'events',
  'messages',
  'oldValue',
  'newValue',
  'indexBy',
  'keys',
  'valueKey',
  'labelKey',
  'idKey',
  'categoryKey',
  'xKey',
  'yKey',
  'series',
  'accessors',
  'viewRange',
  'value',
  'defaultValue',
  'minValue',
  'maxValue',
  'checked',
  'defaultChecked',
  'isSelected',
  'defaultSelected',
  'open',
  'isOpen',
  'defaultOpen',
  'activeStep',
  'currentStep',
  'title',
  'label',
  'text',
  'heading',
  'question',
  'prompt',
  'name',
  'src',
  'url',
  'href',
  'to',
  'code',
  'content',
  'markdown',
  'json',
] as const

const TIER_2_SECONDARY_PROPS = [
  'description',
  'subtitle',
  'caption',
  'summary',
  'helperText',
  'errorMessage',
  'placeholder',
  'badge',
  'mode',
  'type',
  'intent',
  'variant',
  'severity',
  'status',
  'tone',
  'color',
  'palette',
  'size',
  'orientation',
  'direction',
  'layout',
  'align',
  'justify',
  'cols',
  'columnsCount',
  'gap',
  'colSpan',
  'rowSpan',
  'min',
  'max',
  'step',
  'totalSteps',
  'page',
  'pageSize',
  'total',
  'progress',
  'percentage',
  'curve',
  'groupMode',
  'innerRadius',
  'enableArea',
  'enablePoints',
  'enableLabel',
  'enableArcLabels',
  'enableArcLinkLabels',
  'showLegend',
  'showGrid',
  'showToolbar',
  'showRail',
  'showDependencies',
  'searchable',
  'pagination',
  'sortable',
  'filterable',
  'striped',
  'bordered',
  'compact',
  'hoverable',
  'collapsible',
  'multiple',
  'disabled',
  'isDisabled',
  'readOnly',
  'isReadOnly',
  'required',
  'isRequired',
  'loading',
  'isLoading',
  'isPending',
  'isIndeterminate',
] as const

const TIER_4_COMPOSITION_PROPS = [
  'children',
  'icon',
  'leftIcon',
  'rightIcon',
  'startIcon',
  'endIcon',
  'prefix',
  'suffix',
  'avatar',
  'thumbnail',
  'image',
  'media',
  'action',
  'actions',
  'toolbarActions',
  'header',
  'footer',
  'cta',
  'emptyState',
  'trigger',
] as const

const TIER_5_STYLING_PROPS = [
  'height',
  'width',
  'maxHeight',
  'minHeight',
  'maxWidth',
  'minWidth',
  'bodyHeight',
  'rowHeight',
  'railWidth',
  'aspectRatio',
  'margin',
  'padding',
  'className',
  'style',
  'id',
  'tabIndex',
  'role',
] as const

function isRuntimeOrNonPositionalProp(name: string, prop: ComponentPropDoc): boolean {
  if (
    name === 'slots' ||
    name === 'slotProps' ||
    name === 'ref' ||
    name === 'key' ||
    name.endsWith('Props') ||
    /^on[A-Z]/.test(name) ||
    name.startsWith('aria-') ||
    name.startsWith('data-')
  ) {
    return true
  }
  if (
    prop.type.startsWith('React.Ref') ||
    prop.type.includes('RefObject') ||
    prop.type.includes('Dispatch<')
  ) {
    return true
  }
  if (name !== 'accessors' && name !== 'children' && prop.type.includes('=>')) {
    // If the prop is a union that also accepts primitive/ReactNode values (e.g. `ReactNode | ((state) => ReactNode)` or `string | ((d) => string)`),
    // it is serializable in OpenUI Lang and should not be treated as a callback-only prop.
    const acceptsSerializable = /\b(?:ReactNode|ReactElement|string|number|boolean)\b/.test(
      prop.type.replace(/\([^)]*\)\s*=>\s*[^|]+/g, '')
    )
    if (!acceptsSerializable) {
      return true
    }
  }
  return false
}

/**
 * Deterministically orders component props by semantic priority for OpenUI Lang positional arguments:
 * 1. Primary data/value/label (or `children` when a component has no explicit data/value/label prop)
 * 2. Secondary semantic & configuration props (`description`, `indexBy`, `keys`, `intent`, `variant`, `size`, etc.)
 * 3. Domain-specific serializable props (required before optional)
 * 4. Composition & icon props (`children`, `icon`, `header`, `footer`, etc.)
 * 5. Dimensions & styling (`height`, `width`, `className`, `style`)
 * 6. Non-serializable callbacks, refs, and slot maps (`on*`, `slots`, `slotProps`, `*Props`)
 */
function sortComponentProps(props: Record<string, ComponentPropDoc>): {
  sortedProps: Record<string, ComponentPropDoc>
  positionalProps: string[]
} {
  const entries = Object.entries(props)
  if (entries.length === 0) {
    return { sortedProps: {}, positionalProps: [] }
  }

  const hasExplicitTier1 = entries.some(([name]) =>
    (TIER_1_PRIMARY_PROPS as readonly string[]).includes(name)
  )

  const getRank = (name: string, prop: ComponentPropDoc): number => {
    if (isRuntimeOrNonPositionalProp(name, prop)) {
      if (name === 'slots' || name === 'slotProps') return 650
      if (name.endsWith('Props')) return 620
      return 600
    }

    // If component has no explicit Tier 1 data/label/value prop (e.g. Button, Badge, Heading, Text, Card, Stack, Grid),
    // promote `children` to first positional argument.
    if (!hasExplicitTier1 && name === 'children') {
      return 0
    }

    const t1Idx = (TIER_1_PRIMARY_PROPS as readonly string[]).indexOf(name)
    if (t1Idx !== -1) {
      return (prop.optional ? 20 : 1) + t1Idx
    }

    const t2Idx = (TIER_2_SECONDARY_PROPS as readonly string[]).indexOf(name)
    if (t2Idx !== -1) {
      return 100 + t2Idx
    }

    const t4Idx = (TIER_4_COMPOSITION_PROPS as readonly string[]).indexOf(name)
    if (t4Idx !== -1) {
      return 300 + t4Idx
    }

    const t5Idx = (TIER_5_STYLING_PROPS as readonly string[]).indexOf(name)
    if (t5Idx !== -1) {
      return 400 + t5Idx
    }

    // Tier 3: Domain-specific serializable props (required first, then optional)
    return prop.optional ? 250 : 200
  }

  const ranked = entries.map(([name, prop], originalIndex) => ({
    name,
    prop,
    rank: getRank(name, prop),
    originalIndex,
  }))

  ranked.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank
    return a.originalIndex - b.originalIndex
  })

  const sortedProps: Record<string, ComponentPropDoc> = {}
  const positionalProps: string[] = []

  for (const item of ranked) {
    sortedProps[item.name] = item.prop
    // Exclude Tier 5 styling/DOM attributes (`className`, `style`, `id`, etc.) and Tier 6 runtime/callbacks from positionalProps,
    // while keeping `height` / `width` only if they are primary domain props (rank < 410 and no other positional props).
    if (item.rank < 400) {
      positionalProps.push(item.name)
    }
  }

  return { sortedProps, positionalProps }
}

function extractPropsFromType(
  type: string,
  catalog: Record<string, InterfaceRecord>
): { props?: Record<string, ComponentPropDoc>; stateType?: string } {
  let props: Record<string, ComponentPropDoc> = {}
  let stateType: string | undefined

  for (const part of splitTopLevel(type, '&')) {
    const inlineState = /\{\s*state\??\s*:\s*([^;}]+)/.exec(part)
    if (inlineState) stateType = inlineState[1]!.trim()

    if (part.startsWith('{')) {
      const inline = extractInlineProps(part)
      props = { ...props, ...inline }
      continue
    }

    const named = part.replace(/<[\s\S]*$/, '').trim()
    if (catalog[named]) {
      props = { ...props, ...extractInterfaceProps(named, catalog) }
    }
  }

  return {
    props: Object.keys(props).length > 0 ? props : undefined,
    stateType,
  }
}

function extractInlineProps(inlineStr: string): Record<string, ComponentPropDoc> {
  const props: Record<string, ComponentPropDoc> = {}
  const cleaned = inlineStr.replace(/^\{|\}$/g, '').trim()
  if (!cleaned) return props
  for (const member of parseInterfaceMembers(cleaned)) {
    props[member.name] = toPropDoc(member.name, member.type, member.optional, member.description)
  }
  return props
}

function extractInterfaceSlots(
  slotsInterfaceName: string,
  catalog: Record<string, InterfaceRecord>,
  visited = new Set<string>()
): Record<string, ComponentSlotDoc> {
  if (visited.has(slotsInterfaceName)) return {}
  visited.add(slotsInterfaceName)

  const record = catalog[slotsInterfaceName]
  if (!record) return {}

  let slots: Record<string, ComponentSlotDoc> = {}
  if (record.extendsClause) {
    for (const parent of parentInterfaceNames(record.extendsClause)) {
      slots = { ...extractInterfaceSlots(parent, catalog, visited), ...slots }
    }
  }

  for (const member of parseInterfaceMembers(record.body)) {
    const type = member.type
    let variants: string[] | undefined
    let stateType: string | undefined
    let slotProps: Record<string, ComponentPropDoc> | undefined

    const slotDefInner = extractGenericArg(type, 'SlotDefinition')
    if (slotDefInner) {
      const [rawState, rawVariants] = splitTopLevel(slotDefInner, ',')
      stateType = rawState?.trim()
      if (rawVariants) {
        variants = rawVariants
          .split('|')
          .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
          .filter((v) => v.length > 0 && v !== 'string')
      }
      if (stateType && stateType !== 'any') {
        const extracted = extractPropsFromType(stateType, catalog)
        slotProps = extracted.props
      }
    } else {
      const innerPropType = extractGenericArg(type, 'ComponentType')
      if (innerPropType && innerPropType !== 'any') {
        const extracted = extractPropsFromType(innerPropType, catalog)
        slotProps = extracted.props
        stateType = extracted.stateType
      }
    }

    slots[member.name] = {
      name: member.name,
      type,
      optional: member.optional,
      description: member.description,
      variants: variants && variants.length > 0 ? variants : undefined,
      stateType: stateType || undefined,
      props: slotProps && Object.keys(slotProps).length > 0 ? slotProps : undefined,
    }
  }

  return slots
}

function extractComponentsFromFile(
  code: string,
  filePath: string,
  catalog: Record<string, InterfaceRecord>
): ComponentDoc[] {
  const components: ComponentDoc[] = []
  const subpath = resolveModuleSubpath(filePath)
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/')

  // Match `export const ComponentName = createInterfaceComponent`
  const compDeclRegex = /export\s+const\s+([A-Z][a-zA-Z0-9_]*)\s*=\s*createInterfaceComponent/g

  let declMatch
  while ((declMatch = compDeclRegex.exec(code)) !== null) {
    const compName = declMatch[1]!
    let i = declMatch.index + declMatch[0].length

    // Find opening '(' or '<'
    let propsTypeName = `${compName}Props`
    let slotsTypeName = `${compName}Slots`

    while (i < code.length && code[i] !== '(' && code[i] !== '<') {
      i++
    }

    if (code[i] === '<') {
      let depth = 1
      let genericContent = ''
      i++
      while (i < code.length && depth > 0) {
        if (code[i] === '<') depth++
        else if (code[i] === '>') depth--
        if (depth > 0) genericContent += code[i]
        i++
      }

      // Split top-level commas in genericContent
      const generics: string[] = []
      let genDepth = 0
      let cur = ''
      for (const ch of genericContent) {
        if (ch === '<') genDepth++
        else if (ch === '>') genDepth--
        if (ch === ',' && genDepth === 0) {
          generics.push(cur.trim())
          cur = ''
        } else {
          cur += ch
        }
      }
      if (cur.trim()) generics.push(cur.trim())

      if (generics[0]) {
        propsTypeName = generics[0].replace(/<[^>]+>/g, '').trim()
      }
      if (generics[1]) {
        slotsTypeName = generics[1].replace(/<[^>]+>/g, '').trim()
      }
    }

    // Now find opening '(' and extract config object
    while (i < code.length && code[i] !== '(') {
      i++
    }
    if (code[i] === '(') {
      i++
      while (i < code.length && code[i] !== '{') {
        i++
      }
      if (code[i] === '{') {
        let objDepth = 1
        let configBlock = ''
        i++
        while (i < code.length && objDepth > 0) {
          if (code[i] === '{') objDepth++
          else if (code[i] === '}') objDepth--
          if (objDepth > 0) configBlock += code[i]
          i++
        }

        const nameMatch = /name\s*:\s*['"]([^'"]+)['"]/.exec(configBlock)
        const categoryMatch = /category\s*:\s*['"]([^'"]+)['"]/.exec(configBlock)
        const descMatch = /description\s*:\s*['"]([^'"]+)['"]/.exec(configBlock)

        const name = nameMatch?.[1] || compName
        const category = (categoryMatch?.[1] || 'form') as ComponentCategory
        let description = descMatch?.[1] || extractJSDocDescription(code, compName) || `${name} component`

        const rawProps = extractInterfaceProps(propsTypeName, catalog)
        const { sortedProps: props, positionalProps } = sortComponentProps(rawProps)
        const slots = extractInterfaceSlots(slotsTypeName, catalog)
        annotateSlotDefaults(code, slots)

        const subComponentRegex = new RegExp(
          `${compName}\\.([A-Z][a-zA-Z0-9_]*)\\s*=\\s*([A-Z][a-zA-Z0-9_]*)`,
          'g'
        )
        const attachments: Record<string, string> = {}
        const subComponents: string[] = []
        let subMatch
        while ((subMatch = subComponentRegex.exec(code)) !== null) {
          const attachment = subMatch[1]!
          const target = subMatch[2]!
          attachments[attachment] = target
          if (!subComponents.includes(target)) subComponents.push(target)
        }

        const hookName = `use${name}`
        let hookDoc = undefined
        if (code.includes(`function ${hookName}`) || code.includes(`const ${hookName} =`)) {
          hookDoc = {
            name: hookName,
            state: [],
            actions: [],
            description: `Headless physics & state hook for ${name}`,
          }
        }

        const semanticClass = `interface-${toKebabCase(name)}`
        const dataComponent = name

        const tags = extractTags(code, compName, configBlock, category, subpath)

        components.push({
          name,
          category,
          description,
          module: subpath,
          filePath: relPath,
          tags,
          semanticClass,
          dataComponent,
          props,
          positionalProps: positionalProps.length > 0 ? positionalProps : undefined,
          slots,
          hook: hookDoc,
          subComponents: subComponents.length > 0 ? subComponents : undefined,
          attachments: Object.keys(attachments).length > 0 ? attachments : undefined,
        })
      }
    }
  }

  // Scan for top-level component aliases: e.g. export const Loader = Loader
  const aliasRegex = /export\s+const\s+([A-Z][a-zA-Z0-9_]*)\s*=\s*([A-Z][a-zA-Z0-9_]*)\b(?!\()/g
  let aliasMatch
  while ((aliasMatch = aliasRegex.exec(code)) !== null) {
    const aliasName = aliasMatch[1]!
    const targetName = aliasMatch[2]!

    const target = components.find((c) => c.name === targetName)
    if (target && aliasName !== targetName && !components.some((c) => c.name === aliasName)) {
      if (!target.aliases) target.aliases = []
      if (!target.aliases.includes(aliasName)) target.aliases.push(aliasName)

      if (target.subComponents) {
        target.subComponents = target.subComponents.filter((sc) => sc !== aliasName)
        if (target.subComponents.length === 0) target.subComponents = undefined
      }

      const aliasDoc = extractJSDocDescription(code, aliasName)
      const aliasTags = extractTags(code, aliasName, undefined, target.category, subpath)
      components.push({
        name: aliasName,
        category: target.category,
        description: aliasDoc || `Alias for ${target.name} component.`,
        module: subpath,
        filePath: relPath,
        tags: aliasTags,
        props: target.props,
        positionalProps: target.positionalProps,
        slots: target.slots,
        hook: target.hook,
        aliasOf: target.name,
      })
    }
  }

  return components
}

function annotateSlotDefaults(code: string, slots: Record<string, ComponentSlotDoc>) {
  for (const slot of Object.values(slots)) {
    const defaultMatch = new RegExp(
      `renderSlot\\(\\s*slots\\.${slot.name}\\b[\\s\\S]{0,400}?defaultComponent:\\s*([A-Z][A-Za-z0-9_]*)`
    ).exec(code)
    if (defaultMatch) slot.defaultComponent = defaultMatch[1]
  }
}

function linkRegistryGraph(components: Record<string, ComponentDoc>) {
  const registry = { components } as InterfaceRegistry

  for (const comp of Object.values(components)) {
    if (comp.attachments) {
      const canonical = Object.values(comp.attachments)
      const merged = [...(comp.subComponents ?? [])]
      for (const name of canonical) {
        if (!merged.includes(name)) merged.push(name)
      }
      comp.subComponents = merged.length > 0 ? merged : undefined
    }

    for (const slot of Object.values(comp.slots)) {
      const targetName = inferResolvedSlotTarget(slot, registry)
      if (!targetName) continue
      slot.resolvesTo = targetName
      const target = components[targetName]
      if (!target) continue
      slot.props = deltaSlotProps(slot.props, target.props)
      if (slot.type.includes('any') && !slot.variants) {
        const mentioned = slot.description?.match(/\b[A-Z][A-Za-z0-9_]+\b/g) ?? []
        const options = mentioned.filter((name) => components[name] && name !== targetName)
        if (options.length > 0) slot.variants = [targetName, ...options]
      }
    }
  }
}

function buildOccupantGraph(components: Record<string, ComponentDoc>): RegistryGraphEdge[] {
  const edges: RegistryGraphEdge[] = []
  const seen = new Set<string>()

  const push = (edge: RegistryGraphEdge) => {
    const key = `${edge.kind}:${edge.from}:${edge.slot || ''}:${edge.to}`
    if (seen.has(key)) return
    seen.add(key)
    edges.push(edge)
  }

  for (const comp of Object.values(components)) {
    for (const [key, target] of Object.entries(comp.attachments ?? {})) {
      push({ from: comp.name, slot: key, to: target, kind: 'attachment' })
    }
    for (const slot of Object.values(comp.slots)) {
      if (!slot.resolvesTo) continue
      push({ from: comp.name, slot: slot.name, to: slot.resolvesTo, kind: 'occupant' })
      for (const variant of slot.variants ?? []) {
        if (variant === slot.resolvesTo) continue
        push({ from: comp.name, slot: slot.name, to: variant, kind: 'variant' })
      }
    }
  }

  return edges
}

function extractProvidersFromFile(
  code: string,
  filePath: string,
  catalog: Record<string, InterfaceRecord>
): ProviderDoc[] {
  const providers: ProviderDoc[] = []
  const subpath = resolveModuleSubpath(filePath)
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/')

  // Match `export function FooProvider` or `export const FooProvider`
  const providerRegex = /export\s+(?:function|const)\s+([A-Z][a-zA-Z0-9_]*Provider)\b(?:\s*=\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*:\s*[^=]+=>))?(?:\s*\(([\s\S]*?)\))?/g
  let match
  while ((match = providerRegex.exec(code)) !== null) {
    const providerName = match[1]!
    const rawParams = match[2]?.trim() || ''
    const description = extractJSDocDescription(code, providerName) || `Context and state management provider ${providerName}.`

    // Determine scope classification
    let type: 'global' | 'plugin' | 'scoped' = 'scoped'
    if (['InterfaceProvider', 'ThemeProvider', 'SizeProvider'].includes(providerName)) {
      type = 'global'
    } else if (
      [
        'AudioProvider',
        'OnboardingProvider',
        'OrbProvider',
        'GlassProvider',
        'InteractionProvider',
        'OverlayProvider',
        'MapProvider',
      ].includes(providerName) ||
      (filePath.includes('/modules/') && (filePath.endsWith('context.tsx') || filePath.endsWith('plugin.ts') || filePath.endsWith('provider.tsx')))
    ) {
      type = 'plugin'
    }

    // Extract props
    let propsTypeName = `${providerName}Props`
    if (rawParams) {
      const typeMatch = /:\s*([A-Z][a-zA-Z0-9_]*Props|[A-Z][a-zA-Z0-9_]*Config)/.exec(rawParams)
      if (typeMatch) {
        propsTypeName = typeMatch[1]!
      }
    }
    if (providerName === 'ThemeProvider') propsTypeName = 'ThemeConfig'
    if (providerName === 'InterfaceProvider') propsTypeName = 'InterfaceConfig'

    const props = extractInterfaceProps(propsTypeName, catalog)

    // Find context interface
    let contextTypeName = `${providerName.replace('Provider', '')}ContextValue`
    if (!catalog[contextTypeName]) {
      const ctxMatch = /createContext<\s*([A-Z][a-zA-Z0-9_]*)/.exec(code)
      if (ctxMatch) contextTypeName = ctxMatch[1]!
    }
    const contextValue = catalog[contextTypeName] ? extractInterfaceProps(contextTypeName, catalog) : undefined

    // Find provided hooks in the same module / file
    const hookMatches = Array.from(code.matchAll(/export\s+function\s+(use[A-Z][a-zA-Z0-9_]*)/g)).map((m) => m[1]!)

    // Find events emitted or handled
    const eventMatches = Array.from(code.matchAll(/emit\(\s*['"]([^'"]+)['"]/g)).map((m) => m[1]!)
    const uniqueEvents = Array.from(new Set(eventMatches))

    const tags = extractTags(code, providerName, undefined, undefined, subpath)

    providers.push({
      name: providerName,
      type,
      module: subpath,
      description,
      filePath: relPath,
      tags,
      props,
      contextValue,
      providedHooks: hookMatches,
      providedEvents: uniqueEvents,
    })
  }

  return providers
}

function extractEnginesFromFile(
  code: string,
  filePath: string,
  catalog: Record<string, InterfaceRecord>
): EngineDoc[] {
  const engines: EngineDoc[] = []
  const subpath = resolveModuleSubpath(filePath)
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/')

  const engineRegex = /export\s+class\s+([A-Z][a-zA-Z0-9_]*Engine)(?:<[^>]+>)?(?:\s+extends\s+BaseEngine(?:<([A-Za-z0-9_]+)(?:<[^>]+>)?>)?)?\s*\{/g
  let match
  while ((match = engineRegex.exec(code)) !== null) {
    const engineName = match[1]!
    let stateType = match[2]?.trim()
    if (!stateType) {
      const candidates = [
        `${engineName}State`,
        `${engineName.replace('Engine', '')}EngineState`,
        `${engineName.replace('Engine', '')}State`,
      ]
      for (const c of candidates) {
        if (catalog[c]) {
          stateType = c
          break
        }
      }
    }
    if (!stateType) stateType = `${engineName.replace('Engine', '')}State`

    const bodyStart = match.index + match[0].length - 1
    const bodyEnd = skipBalanced(code, bodyStart, '{', '}')
    const classBody = code.slice(bodyStart + 1, bodyEnd - 1)
    const description = extractJSDocDescription(code, engineName) || `Pure TypeScript engine managing ${engineName.replace('Engine', '')} physics and state.`

    const stateProps = catalog[stateType] ? extractInterfaceProps(stateType, catalog) : {}

    const methods: Record<string, any> = {}

    // 1. Regular methods: methodName(...) { or public methodName(...) { or public override methodName(...) {
    const methodRegex = /(?:public\s+)?(?:override\s+)?([a-zA-Z0-9_$]+)\s*\(([^)]*)\)\s*(?::\s*([^\{]+))?\s*\{/g
    let mMatch
    while ((mMatch = methodRegex.exec(classBody)) !== null) {
      const methodName = mMatch[1]!
      if (['constructor', 'destroy', 'getState', 'setState', 'subscribe', 'on', 'emit', 'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof', 'instanceof'].includes(methodName)) continue
      const doc = extractJSDocDescription(classBody, methodName)
      const params = mMatch[2]!.trim()
      const returnType = mMatch[3]?.trim() || 'void'

      methods[methodName] = {
        name: methodName,
        signature: `(${params}) => ${returnType}`,
        returnType,
        description: doc || undefined,
      }
    }

    // 2. Arrow property methods: public methodName = (...) => { or methodName = (...) => {
    const arrowMethodRegex = /(?:public\s+)?(?:readonly\s+)?([a-zA-Z0-9_$]+)\s*=\s*\(([^)]*)\)\s*(?::\s*([^=>]+))?\s*=>/g
    let aMatch
    while ((aMatch = arrowMethodRegex.exec(classBody)) !== null) {
      const methodName = aMatch[1]!
      if (['constructor', 'destroy', 'getState', 'setState', 'subscribe', 'on', 'emit', 'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof', 'instanceof'].includes(methodName)) continue
      const doc = extractJSDocDescription(classBody, methodName)
      const params = aMatch[2]!.trim()
      const returnType = aMatch[3]?.trim() || 'void'

      methods[methodName] = {
        name: methodName,
        signature: `(${params}) => ${returnType}`,
        returnType,
        description: doc || undefined,
      }
    }

    const events: Record<string, any> = {}
    const eventRegex = /this\.emit\(\s*['"]([^'"]+)['"](?:\s*,\s*([^)]+))?\)/g
    let eMatch
    while ((eMatch = eventRegex.exec(classBody)) !== null) {
      const eventName = eMatch[1]!
      events[eventName] = {
        name: eventName,
        payloadType: 'any',
        description: `Triggered on ${eventName}`,
      }
    }

    const tags = extractTags(code, engineName, undefined, undefined, subpath)

    engines.push({
      name: engineName,
      module: subpath,
      description,
      filePath: relPath,
      tags,
      state: Object.keys(stateProps).length > 0 ? stateProps : { [stateType]: { name: stateType, type: stateType, optional: false, description: 'Engine state schema' } },
      methods,
      events,
    })
  }

  return engines
}

function extractTypesFromFile(
  code: string,
  filePath: string,
  catalog: Record<string, InterfaceRecord>
): TypeDoc[] {
  const types: TypeDoc[] = []
  const subpath = resolveModuleSubpath(filePath)
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/')

  // 1. Exported Interfaces
  const ifaceRegex = /export\s+interface\s+([A-Z][A-Za-z0-9_]*)(?:<[^>]+>)?(?:\s+extends\s+([^{]+))?\s*\{/g
  let iMatch
  while ((iMatch = ifaceRegex.exec(code)) !== null) {
    const name = iMatch[1]!
    const extendsRaw = iMatch[2]?.trim()
    const blockStart = iMatch.index + iMatch[0].length - 1
    const blockEnd = skipBalanced(code, blockStart, '{', '}')
    const rawDef = code.slice(iMatch.index, blockEnd).trim()

    const parents = extendsRaw ? parentInterfaceNames(extendsRaw) : undefined
    const props = catalog[name] ? extractInterfaceProps(name, catalog) : undefined
    const description = extractJSDocDescription(code, name) || undefined

    const tags = extractTags(code, name, undefined, undefined, subpath)

    types.push({
      name,
      kind: 'interface',
      module: subpath,
      filePath: relPath,
      tags,
      description,
      rawDefinition: rawDef,
      properties: props && Object.keys(props).length > 0 ? props : undefined,
      extends: parents && parents.length > 0 ? parents : undefined,
    })
  }

  // 2. Exported Type Aliases
  const typeRegex = /export\s+type\s+([A-Z][A-Za-z0-9_]*)(?:<[^>]+>)?\s*=\s*([^;\n]+(?:;|\n))/g
  let tMatch
  while ((tMatch = typeRegex.exec(code)) !== null) {
    const name = tMatch[1]!
    const typeValue = tMatch[2]?.replace(/;$/, '').trim() || ''
    const rawDef = tMatch[0].trim()
    const description = extractJSDocDescription(code, name) || undefined

    // Check if union of strings (e.g. 'light' | 'dark' | 'system')
    let unionValues: string[] | undefined
    if (typeValue.includes('|')) {
      const literals = typeValue
        .split('|')
        .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
        .filter((v) => v.length > 0 && !v.includes(' ') && !v.includes('<'))
      if (literals.length > 0) {
        unionValues = literals
      }
    }

    let props: Record<string, ComponentPropDoc> | undefined
    if (catalog[name]) {
      props = extractInterfaceProps(name, catalog)
    }

    const typeTags = extractTags(code, name, undefined, undefined, subpath)

    types.push({
      name,
      kind: unionValues ? 'union' : 'type',
      module: subpath,
      filePath: relPath,
      tags: typeTags,
      description,
      rawDefinition: rawDef,
      properties: props && Object.keys(props).length > 0 ? props : undefined,
      unionValues,
    })
  }

  return types
}

function extractHooksFromFile(
  code: string,
  filePath: string,
  catalog: Record<string, InterfaceRecord>
): HookDoc[] {
  const hooks: HookDoc[] = []
  const subpath = resolveModuleSubpath(filePath)
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/')

  const hookRegex = /export\s+(?:function\s+(use[A-Z][a-zA-Z0-9_]*)|const\s+(use[A-Z][a-zA-Z0-9_]*)\s*=\s*(?:<[^>]+>)?\s*)\s*(?:<[^>]+>)?\s*\(([\s\S]*?)\)(?::\s*([^\{=]+))?\s*(?:=>|\{)/g
  let match
  while ((match = hookRegex.exec(code)) !== null) {
    const hookName = (match[1] || match[2])!
    const rawParams = match[3]!.trim()
    const returnType = match[4]?.trim() || 'any'
    const description = extractJSDocDescription(code, hookName) || `React hook primitive ${hookName}`

    let type: 'utility' | 'engine' | 'headless' = 'utility'
    if (hookName.includes('Engine') || returnType.includes('useSyncExternalStore') || code.includes('useEngineState') || code.includes('useEngine(')) {
      type = 'engine'
    } else if (code.includes('HeadlessHookReturn') || code.includes('ariaProps')) {
      type = 'headless'
    }

    const parameters: Record<string, ComponentPropDoc> = {}
    if (rawParams.length > 0) {
      const destructuredMatch = /^\s*\{([\s\S]*?)\}\s*:\s*([^=]+)/.exec(rawParams)
      if (destructuredMatch) {
        const typeName = destructuredMatch[2]!.trim()
        const destructuredFields = destructuredMatch[1]!
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean)
        
        for (const field of destructuredFields) {
          parameters[field] = {
            name: field,
            type: `${typeName}['${field}']`,
            optional: true,
            description: undefined,
          }
        }
      } else {
        const paramList = rawParams.split(',')
        for (const p of paramList) {
          const parts = p.trim().split(':')
          const pName = parts[0]?.replace('?', '').trim() || 'options'
          const rawType = parts[1]?.trim() || 'any'
          const cleanType = rawType.replace(/\s*=\s*[\s\S]*$/, '').replace(/\?/g, '').trim()
          const isOpt = parts[0]?.includes('?') || p.includes('=')

          if (catalog[cleanType] && (pName === 'options' || pName.endsWith('Options') || pName.endsWith('Props') || pName === 'config')) {
            const optProps = extractInterfaceProps(cleanType, catalog)
            for (const [optName, optDoc] of Object.entries(optProps)) {
              parameters[optName] = optDoc
            }
          } else {
            parameters[pName] = {
              name: pName,
              type: cleanType,
              optional: isOpt,
              description: undefined,
            }
          }
        }
      }
    }

    // Resolve return shape fields if returnType is in catalog or can be inferred
    let resolvedReturnType = returnType.replace(/<[^>]+>/g, '').trim()
    if (resolvedReturnType === 'any' || !resolvedReturnType) {
      const hookBodyMatch = new RegExp(`(?:function\\s+${hookName}|const\\s+${hookName}\\s*=)[\\s\\S]*?(?:return\\s+|\\}\\s*$|$)`).exec(code)
      const hookBody = hookBodyMatch ? hookBodyMatch[0] : ''
      const ctxMatch = /useContext\s*\(\s*(\w+Context)\s*\)/.exec(hookBody)
      if (ctxMatch) {
        const ctxVar = ctxMatch[1]
        const ctxDeclMatch = new RegExp(`const\\s+${ctxVar}\\s*=\\s*createContext\\s*<\\s*([A-Za-z0-9_]+)`).exec(code)
        if (ctxDeclMatch && ctxDeclMatch[1]) {
          resolvedReturnType = ctxDeclMatch[1]
        }
      } else {
        const potentialTypes = [
          `${hookName.charAt(0).toUpperCase() + hookName.slice(1)}Return`,
          `Use${hookName.slice(3)}Return`,
          `${hookName.slice(3)}ContextValue`,
          `${hookName.slice(3)}State`,
        ]
        for (const pt of potentialTypes) {
          if (catalog[pt]) {
            resolvedReturnType = pt
            break
          }
        }
      }
    }

    const returnRecord = catalog[resolvedReturnType]
    const stateProps: Record<string, ComponentPropDoc> = {}
    const actionProps: Record<string, ComponentPropDoc> = {}
    const ariaProps: Record<string, ComponentPropDoc> = {}
    const helperProps: Record<string, ComponentPropDoc> = {}

    if (returnRecord) {
      const allReturnProps = extractInterfaceProps(resolvedReturnType, catalog)

      if (allReturnProps['state'] || allReturnProps['actions'] || allReturnProps['helpers'] || allReturnProps['ariaProps']) {
        for (const [sectionKey, sectionDoc] of Object.entries(allReturnProps)) {
          let innerProps: Record<string, ComponentPropDoc> = {}
          if (sectionDoc.type.startsWith('{')) {
            innerProps = extractInlineProps(sectionDoc.type)
          } else if (catalog[sectionDoc.type]) {
            innerProps = extractInterfaceProps(sectionDoc.type, catalog)
          }

          if (sectionKey === 'state') {
            Object.assign(stateProps, innerProps)
          } else if (sectionKey === 'actions') {
            Object.assign(actionProps, innerProps)
          } else if (sectionKey === 'helpers') {
            Object.assign(helperProps, innerProps)
          } else if (sectionKey === 'ariaProps') {
            Object.assign(ariaProps, innerProps)
          } else {
            if (
              sectionDoc.type.includes('=>') ||
              sectionKey.startsWith('set') ||
              sectionKey.startsWith('on') ||
              sectionKey.startsWith('toggle') ||
              sectionKey.startsWith('start') ||
              sectionKey.startsWith('stop') ||
              sectionKey.startsWith('play') ||
              sectionKey.startsWith('reset') ||
              sectionKey.startsWith('with') ||
              sectionKey.startsWith('trigger') ||
              sectionKey.startsWith('handle')
            ) {
              actionProps[sectionKey] = sectionDoc
            } else if (sectionKey.includes('Props') || sectionKey.endsWith('Props') || sectionKey.startsWith('aria')) {
              ariaProps[sectionKey] = sectionDoc
            } else if (
              sectionDoc.type.includes('function') ||
              sectionKey.startsWith('format') ||
              sectionKey.startsWith('get') ||
              sectionKey.startsWith('is') ||
              sectionKey.startsWith('can')
            ) {
              helperProps[sectionKey] = sectionDoc
            } else {
              stateProps[sectionKey] = sectionDoc
            }
          }
        }
      } else {
        for (const [propName, propDoc] of Object.entries(allReturnProps)) {
          if (
            propDoc.type.includes('=>') ||
            propName.startsWith('set') ||
            propName.startsWith('on') ||
            propName.startsWith('toggle') ||
            propName.startsWith('start') ||
            propName.startsWith('stop') ||
            propName.startsWith('play') ||
            propName.startsWith('reset') ||
            propName.startsWith('with') ||
            propName.startsWith('trigger') ||
            propName.startsWith('handle')
          ) {
            actionProps[propName] = propDoc
          } else if (propName.includes('Props') || propName.endsWith('Props') || propName.startsWith('aria')) {
            ariaProps[propName] = propDoc
          } else if (
            propDoc.type.includes('function') ||
            propName.startsWith('format') ||
            propName.startsWith('get') ||
            propName.startsWith('is') ||
            propName.startsWith('can')
          ) {
            helperProps[propName] = propDoc
          } else {
            stateProps[propName] = propDoc
          }
        }
      }
    }

    const tags = extractTags(code, hookName, undefined, undefined, subpath)

    hooks.push({
      name: hookName,
      type,
      module: subpath,
      description,
      filePath: relPath,
      tags,
      parameters,
      returns: {
        type: resolvedReturnType,
        description: `${hookName} return shape`,
        state: Object.keys(stateProps).length > 0 ? stateProps : undefined,
        actions: Object.keys(actionProps).length > 0 ? actionProps : undefined,
        ariaProps: Object.keys(ariaProps).length > 0 ? ariaProps : undefined,
        helpers: Object.keys(helperProps).length > 0 ? helperProps : undefined,
      },
    })
  }

  return hooks
}

function extractPluginsFromFile(code: string, filePath: string): PluginDoc[] {
  const plugins: PluginDoc[] = []
  const subpath = resolveModuleSubpath(filePath)
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/')

  const pluginRegex = /export\s+const\s+([A-Z][a-zA-Z0-9_]*Plugin)\s*(?::\s*InterfacePlugin)?\s*=\s*(?:definePlugin\s*\(\s*)?\{([\s\S]*?)\}(?:\s*\))?/g
  let match
  while ((match = pluginRegex.exec(code)) !== null) {
    const pluginName = match[1]!
    const body = match[2]!
    const nameMatch = /name\s*:\s*['"]([^'"]+)['"]/.exec(body)
    const pluginId = nameMatch?.[1] || pluginName
    const description = extractJSDocDescription(code, pluginName) || `Consona Interface plugin for ${pluginId}`
    const hasProvider = body.includes('Provider:')

    const compMatches = Array.from(body.matchAll(/([A-Z][a-zA-Z0-9_]*)\s*:/g)).map((m) => m[1]!)
    const eventMatches = Array.from(body.matchAll(/['"]([a-z0-9_*-]+:[a-z0-9_*-]+)['"]\s*:/g)).map((m) => m[1]!)

    const tags = extractTags(code, pluginName, body, undefined, subpath)

    plugins.push({
      name: pluginName,
      module: subpath,
      description,
      filePath: relPath,
      tags,
      hasProvider,
      events: eventMatches,
      components: compMatches,
    })
  }

  return plugins
}

export function buildRegistry(): { registry: InterfaceRegistry; metadata: MetadataRegistry } {
  console.log('⚡ Building Consona Interface AST Registry...')
  const allFiles = getAllFiles(SRC_DIR)
  
  const components: Record<string, ComponentDoc> = {}
  const providers: Record<string, ProviderDoc> = {}
  const engines: Record<string, EngineDoc> = {}
  const hooks: Record<string, HookDoc> = {}
  const plugins: Record<string, PluginDoc> = {}
  const types: Record<string, TypeDoc> = {}
  const interfaceCatalog: Record<string, InterfaceRecord> = {}
  const fileSources: Array<{ file: string; code: string }> = []

  for (const file of allFiles) {
    const code = fs.readFileSync(file, 'utf-8')
    fileSources.push({ file, code })
    collectInterfaceCatalog(code, interfaceCatalog)
  }

  for (const { file, code } of fileSources) {
    // 1. Components
    const comps = extractComponentsFromFile(code, file, interfaceCatalog)
    for (const c of comps) components[c.name] = c

    // 2. Providers
    const prvs = extractProvidersFromFile(code, file, interfaceCatalog)
    for (const p of prvs) providers[p.name] = p

    // 3. Engines
    const engs = extractEnginesFromFile(code, file, interfaceCatalog)
    for (const e of engs) engines[e.name] = e

    // 4. Hooks
    const hks = extractHooksFromFile(code, file, interfaceCatalog)
    for (const h of hks) hooks[h.name] = h

    // 5. Plugins
    const plgs = extractPluginsFromFile(code, file)
    for (const p of plgs) plugins[p.name] = p

    // 6. Types & Interfaces
    const tps = extractTypesFromFile(code, file, interfaceCatalog)
    for (const t of tps) types[t.name] = t
  }

  linkRegistryGraph(components)

  // Dynamically discover all unique module subpaths
  const discoveredSubpaths = new Set<string>([PACKAGE_NAME, `${PACKAGE_NAME}/registry`])

  // Discover from src/modules/ directory
  const modulesDir = path.join(SRC_DIR, 'modules')
  if (fs.existsSync(modulesDir)) {
    const dirs = fs.readdirSync(modulesDir)
    for (const dir of dirs) {
      if (fs.statSync(path.join(modulesDir, dir)).isDirectory()) {
        if (dir === 'core') {
          discoveredSubpaths.add(PACKAGE_NAME)
        } else {
          discoveredSubpaths.add(`${PACKAGE_NAME}/${dir}`)
        }
      }
    }
  }

  // Collect subpaths from extracted items
  for (const c of Object.values(components)) discoveredSubpaths.add(c.module)
  for (const p of Object.values(providers)) discoveredSubpaths.add(p.module)
  for (const e of Object.values(engines)) discoveredSubpaths.add(e.module)
  for (const h of Object.values(hooks)) discoveredSubpaths.add(h.module)
  for (const plg of Object.values(plugins)) discoveredSubpaths.add(plg.module)

  const modules: Record<string, ModuleSummaryDoc> = {}
  for (const sp of discoveredSubpaths) {
    const name = formatModuleName(sp)
    const modComponents = Object.values(components).filter((c) => c.module === sp)
    const modProviders = Object.values(providers).filter((p) => p.module === sp)
    const modEngines = Object.values(engines).filter((e) => e.module === sp)
    const modHooks = Object.values(hooks).filter((h) => h.module === sp)
    const modPlugins = Object.values(plugins).filter((p) => p.module === sp)

    const allModTags = new Set<string>()
    for (const item of [...modComponents, ...modProviders, ...modEngines, ...modHooks, ...modPlugins]) {
      for (const t of item.tags || []) allModTags.add(t)
    }

    modules[sp] = {
      name,
      subpath: sp,
      description: `${name} module for ${PACKAGE_NAME}`,
      tags: Array.from(allModTags).sort(),
      components: modComponents.map((c) => c.name),
      providers: modProviders.map((p) => p.name),
      engines: modEngines.map((e) => e.name),
      hooks: modHooks.map((h) => h.name),
      plugins: modPlugins.map((p) => p.name),
    }
  }

  const registry: InterfaceRegistry = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    components,
    providers,
    engines,
    hooks,
    plugins,
    types,
    modules,
    graph: buildOccupantGraph(components),
  }

  // Build Lightweight Metadata Index (100% dynamic categories & module maps & tag indexes)
  const metadataItems: Record<string, MetadataRegistryItem> = {}
  const categories: Record<string, string[]> = {}
  const moduleMap: Record<string, string[]> = {}
  const tagMap: Record<string, string[]> = {}

  const registerItemTags = (name: string, tags?: string[]) => {
    for (const t of tags || []) {
      if (!tagMap[t]) tagMap[t] = []
      if (!tagMap[t]!.includes(name)) tagMap[t]!.push(name)
    }
  }

  for (const [name, comp] of Object.entries(components)) {
    metadataItems[name] = {
      name,
      type: 'component',
      category: comp.category,
      module: comp.module,
      description: comp.description,
      tags: comp.tags,
      semanticClass: comp.semanticClass,
      dataComponent: comp.dataComponent,
      props: Object.keys(comp.props),
      positionalProps: comp.positionalProps,
      slots: Object.keys(comp.slots),
      hook: comp.hook?.name,
      aliases: comp.aliases,
      aliasOf: comp.aliasOf,
    }
    registerItemTags(name, comp.tags)
    if (!categories[comp.category]) categories[comp.category] = []
    categories[comp.category]!.push(name)

    if (!moduleMap[comp.module]) moduleMap[comp.module] = []
    moduleMap[comp.module]!.push(name)
  }

  for (const [name, prv] of Object.entries(providers)) {
    metadataItems[name] = {
      name,
      type: 'provider',
      module: prv.module,
      description: prv.description,
      tags: prv.tags,
      props: Object.keys(prv.props),
      hook: prv.providedHooks.length > 0 ? prv.providedHooks.join(', ') : undefined,
    }
    registerItemTags(name, prv.tags)
    if (!moduleMap[prv.module]) moduleMap[prv.module] = []
    moduleMap[prv.module]!.push(name)
  }

  for (const [name, eng] of Object.entries(engines)) {
    metadataItems[name] = {
      name,
      type: 'engine',
      module: eng.module,
      description: eng.description,
      tags: eng.tags,
    }
    registerItemTags(name, eng.tags)
    if (!moduleMap[eng.module]) moduleMap[eng.module] = []
    moduleMap[eng.module]!.push(name)
  }

  for (const [name, hk] of Object.entries(hooks)) {
    metadataItems[name] = {
      name,
      type: 'hook',
      module: hk.module,
      description: hk.description,
      tags: hk.tags,
    }
    registerItemTags(name, hk.tags)
    if (!moduleMap[hk.module]) moduleMap[hk.module] = []
    moduleMap[hk.module]!.push(name)
  }

  for (const [name, plg] of Object.entries(plugins)) {
    metadataItems[name] = {
      name,
      type: 'plugin',
      module: plg.module,
      description: plg.description,
      tags: plg.tags,
    }
    registerItemTags(name, plg.tags)
    if (!moduleMap[plg.module]) moduleMap[plg.module] = []
    moduleMap[plg.module]!.push(name)
  }

  const metadata: MetadataRegistry = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    items: metadataItems,
    categories: categories as Record<ComponentCategory, string[]>,
    modules: moduleMap,
    tags: tagMap,
  }

  ensureDir(REGISTRY_DIR)
  const registryPath = path.join(REGISTRY_DIR, 'registry.json')
  const metadataPath = path.join(REGISTRY_DIR, 'metadata-registry.json')

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8')
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')

  console.log(`✅ Generated ${Object.keys(components).length} components, ${Object.keys(providers).length} providers, ${Object.keys(engines).length} engines, ${Object.keys(hooks).length} hooks, ${Object.keys(plugins).length} plugins, ${Object.keys(types).length} types across ${Object.keys(modules).length} modules.`)
  console.log(`📁 Saved to ${registryPath} and ${metadataPath}`)

  return { registry, metadata }
}

// Auto-run when invoked directly
if (typeof process !== 'undefined' && process.argv && process.argv[1] === __filename) {
  buildRegistry()
}
