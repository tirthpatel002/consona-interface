// -----------------------------------------------------------------------------
// Consona Interface: Comprehensive Slots & Factory Diagnostic Script
// -----------------------------------------------------------------------------

import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'

const ROOT_DIR = process.cwd()
const SRC_DIR = path.resolve(ROOT_DIR, 'src/modules')

function getAllFiles(dir: string, ext = ['.tsx']): string[] {
  let results: string[] = []
  if (!fs.existsSync(dir)) return results
  const list = fs.readdirSync(dir, { withFileTypes: true })
  for (const item of list) {
    const itemPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== 'dist') {
        results = results.concat(getAllFiles(itemPath, ext))
      }
    } else if (ext.some((e) => item.name.endsWith(e)) && !item.name.endsWith('.d.ts') && !item.name.endsWith('.test.tsx')) {
      results.push(itemPath)
    }
  }
  return results
}

export interface ComponentDiagnostic {
  file: string
  componentName: string
  line: number
  hasCreateInterfaceComponent: boolean
  genericsCount: number
  propsType?: string
  slotsType?: string
  hasSlotsInProps: boolean
  hasSlotPropsInProps: boolean
  configSlotKeys: string[]
  declaredSlotKeys: string[]
  renderSlotKeysDispatched: string[]
  unusedSlots: string[]
  undeclaredSlotsDispatched: string[]
  missingConfigSlots: string[]
  inlineLambdaInDefaultComponent: boolean
  isCompoundRoot: boolean
  attachments: { member: string; target: string }[]
  missingSlotsGeneric: boolean
  isContainerWithoutSlots: boolean
}

export interface ActionableIssue {
  file: string
  component: string
  line: number
  level: number
  levelName: string
  family: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  missingSlotsGeneric: boolean
  unusedSlots: string[]
  undeclaredSlots: string[]
  missingConfigSlots: string[]
  missingSlotsInProps: boolean
  missingSlotPropsInProps: boolean
  inlineLambda: boolean
  summaryText: string
  recommendedFix: string
}

const files = getAllFiles(SRC_DIR)
const diagnostics: ComponentDiagnostic[] = []

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8')
  if (!content.includes('createInterfaceComponent')) continue

  const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true)
  const relPath = path.relative(ROOT_DIR, file)

  // Find all interfaces and type aliases
  const interfaces = new Map<string, ts.InterfaceDeclaration>()
  const typeAliases = new Map<string, ts.TypeAliasDeclaration>()
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isInterfaceDeclaration(node)) {
      interfaces.set(node.name.text, node)
    } else if (ts.isTypeAliasDeclaration(node)) {
      typeAliases.set(node.name.text, node)
    }
  })

  // Find attachments
  const attachments: { root: string; member: string; target: string }[] = []
  const attachmentRegex = /([A-Z][a-zA-Z0-9_]*)\.([A-Z][a-zA-Z0-9_]*)\s*=\s*([A-Z][a-zA-Z0-9_]*)/g
  let aMatch
  while ((aMatch = attachmentRegex.exec(content)) !== null) {
    attachments.push({ root: aMatch[1]!, member: aMatch[2]!, target: aMatch[3]! })
  }

  // Find createInterfaceComponent calls
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer && ts.isCallExpression(decl.initializer)) {
          const callExpr = decl.initializer
          const fnName = callExpr.expression.getText(sourceFile)
          if (fnName === 'createInterfaceComponent') {
            const compName = decl.name.text
            const { line } = sourceFile.getLineAndCharacterOfPosition(decl.getStart())
            const genericsCount = callExpr.typeArguments ? callExpr.typeArguments.length : 0
            const rawPropsType = genericsCount > 0 ? callExpr.typeArguments![0]?.getText(sourceFile) : undefined
            const propsType = rawPropsType ? rawPropsType.replace(/<.*>$/, '').trim() : undefined
            const rawSlotsType = genericsCount > 1 ? callExpr.typeArguments![1]?.getText(sourceFile) : undefined
            const slotsType = rawSlotsType ? rawSlotsType.replace(/<.*>$/, '').trim() : undefined

            // Check if there is a matching <CompName>Slots interface even if not passed
            const expectedSlotsName = `${compName}Slots`
            const hasMatchingSlotsIface = interfaces.has(expectedSlotsName)
            const missingSlotsGeneric = genericsCount <= 1 && hasMatchingSlotsIface

            // Check props interface
            let hasSlotsInProps = false
            let hasSlotPropsInProps = false
            if (propsType) {
              const pIface = interfaces.get(propsType)
              if (pIface) {
                const text = pIface.getText(sourceFile)
                if (text.includes('slots?:') || text.includes('slots :')) hasSlotsInProps = true
                if (text.includes('slotProps?:') || text.includes('slotProps :')) hasSlotPropsInProps = true
              }
              const pType = typeAliases.get(propsType)
              if (pType) {
                const text = pType.getText(sourceFile)
                if (text.includes('slots?:') || text.includes('slots :')) hasSlotsInProps = true
                if (text.includes('slotProps?:') || text.includes('slotProps :')) hasSlotPropsInProps = true
              }
            }

            // Extract config.slots
            const configSlotKeys: string[] = []
            if (callExpr.arguments.length > 0 && ts.isObjectLiteralExpression(callExpr.arguments[0])) {
              const configObj = callExpr.arguments[0] as ts.ObjectLiteralExpression
              for (const prop of configObj.properties) {
                if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'slots') {
                  if (ts.isObjectLiteralExpression(prop.initializer)) {
                    for (const sProp of prop.initializer.properties) {
                      if (ts.isPropertyAssignment(sProp) && ts.isIdentifier(sProp.name)) {
                        configSlotKeys.push(sProp.name.text)
                      }
                    }
                  }
                }
              }
            }

            // Extract declared slots
            const declaredSlotKeys: string[] = []
            const actualSlotsTypeName = slotsType || (hasMatchingSlotsIface ? expectedSlotsName : undefined)
            if (actualSlotsTypeName && interfaces.has(actualSlotsTypeName)) {
              const sIface = interfaces.get(actualSlotsTypeName)!
              for (const member of sIface.members) {
                if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
                  declaredSlotKeys.push(member.name.text)
                }
              }
            }

            // Extract renderSlot dispatches in the file/primitive
            const renderSlotKeysDispatched: string[] = []
            let inlineLambdaInDefaultComponent = false

            const renderFnNode = callExpr.arguments[1]
            let renderFnBody: ts.Node | undefined = renderFnNode

            if (renderFnNode && ts.isIdentifier(renderFnNode)) {
              const fnId = renderFnNode.text
              ts.forEachChild(sourceFile, (n) => {
                if (ts.isFunctionDeclaration(n) && n.name?.text === fnId) {
                  renderFnBody = n
                } else if (ts.isVariableStatement(n)) {
                  for (const d of n.declarationList.declarations) {
                    if (ts.isIdentifier(d.name) && d.name.text === fnId) {
                      renderFnBody = d.initializer
                    }
                  }
                }
              })
            }

            if (renderFnBody) {
              function checkRenderSlots(n: ts.Node) {
                if (ts.isCallExpression(n)) {
                  const cFn = n.expression.getText(sourceFile)
                  if (cFn === 'renderSlot') {
                    const arg0 = n.arguments[0]?.getText(sourceFile) || ''
                    const m =
                      arg0.match(/(?:slots|slotComponents|ctxSlots|directSlots|contextSlots)(?:\?\.)?\.?([a-zA-Z0-9_]+)/) ||
                      arg0.match(/([a-zA-Z0-9_]+)Slot/)
                    if (m && m[1]) {
                      renderSlotKeysDispatched.push(m[1])
                    }

                    // Check defaultComponent
                    const optArg = n.arguments[2]
                    if (optArg && ts.isObjectLiteralExpression(optArg)) {
                      for (const p of optArg.properties) {
                        if (ts.isPropertyAssignment(p) && p.name.getText(sourceFile) === 'defaultComponent') {
                          if (ts.isArrowFunction(p.initializer) || ts.isFunctionExpression(p.initializer)) {
                            inlineLambdaInDefaultComponent = true
                          }
                        }
                      }
                    }
                  }
                }
                ts.forEachChild(n, checkRenderSlots)
              }
              checkRenderSlots(renderFnBody)
            }

            // Gaps
            const unusedSlots = declaredSlotKeys.filter(
              (s) =>
                !renderSlotKeysDispatched.includes(s) &&
                !content.includes(`slots?.${s}`) &&
                !content.includes(`slots.${s}`) &&
                !content.includes(`ctxSlots?.${s}`) &&
                !content.includes(`directSlots?.${s}`) &&
                !content.includes(`contextSlots?.${s}`) &&
                !content.includes(`slots[`)
            )
            const undeclaredSlotsDispatched = renderSlotKeysDispatched.filter((s) => !declaredSlotKeys.includes(s))
            const missingConfigSlots = declaredSlotKeys.filter((s) => !configSlotKeys.includes(s))

            const compAttachments = attachments.filter((a) => a.root === compName).map((a) => ({ member: a.member, target: a.target }))

            const isContainerName =
              /List|Content|Section|Header|Body|Footer|Timeline|Card|Controls|Container|Group|Strip|Split|Toolbar/i.test(
                compName
              )
            const isContainerWithoutSlots = isContainerName && declaredSlotKeys.length === 0 && genericsCount <= 1

            diagnostics.push({
              file: relPath,
              componentName: compName,
              line: line + 1,
              hasCreateInterfaceComponent: true,
              genericsCount,
              propsType,
              slotsType,
              hasSlotsInProps,
              hasSlotPropsInProps,
              configSlotKeys,
              declaredSlotKeys,
              renderSlotKeysDispatched,
              unusedSlots,
              undeclaredSlotsDispatched,
              missingConfigSlots,
              inlineLambdaInDefaultComponent,
              isCompoundRoot: compAttachments.length > 0,
              attachments: compAttachments,
              missingSlotsGeneric,
              isContainerWithoutSlots,
            })
          }
        }
      }
    }
  })
}

// -----------------------------------------------------------------------------
// Categorize & Build Dependency Tree
// -----------------------------------------------------------------------------

function determineTier(file: string, comp: ComponentDiagnostic): { level: number; levelName: string; family: string } {
  const norm = file.toLowerCase()
  if (norm.includes('/media/')) {
    return { level: 1, levelName: 'Level 1: Independent Leaf Primitives', family: 'Media / Audio' }
  }
  if (norm.includes('/slider/')) {
    return { level: 1, levelName: 'Level 1: Independent Leaf Primitives', family: 'Core / Form Primitives' }
  }
  if (norm.includes('/color-slider') || norm.includes('/color-swatch-picker')) {
    return { level: 2, levelName: 'Level 2: Atomic Primitives & Subcomponents', family: 'Core / Color' }
  }
  if (norm.includes('/date-picker/')) {
    return { level: 2, levelName: 'Level 2: Atomic Primitives & Subcomponents', family: 'Core / Date & Picker' }
  }
  if (norm.includes('/sidebar/')) {
    return { level: 2, levelName: 'Level 2: Atomic Primitives & Subcomponents', family: 'Core / Navigation' }
  }
  if (norm.includes('/color-picker')) {
    return { level: 3, levelName: 'Level 3: Mid-Level Composite Widgets', family: 'Core / Color' }
  }
  if (norm.includes('/data-selection-bar') || norm.includes('/json-viewer') || norm.includes('/diff-viewer')) {
    return { level: 3, levelName: 'Level 3: Mid-Level Composite Widgets', family: 'Core / Data & Code Viewers' }
  }
  if (norm.includes('/drawer/')) {
    return { level: 3, levelName: 'Level 3: Mid-Level Composite Widgets', family: 'Core / Overlay & Layout' }
  }
  if (norm.includes('/tour-card') || norm.includes('/onboarding/')) {
    return { level: 4, levelName: 'Level 4: High-Level Module Composites', family: 'Onboarding / Tours' }
  }
  if (norm.includes('/charts/')) {
    return { level: 4, levelName: 'Level 4: High-Level Module Composites', family: 'Charts & Visualizations' }
  }
  return { level: 3, levelName: 'Level 3: Mid-Level Composite Widgets', family: 'General Core' }
}

const actionableIssues: ActionableIssue[] = []

for (const d of diagnostics) {
  const isActionable =
    d.missingSlotsGeneric ||
    d.unusedSlots.length > 0 ||
    d.undeclaredSlotsDispatched.length > 0 ||
    d.missingConfigSlots.length > 0 ||
    (d.declaredSlotKeys.length > 0 && (!d.hasSlotsInProps || !d.hasSlotPropsInProps)) ||
    d.inlineLambdaInDefaultComponent

  if (!isActionable) continue

  const tier = determineTier(d.file, d)
  const severity = (d.missingSlotsGeneric || d.undeclaredSlotsDispatched.length > 0 || d.inlineLambdaInDefaultComponent)
    ? 'HIGH'
    : 'MEDIUM'

  const summaries: string[] = []
  const fixes: string[] = []

  if (d.missingSlotsGeneric) {
    summaries.push(`Missing Slots generic in factory call`)
    fixes.push(`Change \`createInterfaceComponent<${d.propsType}>\` to \`createInterfaceComponent<${d.propsType}, ${d.componentName}Slots>\``)
  }
  if (d.undeclaredSlotsDispatched.length > 0) {
    summaries.push(`Dispatches undeclared slots: \`${d.undeclaredSlotsDispatched.join('`, `')}\``)
    fixes.push(`Declare \`${d.undeclaredSlotsDispatched.join('`, `')}\` in \`${d.componentName}Slots\` interface and register in factory \`slots\``)
  }
  if (d.unusedSlots.length > 0) {
    summaries.push(`Unrendered/phantom slots declared: \`${d.unusedSlots.join('`, `')}\``)
    fixes.push(`Dispatch via \`renderSlot\` in fallback tree or remove phantom declarations from interface`)
  }
  if (d.missingConfigSlots.length > 0) {
    summaries.push(`Declared slots omitted in \`config.slots\`: \`${d.missingConfigSlots.join('`, `')}\``)
    fixes.push(`Add slots \`${d.missingConfigSlots.join('`, `')}\` to factory \`slots: { ... }\``)
  }
  if (d.declaredSlotKeys.length > 0 && (!d.hasSlotsInProps || !d.hasSlotPropsInProps)) {
    summaries.push(`Missing slots/slotProps contracts in \`${d.propsType}\``)
    fixes.push(`Add \`slots?: SlotComponents<...>\` and \`slotProps?: SlotPropsMap<...>\` to \`${d.propsType}\``)
  }
  if (d.inlineLambdaInDefaultComponent) {
    summaries.push(`Inline lambda in defaultComponent (Rule C8.4 violation)`)
    fixes.push(`Extract inline \`() => <...>\` into top-level named stable component primitive`)
  }

  actionableIssues.push({
    file: d.file,
    component: d.componentName,
    line: d.line,
    level: tier.level,
    levelName: tier.levelName,
    family: tier.family,
    severity,
    missingSlotsGeneric: d.missingSlotsGeneric,
    unusedSlots: d.unusedSlots,
    undeclaredSlots: d.undeclaredSlotsDispatched,
    missingConfigSlots: d.missingConfigSlots,
    missingSlotsInProps: d.declaredSlotKeys.length > 0 && !d.hasSlotsInProps,
    missingSlotPropsInProps: d.declaredSlotKeys.length > 0 && !d.hasSlotPropsInProps,
    inlineLambda: d.inlineLambdaInDefaultComponent,
    summaryText: summaries.join('; '),
    recommendedFix: fixes.join(' | ')
  })
}

// Sort actionable issues by Level (1 to 4), then by File, then by Line
actionableIssues.sort((a, b) => a.level - b.level || a.file.localeCompare(b.file) || a.line - b.line)

// Group by file
const filesMap = new Map<string, ActionableIssue[]>()
for (const issue of actionableIssues) {
  if (!filesMap.has(issue.file)) filesMap.set(issue.file, [])
  filesMap.get(issue.file)!.push(issue)
}

const missingGeneric = diagnostics.filter((d) => d.missingSlotsGeneric)
const withUnused = diagnostics.filter((d) => d.unusedSlots.length > 0)
const withUndeclared = diagnostics.filter((d) => d.undeclaredSlotsDispatched.length > 0)
const withMissingConfig = diagnostics.filter((d) => d.missingConfigSlots.length > 0)
const withMissingPropsProps = diagnostics.filter(
  (d) => d.declaredSlotKeys.length > 0 && (!d.hasSlotsInProps || !d.hasSlotPropsInProps)
)
const withInlineLambda = diagnostics.filter((d) => d.inlineLambdaInDefaultComponent)
const containerWithoutSlots = diagnostics.filter((d) => d.isContainerWithoutSlots)
const compoundRoots = diagnostics.filter((d) => d.isCompoundRoot)

// -----------------------------------------------------------------------------
// Format Markdown Report
// -----------------------------------------------------------------------------

let md = `# 🧩 Consona Interface: Comprehensive Slots & Factory Diagnostic Report\n\n`
md += `> **Analysis of \`createInterfaceComponent<Props, Slots>\`, Slot Declarations, \`renderSlot\` Dispatches, Config Completeness, and Compound Composites Parity.**\n\n`
md += `**Generated:** ${new Date().toISOString()}  \n`
md += `**Total Factory Components Analyzed:** ${diagnostics.length} | **Files with Actionable Fixes:** ${filesMap.size} | **Compound Families:** ${compoundRoots.length}\n\n`

md += `## 📊 Executive Summary\n\n`
md += `| Category / Check | Violations / Count | Status |\n`
md += `| :--- | :---: | :---: |\n`
md += `| **1. Missing Slots Generic in Factory** (\`<Props>\` instead of \`<Props, Slots>\`) | **${missingGeneric.length}** | ${missingGeneric.length === 0 ? '✅ Clean' : '❌ Needs Fix'} |\n`
md += `| **2. Unused / Unrendered Slots** (Declared in \`*Slots\` interface but never rendered) | **${withUnused.length}** | ${withUnused.length === 0 ? '✅ Clean' : '❌ Needs Fix'} |\n`
md += `| **3. Undeclared Slots Dispatched** (\`renderSlot\` called with undeclared slot key) | **${withUndeclared.length}** | ${withUndeclared.length === 0 ? '✅ Clean' : '❌ Needs Fix'} |\n`
md += `| **4. Missing Keys in \`config.slots\`** (Declared in interface but omitted in factory config) | **${withMissingConfig.length}** | ${withMissingConfig.length === 0 ? '✅ Clean' : '⚠️ Warning'} |\n`
md += `| **5. Missing \`slots\` / \`slotProps\` in \`*Props\` interface** | **${withMissingPropsProps.length}** | ${withMissingPropsProps.length === 0 ? '✅ Clean' : '❌ Needs Fix'} |\n`
md += `| **6. Inline Lambda in \`defaultComponent\`** (Rule C8.4 violation) | **${withInlineLambda.length}** | ${withInlineLambda.length === 0 ? '✅ Clean' : '❌ Needs Fix'} |\n`
md += `| **7. Container Subcomponents with 0 Slots Declared** | **${containerWithoutSlots.length}** | ${containerWithoutSlots.length === 0 ? '✅ Clean' : '⚠️ Refactor'} |\n`
md += `| **8. Compound Component Families Audited** | **${compoundRoots.length}** | ℹ️ Audited |\n\n`
md += `---\n\n`

md += `## 🌳 Dependency Hierarchy & Fast-Resolution Tree\n\n`
md += `Execute fixes from bottom-up (**Level 1: Leaf Primitives** ➔ **Level 4: High-Level Module Composites**) to prevent broken slot types and cascading compiler regressions.\n\n`

const levels = [
  { level: 1, title: 'LEVEL 1: Independent Leaf Primitives (Zero internal UI dependencies)' },
  { level: 2, title: 'LEVEL 2: Atomic Primitives & Subcomponents' },
  { level: 3, title: 'LEVEL 3: Mid-Level Composite Widgets' },
  { level: 4, title: 'LEVEL 4: High-Level Module Composites' }
]

for (const lvl of levels) {
  const lvlIssues = actionableIssues.filter(i => i.level === lvl.level)
  md += `### 🏷️ ${lvl.title}\n\n`
  if (lvlIssues.length === 0) {
    md += `*✅ Clean — No issues in this tier.*\n\n`
    continue
  }

  const lvlFiles = Array.from(new Set(lvlIssues.map(i => i.file)))
  for (const f of lvlFiles) {
    const fIssues = lvlIssues.filter(i => i.file === f)
    md += `#### 📄 [\`${f}\`](file://${path.join(ROOT_DIR, f)})\n\n`
    md += `| Component | Line | Severity | Violation | Recommended Action |\n`
    md += `| :--- | :---: | :---: | :--- | :--- |\n`
    for (const item of fIssues) {
      const badge = item.severity === 'HIGH' ? '🔴 HIGH' : '🟡 MED'
      md += `| **\`${item.component}\`** | [L${item.line}](file://${path.join(ROOT_DIR, f)}#L${item.line}) | ${badge} | ${item.summaryText} | ${item.recommendedFix} |\n`
    }
    md += `\n`
  }
}

md += `---\n\n`

// Section 1
md += `## 1. Missing Slots Generic in Factory (\`<Props, Slots>\`)\n\n`
if (missingGeneric.length === 0) {
  md += `✅ *No components missing slots generic.*\n\n`
} else {
  md += `| File | Component | Line | Current Factory Call | Recommended Fix |\n`
  md += `| :--- | :--- | :---: | :--- | :--- |\n`
  for (const d of missingGeneric) {
    md += `| [\`${d.file}\`](file://${path.join(ROOT_DIR, d.file)}#L${d.line}) | **\`${d.componentName}\`** | [L${d.line}](file://${path.join(ROOT_DIR, d.file)}#L${d.line}) | \`createInterfaceComponent<${d.propsType}>\` | \`createInterfaceComponent<${d.propsType}, ${d.componentName}Slots>\` |\n`
  }
  md += `\n`
}

// Section 2
md += `## 2. Unused / Unrendered Slots (Declared but not dispatched)\n\n`
if (withUnused.length === 0) {
  md += `✅ *All declared slots are actively dispatched or referenced in JSX.*\n\n`
} else {
  md += `| File | Component | Line | Unused Slot Keys | Action Needed |\n`
  md += `| :--- | :--- | :---: | :--- | :--- |\n`
  for (const d of withUnused) {
    md += `| [\`${d.file}\`](file://${path.join(ROOT_DIR, d.file)}#L${d.line}) | **\`${d.componentName}\`** | [L${d.line}](file://${path.join(ROOT_DIR, d.file)}#L${d.line}) | \`${d.unusedSlots.join('`, `')}\` | Dispatch via \`renderSlot\` in fallback tree or remove phantom declarations |\n`
  }
  md += `\n`
}

// Section 3
md += `## 3. Undeclared Slots Dispatched via \`renderSlot\`\n\n`
if (withUndeclared.length === 0) {
  md += `✅ *No undeclared slots dispatched.*\n\n`
} else {
  md += `| File | Component | Line | Dispatched Slots | Missing from Interface | Action Needed |\n`
  md += `| :--- | :--- | :---: | :--- | :--- | :--- |\n`
  for (const d of withUndeclared) {
    md += `| [\`${d.file}\`](file://${path.join(ROOT_DIR, d.file)}#L${d.line}) | **\`${d.componentName}\`** | [L${d.line}](file://${path.join(ROOT_DIR, d.file)}#L${d.line}) | \`${d.undeclaredSlotsDispatched.join('`, `')}\` | \`${d.slotsType || d.componentName + 'Slots'}\` | Declare slot keys in \`${d.componentName}Slots\` interface & factory config |\n`
  }
  md += `\n`
}

// Section 4
md += `## 4. Missing Slots in Factory \`config.slots\`\n\n`
if (withMissingConfig.length === 0) {
  md += `✅ *All declared slots are registered in factory \`config.slots\`.*\n\n`
} else {
  md += `| File | Component | Line | Missing in \`config.slots\` | Recommended Fix |\n`
  md += `| :--- | :--- | :---: | :--- | :--- |\n`
  for (const d of withMissingConfig) {
    md += `| [\`${d.file}\`](file://${path.join(ROOT_DIR, d.file)}#L${d.line}) | **\`${d.componentName}\`** | [L${d.line}](file://${path.join(ROOT_DIR, d.file)}#L${d.line}) | \`${d.missingConfigSlots.join('`, `')}\` | Add default occupant or \`undefined\` to factory \`slots: { ... }\` |\n`
  }
  md += `\n`
}

// Section 5
md += `## 5. Missing \`slots\` / \`slotProps\` in \`*Props\` Interface\n\n`
if (withMissingPropsProps.length === 0) {
  md += `✅ *All props interfaces declare \`slots\` and \`slotProps\` properly.*\n\n`
} else {
  md += `| File | Component | Props Interface | Has \`slots\` | Has \`slotProps\` | Action Needed |\n`
  md += `| :--- | :--- | :--- | :---: | :---: | :--- |\n`
  for (const d of withMissingPropsProps) {
    md += `| [\`${d.file}\`](file://${path.join(ROOT_DIR, d.file)}#L${d.line}) | **\`${d.componentName}\`** | \`${d.propsType}\` | ${d.hasSlotsInProps ? '✅' : '❌'} | ${d.hasSlotPropsInProps ? '✅' : '❌'} | Add \`slots?: SlotComponents<...>\` & \`slotProps?: SlotPropsMap<...>\` |\n`
  }
  md += `\n`
}

// Section 6
md += `## 6. Inline Lambda in \`defaultComponent\` (Rule C8.4)\n\n`
if (withInlineLambda.length === 0) {
  md += `✅ *Zero inline lambdas in defaultComponent (all pass stable component identifiers).*\n\n`
} else {
  md += `| File | Component | Line | Action Needed |\n`
  md += `| :--- | :--- | :---: | :--- |\n`
  for (const d of withInlineLambda) {
    md += `| [\`${d.file}\`](file://${path.join(ROOT_DIR, d.file)}#L${d.line}) | **\`${d.componentName}\`** | [L${d.line}](file://${path.join(ROOT_DIR, d.file)}#L${d.line}) | Replace inline \`() => <...>\` with top-level stable primitive |\n`
  }
  md += `\n`
}

// Section 7
md += `## 7. Container Subcomponents with 0 Slots Declared\n\n`
if (containerWithoutSlots.length === 0) {
  md += `✅ *All container subcomponents have slots declared.*\n\n`
} else {
  md += `| File | Component | Line | Action Needed |\n`
  md += `| :--- | :--- | :---: | :--- |\n`
  for (const d of containerWithoutSlots) {
    md += `| [\`${d.file}\`](file://${path.join(ROOT_DIR, d.file)}#L${d.line}) | **\`${d.componentName}\`** | [L${d.line}](file://${path.join(ROOT_DIR, d.file)}#L${d.line}) | Define \`${d.componentName}Slots\`, pass generic to factory, and wire fallback slots |\n`
  }
  md += `\n`
}

// Section 8: Compound Family Anatomy
md += `## 8. Compound Component Families Anatomy & Slots Surface\n\n`
for (const root of compoundRoots) {
  md += `### 📦 \`${root.componentName}\` — [${root.file}](file://${path.join(ROOT_DIR, root.file)}#L${root.line})\n\n`
  md += `- **Root Slots (${root.declaredSlotKeys.length}):** ${root.declaredSlotKeys.length > 0 ? `\`${root.declaredSlotKeys.join('`, `')}\`` : '*none*'}\n`
  md += `- **Subcomponents Attached (${root.attachments.length}):**\n\n`
  md += `| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |\n`
  md += `| :--- | :--- | :---: | :--- | :--- |\n`
  for (const a of root.attachments) {
    const subDiag = diagnostics.find((s) => s.componentName === a.target)
    const slotList = subDiag?.declaredSlotKeys.length ? `\`${subDiag.declaredSlotKeys.join('`, `')}\`` : '*none*'
    const dispList = subDiag?.renderSlotKeysDispatched.length ? `\`${subDiag.renderSlotKeysDispatched.join('`, `')}\`` : '*none*'
    md += `| \`${root.componentName}.${a.member}\` | **\`${a.target}\`** | ${subDiag?.genericsCount || 0} | ${slotList} | ${dispList} |\n`
  }
  md += `\n`
}

// Save markdown and JSON reports
const mdReportPath = path.join(ROOT_DIR, 'slots-diagnostic-report.md')
const jsonReportPath = path.join(ROOT_DIR, 'slots-diagnostic-report.json')

const jsonOutput = {
  timestamp: new Date().toISOString(),
  summary: {
    totalComponentsAnalyzed: diagnostics.length,
    filesWithIssuesCount: filesMap.size,
    totalActionableIssues: actionableIssues.length,
    missingGenericCount: missingGeneric.length,
    unusedSlotsCount: withUnused.length,
    undeclaredSlotsCount: withUndeclared.length,
    missingConfigSlotsCount: withMissingConfig.length,
    missingPropsContractsCount: withMissingPropsProps.length,
    inlineLambdaCount: withInlineLambda.length,
    containerWithoutSlotsCount: containerWithoutSlots.length,
    compoundFamiliesCount: compoundRoots.length
  },
  actionableTreeByLevel: levels.map(lvl => ({
    level: lvl.level,
    title: lvl.title,
    files: Array.from(new Set(actionableIssues.filter(i => i.level === lvl.level).map(i => i.file))).map(f => ({
      file: f,
      issues: actionableIssues.filter(i => i.level === lvl.level && i.file === f)
    }))
  })),
  actionableIssues,
  diagnostics
}

fs.writeFileSync(mdReportPath, md, 'utf-8')
fs.writeFileSync(jsonReportPath, JSON.stringify(jsonOutput, null, 2), 'utf-8')

// -----------------------------------------------------------------------------
// Terminal Output Formatting
// -----------------------------------------------------------------------------

console.log(`\n=============================================================================`)
console.log(`  🧩 CONSONA INTERFACE: SLOTS & FACTORY DIAGNOSTIC`)
console.log(`=============================================================================`)
console.log(`  Analyzed Components: ${diagnostics.length}`)
console.log(`  Files with Issues:   ${filesMap.size}`)
console.log(`  Actionable Issues:   ${actionableIssues.length}`)
console.log(`-----------------------------------------------------------------------------`)
console.log(`  ❌ Missing Generic in Factory:  ${missingGeneric.length}`)
console.log(`  ❌ Undeclared Dispatched Slots:  ${withUndeclared.length}`)
console.log(`  ❌ Inline Lambda in defaultComp: ${withInlineLambda.length}`)
console.log(`  ❌ Missing Props Contracts:     ${withMissingPropsProps.length}`)
console.log(`  ⚠️  Unused/Phantom Slots:        ${withUnused.length}`)
console.log(`  ⚠️  Missing Factory Config Keys: ${withMissingConfig.length}`)
console.log(`=============================================================================\n`)

console.log(`🌳 FAST-RESOLUTION DEPENDENCY TREE (Leaf ➔ High-Level):\n`)
for (const lvl of levels) {
  const lvlIssues = actionableIssues.filter(i => i.level === lvl.level)
  console.log(`▶ [${lvl.title}]`)
  if (lvlIssues.length === 0) {
    console.log(`   (No violations)\n`)
    continue
  }
  const lvlFiles = Array.from(new Set(lvlIssues.map(i => i.file)))
  for (const f of lvlFiles) {
    const fIssues = lvlIssues.filter(i => i.file === f)
    console.log(`   📂 ${f}`)
    for (const item of fIssues) {
      const icon = item.severity === 'HIGH' ? '🔴' : '🟡'
      console.log(`      ${icon} ${item.component} (L${item.line}): ${item.summaryText}`)
      console.log(`         👉 Fix: ${item.recommendedFix}`)
    }
  }
  console.log(``)
}

console.log(`✅ Slot & Factory Diagnostic Report successfully written to:`)
console.log(`   - 📄 ${path.relative(ROOT_DIR, mdReportPath)}`)
console.log(`   - 📊 ${path.relative(ROOT_DIR, jsonReportPath)}\n`)
