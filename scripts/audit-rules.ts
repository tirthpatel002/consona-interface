import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as ts from 'typescript'

export interface Violation {
  file: string
  line?: number
  rule: string
  ruleId: string
  category: 'mechanical' | 'structural' | 'architectural'
  fixStrategy: 'auto' | 'semi-auto' | 'manual'
  message: string
  severity: 'error' | 'warning'
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT_DIR, 'src')
const DOCS_DIR = path.join(ROOT_DIR, 'app', 'src', 'docs')

const violations: Violation[] = []

function addViolation(v: Violation) {
  violations.push(v)
}

function getAllFiles(dir: string, extensions: string[] = ['.ts', '.tsx']): string[] {
  let results: string[] = []
  if (!fs.existsSync(dir)) return results
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git' && file !== '.next') {
        results = results.concat(getAllFiles(filePath, extensions))
      }
    } else {
      if (
        extensions.some((ext) => file.endsWith(ext)) &&
        !file.endsWith('.d.ts') &&
        !file.endsWith('.test.ts') &&
        !file.endsWith('.test.tsx') &&
        !file.endsWith('.spec.ts') &&
        !file.endsWith('.spec.tsx') &&
        !file.endsWith('.stories.tsx')
      ) {
        results.push(filePath)
      }
    }
  }
  return results
}

// =============================================================================
// Helper: TypeScript AST & JSDoc Helpers
// =============================================================================

interface ParsedFile {
  filePath: string
  content: string
  sourceFile: ts.SourceFile
  exportedInterfaces: Map<string, ts.InterfaceDeclaration>
  exportedTypeAliases: Map<string, ts.TypeAliasDeclaration>
  exportedFunctions: Map<string, ts.FunctionDeclaration>
  exportedVariables: Map<string, ts.VariableDeclaration>
  importDeclarations: ts.ImportDeclaration[]
  allFunctions: ts.FunctionDeclaration[]
  allArrowFunctions: ts.ArrowFunction[]
  callExpressions: ts.CallExpression[]
  jsxElements: ts.JsxElement[]
  jsxSelfClosingElements: ts.JsxSelfClosingElement[]
}

function hasJsDoc(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  const jsDocProp = (node as any).jsDoc
  if (jsDocProp && jsDocProp.length > 0) return true

  const commentRanges = ts.getLeadingCommentRanges(sourceFile.text, node.getFullStart())
  if (!commentRanges) return false
  return commentRanges.some((range) => {
    const commentText = sourceFile.text.slice(range.pos, range.end)
    return commentText.startsWith('/**')
  })
}

function parseTsFile(filePath: string): ParsedFile {
  const content = fs.readFileSync(filePath, 'utf-8')
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true)

  const exportedInterfaces = new Map<string, ts.InterfaceDeclaration>()
  const exportedTypeAliases = new Map<string, ts.TypeAliasDeclaration>()
  const exportedFunctions = new Map<string, ts.FunctionDeclaration>()
  const exportedVariables = new Map<string, ts.VariableDeclaration>()
  const importDeclarations: ts.ImportDeclaration[] = []
  const allFunctions: ts.FunctionDeclaration[] = []
  const allArrowFunctions: ts.ArrowFunction[] = []
  const callExpressions: ts.CallExpression[] = []
  const jsxElements: ts.JsxElement[] = []
  const jsxSelfClosingElements: ts.JsxSelfClosingElement[] = []

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      importDeclarations.push(node)
    } else if (ts.isInterfaceDeclaration(node)) {
      if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exportedInterfaces.set(node.name.text, node)
      }
    } else if (ts.isTypeAliasDeclaration(node)) {
      if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exportedTypeAliases.set(node.name.text, node)
      }
    } else if (ts.isFunctionDeclaration(node)) {
      allFunctions.push(node)
      if (node.name && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exportedFunctions.set(node.name.text, node)
      }
    } else if (ts.isArrowFunction(node)) {
      allArrowFunctions.push(node)
    } else if (ts.isVariableStatement(node)) {
      if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            exportedVariables.set(decl.name.text, decl)
          }
        }
      }
    } else if (ts.isCallExpression(node)) {
      callExpressions.push(node)
    } else if (ts.isJsxElement(node)) {
      jsxElements.push(node)
    } else if (ts.isJsxSelfClosingElement(node)) {
      jsxSelfClosingElements.push(node)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return {
    filePath,
    content,
    sourceFile,
    exportedInterfaces,
    exportedTypeAliases,
    exportedFunctions,
    exportedVariables,
    importDeclarations,
    allFunctions,
    allArrowFunctions,
    callExpressions,
    jsxElements,
    jsxSelfClosingElements,
  }
}

// =============================================================================
// 1. Audit Pure Engine Files (Rule ENG1, ENG2)
// =============================================================================
function auditEngineFiles() {
  const engineFiles = getAllFiles(path.join(SRC_DIR, 'modules')).filter((f) =>
    f.includes('/engine/') && (f.endsWith('.ts') || f.endsWith('.tsx'))
  )

  for (const file of engineFiles) {
    const parsed = parseTsFile(file)
    const { sourceFile } = parsed

    // Check 1.1: Zero React / react-dom imports (Rule ENG1)
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '')
        if (
          moduleSpecifier === 'react' ||
          moduleSpecifier === 'react-dom' ||
          moduleSpecifier.startsWith('react/') ||
          moduleSpecifier.startsWith('react-dom/')
        ) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
          addViolation({
            file: path.relative(ROOT_DIR, file),
            line: line + 1,
            ruleId: 'ENG1',
            rule: 'Rule ENG1 (Zero React in Pure Engines)',
            category: 'architectural',
            fixStrategy: 'manual',
            message: `Pure engine file imports '${moduleSpecifier}'. Engines must be 100% framework-agnostic TypeScript.`,
            severity: 'error',
          })
        }
      }
    })

    // Check 1.2: No direct localStorage / sessionStorage access (Rule ENG2)
    function checkStorageIdentifiers(node: ts.Node) {
      if (ts.isIdentifier(node)) {
        if (node.text === 'localStorage' || node.text === 'sessionStorage') {
          const parent = node.parent
          if (
            !ts.isPropertySignature(parent) &&
            !ts.isTypeReferenceNode(parent) &&
            !ts.isImportSpecifier(parent)
          ) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
            addViolation({
              file: path.relative(ROOT_DIR, file),
              line: line + 1,
              ruleId: 'ENG2',
              rule: 'Rule ENG2 (Pluggable Storage Adapters)',
              category: 'architectural',
              fixStrategy: 'manual',
              message: `Direct reference to '${node.text}' found in engine. Use pluggable StorageAdapter injected via options.`,
              severity: 'warning',
            })
          }
        }
      }
      ts.forEachChild(node, checkStorageIdentifiers)
    }
    checkStorageIdentifiers(sourceFile)
  }
}

// =============================================================================
// 2. Audit Hook Contracts (Rule 4 Type A, B, C)
// =============================================================================
function auditHooks() {
  // Type A: Universal hooks in src/hooks/
  const universalHooks = getAllFiles(path.join(SRC_DIR, 'hooks'))
  for (const file of universalHooks) {
    if (file.endsWith('index.ts')) continue
    const parsed = parseTsFile(file)
    const { sourceFile } = parsed

    let usesContext = false
    function checkContextUsage(node: ts.Node) {
      if (ts.isCallExpression(node)) {
        const text = node.expression.getText(sourceFile)
        if (text === 'useContext' || text === 'React.useContext') {
          usesContext = true
        }
      }
      ts.forEachChild(node, checkContextUsage)
    }
    checkContextUsage(sourceFile)

    if (usesContext) {
      addViolation({
        file: path.relative(ROOT_DIR, file),
        ruleId: 'H1',
        rule: 'Rule H1 (Universal Utility Hooks)',
        category: 'architectural',
        fixStrategy: 'manual',
        message: `Universal hook in src/hooks/ uses React Context. Universal utility hooks must be context-free.`,
        severity: 'warning',
      })
    }
  }

  // Type B & C: Domain hooks in src/modules/*/hooks/
  const domainHooks = getAllFiles(path.join(SRC_DIR, 'modules')).filter((f) =>
    f.includes('/hooks/') && !f.endsWith('index.ts')
  )

  for (const file of domainHooks) {
    const parsed = parseTsFile(file)
    const { sourceFile, jsxElements, jsxSelfClosingElements } = parsed

    // Check Type B: Headless UI hooks must render zero JSX
    if (jsxElements.length > 0 || jsxSelfClosingElements.length > 0) {
      addViolation({
        file: path.relative(ROOT_DIR, file),
        ruleId: 'H2',
        rule: 'Rule H2 (Headless UI Hooks)',
        category: 'architectural',
        fixStrategy: 'manual',
        message: `Headless UI hook file contains JSX elements. Headless hooks must render zero JSX.`,
        severity: 'error',
      })
    }
  }
}

// =============================================================================
// 3. Deep Component, Slot, Composite & Attachment Audit (Rule C0 - C8)
// =============================================================================
function auditComponents() {
  const componentDirs = fs.readdirSync(path.join(SRC_DIR, 'modules'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(SRC_DIR, 'modules', d.name, 'components'))
    .filter((d) => fs.existsSync(d))

  const allComponentFiles: string[] = []
  for (const compRoot of componentDirs) {
    const compFolders = fs.readdirSync(compRoot, { withFileTypes: true }).filter((d) => d.isDirectory())
    for (const folder of compFolders) {
      const folderPath = path.join(compRoot, folder.name)
      const tsxFile = path.join(folderPath, `${folder.name}.tsx`)
      const indexFile = path.join(folderPath, 'index.ts')

      // Check Rule C2: Folder per component structure
      if (fs.existsSync(tsxFile)) {
        allComponentFiles.push(tsxFile)
        if (!fs.existsSync(indexFile)) {
          addViolation({
            file: path.relative(ROOT_DIR, folderPath),
            ruleId: 'C2',
            rule: 'Rule C2 (Folder-per-Component Structure)',
            category: 'mechanical',
            fixStrategy: 'auto',
            message: `Component folder '${folder.name}' is missing local 'index.ts' re-export.`,
            severity: 'error',
          })
        }
      }
    }
  }

  for (const file of allComponentFiles) {
    const parsed = parseTsFile(file)
    const {
      sourceFile,
      content,
      exportedInterfaces,
      exportedTypeAliases,
      exportedVariables,
      importDeclarations,
      callExpressions,
      jsxElements,
      jsxSelfClosingElements,
    } = parsed

    // -------------------------------------------------------------------------
    // 3.1 Factory Wrapping (Rule C1)
    // -------------------------------------------------------------------------
    interface FactoryCallInfo {
      name: string
      propsType?: string
      slotsType?: string
      configNode?: ts.ObjectLiteralExpression
      node: ts.CallExpression
    }

    const factoryCalls: FactoryCallInfo[] = []

    for (const [varName, varDecl] of exportedVariables) {
      if (varDecl.initializer && ts.isCallExpression(varDecl.initializer)) {
        const callExpr = varDecl.initializer
        const fnName = callExpr.expression.getText(sourceFile)
        if (fnName === 'createInterfaceComponent') {
          let propsType: string | undefined
          let slotsType: string | undefined
          if (callExpr.typeArguments && callExpr.typeArguments.length > 0) {
            propsType = callExpr.typeArguments[0]?.getText(sourceFile)
            if (callExpr.typeArguments.length > 1) {
              slotsType = callExpr.typeArguments[1]?.getText(sourceFile)
            }
          }

          let configNode: ts.ObjectLiteralExpression | undefined
          if (callExpr.arguments.length > 0 && ts.isObjectLiteralExpression(callExpr.arguments[0])) {
            configNode = callExpr.arguments[0] as ts.ObjectLiteralExpression
          }

          factoryCalls.push({
            name: varName,
            propsType,
            slotsType,
            configNode,
            node: callExpr,
          })
        }
      }
    }

    if (factoryCalls.length === 0 && !file.includes('/context') && !file.includes('/styles')) {
      addViolation({
        file: path.relative(ROOT_DIR, file),
        ruleId: 'C1',
        rule: 'Rule C1 (Mandatory Factory Wrapper)',
        category: 'architectural',
        fixStrategy: 'manual',
        message: `Component file does not export any component wrapped in 'createInterfaceComponent'.`,
        severity: 'error',
      })
    }

    // -------------------------------------------------------------------------
    // 3.1.1 Factory Config Metadata Check (Rule C1, Rule 6.4)
    // -------------------------------------------------------------------------
    for (const fc of factoryCalls) {
      if (fc.configNode) {
        const propNames = new Set<string>()
        let slotsConfigNode: ts.ObjectLiteralExpression | undefined

        for (const prop of fc.configNode.properties) {
          if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
            propNames.add(prop.name.text)
            if (prop.name.text === 'slots' && ts.isObjectLiteralExpression(prop.initializer)) {
              slotsConfigNode = prop.initializer
            }
          } else if (ts.isShorthandPropertyAssignment(prop)) {
            propNames.add(prop.name.text)
          }
        }

        const requiredConfigKeys = ['name', 'category', 'description', 'version']
        for (const key of requiredConfigKeys) {
          if (!propNames.has(key)) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(fc.configNode.getStart())
            addViolation({
              file: path.relative(ROOT_DIR, file),
              line: line + 1,
              ruleId: 'C1.4',
              rule: 'Rule C1 & 6.4 (Factory Config Metadata)',
              category: 'mechanical',
              fixStrategy: 'auto',
              message: `Factory configuration for '${fc.name}' is missing required metadata property '${key}'.`,
              severity: 'warning',
            })
          }
        }

        // Verify that all slots declared in <Name>Slots are registered in factory config.slots
        if (fc.slotsType && exportedInterfaces.has(fc.slotsType)) {
          const slotsIface = exportedInterfaces.get(fc.slotsType)!
          const configuredSlotKeys = new Set<string>()
          if (slotsConfigNode) {
            for (const sp of slotsConfigNode.properties) {
              if (ts.isPropertyAssignment(sp) && ts.isIdentifier(sp.name)) {
                configuredSlotKeys.add(sp.name.text)
              }
            }
          }

          for (const member of slotsIface.members) {
            if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
              const sKey = member.name.text
              if (!configuredSlotKeys.has(sKey)) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(member.getStart())
                addViolation({
                  file: path.relative(ROOT_DIR, file),
                  line: line + 1,
                  ruleId: 'C5.slotsConfig',
                  rule: 'Rule C5 (Factory Config Slots Completeness)',
                  category: 'mechanical',
                  fixStrategy: 'auto',
                  message: `Slot '${sKey}' declared in '${fc.slotsType}' is not registered in '${fc.name}' factory 'config.slots'. Register default occupant or undefined.`,
                  severity: 'warning',
                })
              }
            }
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3.2 Props vs Type Alias check (Rule 6.2 - AST Registry Compatibility)
    // -------------------------------------------------------------------------
    for (const [typeName, typeNode] of exportedTypeAliases) {
      if (
        typeName.endsWith('Props') &&
        !typeName.includes('RAC') &&
        !typeName.includes('HTML') &&
        !typeName.includes('Slot')
      ) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(typeNode.getStart())
        addViolation({
          file: path.relative(ROOT_DIR, file),
          line: line + 1,
          ruleId: '6.2',
          rule: 'Rule 6.2 (AST Registry Interface Parser Contract)',
          category: 'mechanical',
          fixStrategy: 'auto',
          message: `Props '${typeName}' is defined as a 'type' alias instead of 'export interface ${typeName}'. AST registry requires exported interfaces.`,
          severity: 'warning',
        })
      }
    }

    // -------------------------------------------------------------------------
    // 3.3 Slots System & Missing Slots / renderSlot Dispatch (Rule C5, C5.2, C5.3)
    // -------------------------------------------------------------------------
    const slotInterfaces: { name: string; node: ts.InterfaceDeclaration; slots: string[] }[] = []

    for (const [ifaceName, ifaceNode] of exportedInterfaces) {
      if (ifaceName.endsWith('Slots')) {
        const slotKeys: string[] = []
        for (const member of ifaceNode.members) {
          if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
            const slotKey = member.name.text
            slotKeys.push(slotKey)

            // Check C5.2: Untyped 'any' in slots
            const propTypeStr = member.type ? member.type.getText(sourceFile) : ''
            if (
              propTypeStr === 'any' ||
              /\bComponentType\s*<\s*any\s*>/.test(propTypeStr) ||
              /\bSlotDefinition\s*<\s*any\s*>/.test(propTypeStr) ||
              /\|\s*any\b/.test(propTypeStr)
            ) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(member.getStart())
              addViolation({
                file: path.relative(ROOT_DIR, file),
                line: line + 1,
                ruleId: 'C5.2',
                rule: 'Rule C5.2 (Organized & Explicit Slot Props Typing)',
                category: 'structural',
                fixStrategy: 'semi-auto',
                message: `Slot '${slotKey}' in '${ifaceName}' contains untyped 'any' (${propTypeStr}). Provide a strongly typed props interface.`,
                severity: 'warning',
              })
            }

            // Check C7: JSDoc comments on slot properties
            if (!hasJsDoc(member, sourceFile)) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(member.getStart())
              addViolation({
                file: path.relative(ROOT_DIR, file),
                line: line + 1,
                ruleId: 'C7.slots',
                rule: 'Rule C7 (Mandatory JSDoc on Slots)',
                category: 'mechanical',
                fixStrategy: 'semi-auto',
                message: `Slot '${slotKey}' in '${ifaceName}' is missing descriptive JSDoc comment.`,
                severity: 'warning',
              })
            }
          }
        }
        slotInterfaces.push({ name: ifaceName, node: ifaceNode, slots: slotKeys })
      }
    }

    // Verify that every declared slot is actually dispatched or referenced
    for (const slotIface of slotInterfaces) {
      for (const slotKey of slotIface.slots) {
        const hasSlotUsage =
          new RegExp(`renderSlot\\s*\\(\\s*(?:slots|slotComponents)\\s*(?:\\?\\.)?\.?\\[?\\s*['"]?${slotKey}['"]?`, 'i').test(content) ||
          new RegExp(`slots\\s*(?:\\?\\.)\\s*${slotKey}`, 'i').test(content) ||
          new RegExp(`slots\\s*\\.\\s*${slotKey}`, 'i').test(content) ||
          new RegExp(`slots\\s*\\[\\s*['"]${slotKey}['"]\\s*\\]`, 'i').test(content) ||
          new RegExp(`RenderSlot[^>]*slot\\s*=\\s*\\{\\s*slots(?:\\?\\.)?\\.${slotKey}`, 'i').test(content) ||
          new RegExp(`${slotKey}\\s*:\\s*slots(?:\\?\\.)?\\.${slotKey}`, 'i').test(content) ||
          new RegExp(`\\b${slotKey}\\s*:\\s*slots\\[`, 'i').test(content)

        if (!hasSlotUsage) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(slotIface.node.getStart())
          addViolation({
            file: path.relative(ROOT_DIR, file),
            line: line + 1,
            ruleId: 'C5.unused',
            rule: 'Rule C5 (Unused / Phantom Slot Declaration)',
            category: 'structural',
            fixStrategy: 'manual',
            message: `Slot '${slotKey}' declared in '${slotIface.name}' is never rendered via 'renderSlot' or dispatched in JSX.`,
            severity: 'error',
          })
        }
      }
    }

    // AST-based Check for renderSlot Calls: Stable defaultComponent & SlotProps Passthrough
    for (const callExpr of callExpressions) {
      const fnName = callExpr.expression.getText(sourceFile)
      if (fnName === 'renderSlot') {
        const slotArg = callExpr.arguments[0]?.getText(sourceFile)
        const propsArg = callExpr.arguments[1]
        const optionsArg = callExpr.arguments[2]

        // Check C8.4: Stable defaultComponent References in renderSlot
        if (optionsArg && ts.isObjectLiteralExpression(optionsArg)) {
          for (const prop of optionsArg.properties) {
            if (ts.isPropertyAssignment(prop) && prop.name.getText(sourceFile) === 'defaultComponent') {
              const init = prop.initializer
              if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(prop.getStart())
                addViolation({
                  file: path.relative(ROOT_DIR, file),
                  line: line + 1,
                  ruleId: 'C8.4',
                  rule: 'Rule C8.4 (Stable defaultComponent References)',
                  category: 'mechanical',
                  fixStrategy: 'auto',
                  message: `Inline lambda used as defaultComponent in renderSlot. Pass stable component reference to avoid remount loops.`,
                  severity: 'error',
                })
              }
            }
          }
        }

        // Check C5.3: slotProps forwarding
        if (slotArg && (content.includes('slotProps?:') || content.includes('slotProps :') || content.includes('slotProps?.'))) {
          const match = slotArg.match(/(?:slots|slotComponents)(?:\?\.)?\.?(\w+)/)
          if (match) {
            const slotKey = match[1]
            const propsArgText = propsArg ? propsArg.getText(sourceFile) : ''
            if (
              !propsArgText.includes(`slotProps?.${slotKey}`) &&
              !propsArgText.includes(`slotProps?.[`) &&
              !propsArgText.includes(`slotProps.${slotKey}`) &&
              !propsArgText.includes(`...slotProps`) &&
              propsArgText !== 'slotProps' &&
              propsArgText !== 'slotPropsMap'
            ) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(callExpr.getStart())
              addViolation({
                file: path.relative(ROOT_DIR, file),
                line: line + 1,
                ruleId: 'C5.3',
                rule: 'Rule C5.3 (SlotProps Passthrough Violation)',
                category: 'mechanical',
                fixStrategy: 'auto',
                message: `Slot '${slotKey}' is rendered via 'renderSlot' but does not forward 'slotProps?.${slotKey}'. Downstream slotProps overrides will be silently ignored.`,
                severity: 'warning',
              })
            }
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3.4 Prop Defaults Contract (Rule C1, C8)
    // -------------------------------------------------------------------------
    for (const [ifaceName, ifaceNode] of exportedInterfaces) {
      if (ifaceName.endsWith('Props') && !ifaceName.includes('RAC') && !ifaceName.includes('Slot')) {
        for (const member of ifaceNode.members) {
          if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
            const propKey = member.name.text
            if (['intent', 'size', 'variant', 'density'].includes(propKey)) {
              const hasDestructuringDefault = new RegExp(`\\b${propKey}\\s*=\\s*['"a-zA-Z0-9_]`).test(content)
              const hasConfigDefault = new RegExp(`['"]?${propKey}['"]?\\s*:`).test(content)
              if (!hasDestructuringDefault && !hasConfigDefault) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(member.getStart())
                addViolation({
                  file: path.relative(ROOT_DIR, file),
                  line: line + 1,
                  ruleId: 'C8.defaults',
                  rule: 'Rule C8 (Missing Explicit Prop Default)',
                  category: 'structural',
                  fixStrategy: 'semi-auto',
                  message: `Configurable prop '${propKey}' in '${ifaceName}' has no explicit default value in factory 'config.props' or render function parameter destructuring.`,
                  severity: 'warning',
                })
              }
            }
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3.5 JSDoc on Props Properties (Rule C7)
    // -------------------------------------------------------------------------
    for (const [ifaceName, ifaceNode] of exportedInterfaces) {
      if (ifaceName.endsWith('Props') && !ifaceName.includes('RAC') && !ifaceName.includes('Slot')) {
        for (const member of ifaceNode.members) {
          if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
            const propKey = member.name.text
            if (['className', 'children', 'slots', 'slotProps', 'ref', 'style', 'id', 'key'].includes(propKey)) {
              continue
            }
            if (!hasJsDoc(member, sourceFile)) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(member.getStart())
              addViolation({
                file: path.relative(ROOT_DIR, file),
                line: line + 1,
                ruleId: 'C7.props',
                rule: 'Rule C7 (Mandatory JSDoc on Component Props)',
                category: 'mechanical',
                fixStrategy: 'semi-auto',
                message: `Prop '${propKey}' in interface '${ifaceName}' is missing descriptive JSDoc documentation.`,
                severity: 'warning',
              })
            }
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3.6 Rule C4: Optical Scale Conformance (Hardcoded pixels check)
    // -------------------------------------------------------------------------
    const hardcodedPixelMatches = content.matchAll(/(?:rounded|p|m|gap|top|left|right|bottom|w|h)-\[(\d+)px\]/g)
    for (const match of hardcodedPixelMatches) {
      const pxVal = parseInt(match[1], 10)
      if (
        pxVal > 1 &&
        pxVal !== 0 &&
        !file.includes('/orb/') &&
        !file.includes('/media/') &&
        !file.includes('/charts/')
      ) {
        const index = match.index || 0
        const { line } = sourceFile.getLineAndCharacterOfPosition(index)
        addViolation({
          file: path.relative(ROOT_DIR, file),
          line: line + 1,
          ruleId: 'C4',
          rule: 'Rule C4 (Optical Scale Conformance)',
          category: 'structural',
          fixStrategy: 'semi-auto',
          message: `Arbitrary hardcoded pixel utility '${match[0]}' found. Use optical tokens (e.g. rounded-macro/base/micro/atom or p-space-*).`,
          severity: 'warning',
        })
      }
    }

    // -------------------------------------------------------------------------
    // 3.7 Compound Subcomponent Attachments & Children Contract (Rule C6, C8)
    // -------------------------------------------------------------------------
    const staticAttachmentMatches = content.matchAll(/([A-Z][a-zA-Z0-9]+)\.([A-Z][a-zA-Z0-9]+)\s*=\s*([a-zA-Z0-9_]+)/g)
    const attachmentsMap: Record<string, string[]> = {}

    for (const match of staticAttachmentMatches) {
      const parent = match[1]
      const child = match[2]
      if (!attachmentsMap[parent]) {
        attachmentsMap[parent] = []
      }
      attachmentsMap[parent].push(child)
    }

    for (const parentName of Object.keys(attachmentsMap)) {
      const propsIfaceName = `${parentName}Props`
      const propsIface = exportedInterfaces.get(propsIfaceName)
      if (propsIface) {
        let hasChildren = false
        for (const member of propsIface.members) {
          if (ts.isPropertySignature(member) && ts.isIdentifier(member.name) && member.name.text === 'children') {
            hasChildren = true
          }
        }
        const propsIfaceText = propsIface.getText(sourceFile)
        if (!hasChildren && !propsIfaceText.includes('children') && !propsIfaceText.includes('HTMLAttributes') && !propsIfaceText.includes('ComponentPropsWithoutRef')) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(propsIface.getStart())
          addViolation({
            file: path.relative(ROOT_DIR, file),
            line: line + 1,
            ruleId: 'C8.children',
            rule: 'Rule C8 (Compound Composition & Children Contract)',
            category: 'structural',
            fixStrategy: 'manual',
            message: `Compound root component '${parentName}' defines subcomponents (${attachmentsMap[parentName].join(', ')}) but '${propsIfaceName}' is missing 'children' prop definition.`,
            severity: 'error',
          })
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3.8 Embedded Domain Sub-Feature Ingestion Check (Rule C5.0)
    // -------------------------------------------------------------------------
    const importedDomainComponents: { name: string; node: ts.ImportSpecifier }[] = []
    for (const imp of importDeclarations) {
      const mod = imp.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '')
      if (mod.startsWith('../') || mod.startsWith('../../') || mod.startsWith('@consona/interface')) {
        if (imp.importClause?.namedBindings && ts.isNamedImports(imp.importClause.namedBindings)) {
          for (const el of imp.importClause.namedBindings.elements) {
            const importName = el.name.text
            if (
              /^[A-Z][a-zA-Z0-9]+$/.test(importName) &&
              !['Button', 'Loader', 'Badge', 'Kbd', 'Separator', 'Icon', 'SizeProvider', 'ThemeProvider', 'InterfaceProvider'].includes(importName) &&
              !importName.endsWith('Icon') &&
              !importName.endsWith('Context') &&
              !importName.endsWith('Provider')
            ) {
              importedDomainComponents.push({ name: importName, node: el })
            }
          }
        }
      }
    }

    const allJsxTags = [
      ...jsxElements.map((el) => ({ name: el.openingElement.tagName.getText(sourceFile), start: el.getStart() })),
      ...jsxSelfClosingElements.map((el) => ({ name: el.tagName.getText(sourceFile), start: el.getStart() })),
    ]

    for (const impComp of importedDomainComponents) {
      const isRenderedInJsx = allJsxTags.some((tag) => tag.name === impComp.name)
      if (isRenderedInJsx) {
        const hasSlotForImport = slotInterfaces.some((iface) =>
          iface.slots.some((s) => s.toLowerCase().includes(impComp.name.toLowerCase()) || impComp.name.toLowerCase().includes(s.toLowerCase()))
        ) || content.includes(`renderSlot`) && (content.includes(impComp.name))

        if (!hasSlotForImport) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(impComp.node.getStart())
          addViolation({
            file: path.relative(ROOT_DIR, file),
            line: line + 1,
            ruleId: 'C5.0.embedded',
            rule: 'Rule C5.0 (Embedded Sub-Feature Slot Surface)',
            category: 'structural',
            fixStrategy: 'manual',
            message: `Component embeds domain component '<${impComp.name} />' directly in JSX without exposing a slot or compound attachment. Expose a slot (e.g. 'slots.${impComp.name.charAt(0).toLowerCase() + impComp.name.slice(1)}') with '<${impComp.name}>' as defaultComponent to allow downstream customization.`,
            severity: 'warning',
          })
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3.9 Collection Iteration Item Slot Check (Rule C5.0, C6)
    // -------------------------------------------------------------------------
    for (const call of callExpressions) {
      if (ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === 'map') {
        const callerName = call.expression.expression.getText(sourceFile)
        if (/items|devices|options|list|series|rows|points|nodes|tabs|steps/i.test(callerName)) {
          const mapArg = call.arguments[0]
          if (mapArg && (ts.isArrowFunction(mapArg) || ts.isFunctionExpression(mapArg))) {
            const mapBodyText = mapArg.body.getText(sourceFile)
            if (
              (/<button\b|<a\b|onClick\s*=/i.test(mapBodyText)) &&
              !mapBodyText.includes('renderSlot') &&
              !mapBodyText.includes('<RenderSlot') &&
              !mapBodyText.includes('.Item') &&
              !file.includes('/chart-container')
            ) {
              const hasItemSlot = slotInterfaces.some((iface) =>
                iface.slots.some((s) => ['item', 'row', 'card', 'option', 'tab', 'step'].includes(s.toLowerCase()))
              )
              if (!hasItemSlot) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(call.getStart())
                addViolation({
                  file: path.relative(ROOT_DIR, file),
                  line: line + 1,
                  ruleId: 'C5.0.collection',
                  rule: 'Rule C5.0 (Collection Iteration Item Slot)',
                  category: 'structural',
                  fixStrategy: 'manual',
                  message: `Component iterates over collection ('${callerName}.map') rendering interactive items directly without an item slot ('slots.item') or compound subcomponent. Expose a swappable item slot for downstream list customization.`,
                  severity: 'warning',
                })
              }
            }
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3.10 Ad-hoc Overlay / Popover Backdrop Check (Rule C0)
    // -------------------------------------------------------------------------
    const isLegitOverlay =
      file.includes('overlay') ||
      file.includes('modal') ||
      file.includes('drawer') ||
      file.includes('dialog') ||
      file.includes('sheet') ||
      file.includes('command-menu') ||
      file.includes('sidebar') ||
      file.includes('media-image') ||
      file.includes('tour-spotlight')

    if (content.includes('fixed inset-0') && !isLegitOverlay) {
      const match = content.match(/fixed\s+inset-0/i)
      const index = match?.index || 0
      const { line } = sourceFile.getLineAndCharacterOfPosition(index)
      addViolation({
        file: path.relative(ROOT_DIR, file),
        line: line + 1,
        ruleId: 'C0.overlay',
        rule: 'Rule C0 & C5.0 (Ad-hoc Overlay Implementation)',
        category: 'architectural',
        fixStrategy: 'manual',
        message: `Component implements a bespoke click-to-dismiss backdrop overlay ('fixed inset-0'). Prefer kernel 'OverlayTrigger' / 'Popover' / 'CollectionPopover' or expose 'slots.menu' / 'slots.popover'.`,
        severity: 'warning',
      })
    }
  }
}

// =============================================================================
// 4. Audit Documentation Specifications (Rule C6, C8, Docs Invariants)
// =============================================================================
function auditDocs() {
  if (!fs.existsSync(DOCS_DIR)) return
  const docFiles = getAllFiles(DOCS_DIR).filter((f) => f.endsWith('.doc.tsx'))

  for (const file of docFiles) {
    const parsed = parseTsFile(file)
    const { content, sourceFile } = parsed

    // Check 4.1: Subcomponents list presence
    if (!content.includes('subcomponents:') && !content.includes('subcomponents :')) {
      addViolation({
        file: path.relative(ROOT_DIR, file),
        ruleId: 'DOCS.subcomps',
        rule: 'Docs Invariant (Subcomponents Indexing)',
        category: 'mechanical',
        fixStrategy: 'auto',
        message: `Doc spec is missing 'subcomponents' array.`,
        severity: 'warning',
      })
    }

    // Check 4.2: Examples suite presence
    if (!content.includes('examples:')) {
      addViolation({
        file: path.relative(ROOT_DIR, file),
        ruleId: 'DOCS.examples',
        rule: 'Docs Invariant (Examples Suite)',
        category: 'structural',
        fixStrategy: 'manual',
        message: `Doc spec is missing 'examples' array.`,
        severity: 'warning',
      })
    }

    // Check 4.3: Playground presence
    if (!content.includes('playground:')) {
      addViolation({
        file: path.relative(ROOT_DIR, file),
        ruleId: 'DOCS.playground',
        rule: 'Docs Invariant (Interactive Playground)',
        category: 'structural',
        fixStrategy: 'manual',
        message: `Doc spec is missing 'playground' configuration.`,
        severity: 'warning',
      })
    }

    // Check 4.4: Subcomponents parity with component static attachments
    const subcompMatch = content.match(/subcomponents\s*:\s*\[([^\]]+)\]/)
    if (subcompMatch) {
      const declaredSubcomps = subcompMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter(Boolean)

      const idMatch = content.match(/id\s*:\s*['"]([^'"]+)['"]/)
      if (idMatch) {
        const docId = idMatch[1]
        const compFiles = getAllFiles(path.join(SRC_DIR, 'modules'), ['.tsx']).filter(
          (f) => path.basename(f, '.tsx') === docId && f.includes('/components/')
        )

        if (compFiles.length > 0) {
          const compContent = fs.readFileSync(compFiles[0], 'utf-8')
          for (const sub of declaredSubcomps) {
            if (sub.includes('.')) {
              const [, child] = sub.split('.')
              if (
                !compContent.includes(`.${child} =`) &&
                !compContent.includes(`.${child}:`) &&
                !compContent.includes(`export const ${child}`) &&
                !compContent.includes(`export function ${child}`)
              ) {
                addViolation({
                  file: path.relative(ROOT_DIR, file),
                  line: 1,
                  ruleId: 'DOCS.parity',
                  rule: 'Docs Invariant (Compound Subcomponents Parity)',
                  category: 'structural',
                  fixStrategy: 'semi-auto',
                  message: `Subcomponent '${sub}' is declared in doc spec but is not statically attached on the component in '${path.relative(ROOT_DIR, compFiles[0])}'.`,
                  severity: 'error',
                })
              }
            }
          }
        }
      }
    }
  }
}

// =============================================================================
// 4. Audit Defensive Engineering, Null Guards & Logic Principles (Rule DEV)
// =============================================================================
function auditDefensiveLogicAndEngineeringPatterns() {
  const allSourceFiles = getAllFiles(SRC_DIR)

  for (const file of allSourceFiles) {
    if (file.endsWith('.d.ts') || file.endsWith('.json')) continue
    const parsed = parseTsFile(file)
    const { sourceFile, content } = parsed

    // -------------------------------------------------------------------------
    // 4.1 Dynamic Type Catalog: Extract all interfaces and type declarations
    // -------------------------------------------------------------------------
    interface PropertyMeta {
      name: string
      isOptional: boolean
      isCollection: boolean
      isCallback: boolean
      isObjectOrRef: boolean
    }

    const typeCatalog = new Map<string, Map<string, PropertyMeta>>()

    function analyzeTypeNode(typeNode: ts.TypeNode | undefined): {
      isCollection: boolean
      isCallback: boolean
      isObjectOrRef: boolean
      isNullable: boolean
    } {
      if (!typeNode) {
        return { isCollection: false, isCallback: false, isObjectOrRef: false, isNullable: false }
      }

      const text = typeNode.getText(sourceFile)
      const isArray =
        ts.isArrayTypeNode(typeNode) ||
        ts.isTupleTypeNode(typeNode) ||
        /\b(?:Array|ReadonlyArray|Set|Map|Record|Iterable|NodeList)\s*<|\[\]/.test(text)
      const isFn =
        ts.isFunctionTypeNode(typeNode) ||
        /\b(?:Function|\(.*?\)\s*=>)\b/.test(text) ||
        /^(?:on[A-Z]|handle[A-Z]|render[A-Z])/.test(text)
      const isRefOrObj =
        /\b(?:RefObject|MutableRefObject|MotionValue|BaseEngine|StorageAdapter|Element|HTMLElement)\b/.test(text)
      const isNullable =
        ts.isUnionTypeNode(typeNode) &&
        typeNode.types.some(
          (t) =>
            t.kind === ts.SyntaxKind.UndefinedKeyword ||
            t.kind === ts.SyntaxKind.NullKeyword ||
            t.kind === ts.SyntaxKind.VoidKeyword
        )

      return { isCollection: isArray, isCallback: isFn, isObjectOrRef: isRefOrObj, isNullable }
    }

    function recordTypeMembers(name: string, members: ts.NodeArray<ts.TypeElement>) {
      const propMap = new Map<string, PropertyMeta>()
      for (const member of members) {
        if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
          const propName = member.name.text
          const meta = analyzeTypeNode(member.type)
          const isOptional =
            Boolean(member.questionToken) ||
            meta.isNullable ||
            /^on[A-Z]/.test(propName) ||
            /^handle[A-Z]/.test(propName)

          propMap.set(propName, {
            name: propName,
            isOptional,
            isCollection: meta.isCollection,
            isCallback: meta.isCallback || /^on[A-Z]/.test(propName),
            isObjectOrRef: meta.isObjectOrRef,
          })
        }
      }
      typeCatalog.set(name, propMap)
    }

    // Traverse all interfaces and type aliases
    function collectTypes(node: ts.Node) {
      if (ts.isInterfaceDeclaration(node)) {
        recordTypeMembers(node.name.text, node.members)
      } else if (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)) {
        recordTypeMembers(node.name.text, node.type.members)
      }
      ts.forEachChild(node, collectTypes)
    }
    collectTypes(sourceFile)

    // Helper: Check if an AST node is wrapped in guard condition
    function isNodeGuarded(node: ts.Node, targetIdentifier: string): boolean {
      let curr: ts.Node | undefined = node.parent
      while (curr && curr !== sourceFile) {
        if (ts.isIfStatement(curr)) {
          const cond = curr.expression.getText(sourceFile)
          if (cond.includes(targetIdentifier)) return true
        }
        if (ts.isBinaryExpression(curr)) {
          if (
            curr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
            curr.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken ||
            curr.operatorToken.kind === ts.SyntaxKind.BarBarToken
          ) {
            const left = curr.left.getText(sourceFile)
            if (left.includes(targetIdentifier)) return true
          }
        }
        if (ts.isConditionalExpression(curr)) {
          const cond = curr.condition.getText(sourceFile)
          if (cond.includes(targetIdentifier)) return true
        }
        curr = curr.parent
      }
      return false
    }

    // -------------------------------------------------------------------------
    // 4.2 Scope-Aware Function & Component Parameter Analysis
    // -------------------------------------------------------------------------
    function auditFunctionScope(funcNode: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression) {
      const scopeOptionalCollections = new Set<string>()
      const scopeOptionalCallbacks = new Set<string>()
      const scopeOptionalObjects = new Set<string>()

      // 1. Inspect parameters for destructured objects without default initializers
      for (const param of funcNode.parameters) {
        let typePropsMap: Map<string, PropertyMeta> | undefined

        if (param.type) {
          const typeName = param.type.getText(sourceFile).replace(/<.*>$/, '').trim()
          typePropsMap = typeCatalog.get(typeName)
        }

        if (ts.isObjectBindingPattern(param.name)) {
          for (const elem of param.name.elements) {
            if (ts.isIdentifier(elem.name)) {
              const elemName = elem.name.text
              const hasDefault = Boolean(elem.initializer)

              if (!hasDefault) {
                // Check if known from type catalog
                const propMeta = typePropsMap?.get(elemName)
                if (propMeta) {
                  if (propMeta.isOptional && propMeta.isCollection) {
                    scopeOptionalCollections.add(elemName)
                  }
                  if (propMeta.isOptional && propMeta.isCallback) {
                    scopeOptionalCallbacks.add(elemName)
                  }
                  if (propMeta.isOptional && propMeta.isObjectOrRef) {
                    scopeOptionalObjects.add(elemName)
                  }
                } else {
                  // Heuristic based on name convention if type is external/imported
                  if (/^on[A-Z]/.test(elemName) || /^handle[A-Z]/.test(elemName)) {
                    scopeOptionalCallbacks.add(elemName)
                  }
                }
              }
            }
          }
        } else if (ts.isIdentifier(param.name)) {
          const paramName = param.name.text
          if (param.questionToken || /^on[A-Z]/.test(paramName)) {
            scopeOptionalCallbacks.add(paramName)
          }
        }
      }

      // 2. Walk the body of the function and check defensive patterns
      function auditScopeNodes(child: ts.Node) {
        // DEV1: Hook dependencies missing
        if (ts.isCallExpression(child)) {
          const fnText = child.expression.getText(sourceFile)
          const hookMatch = /^(?:React\.)?(useEffect|useLayoutEffect|useMemo|useCallback)$/.exec(fnText)
          if (hookMatch) {
            const hook = hookMatch[1]
            if (child.arguments.length === 1) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(child.getStart())
              addViolation({
                file: path.relative(ROOT_DIR, file),
                line: line + 1,
                ruleId: 'DEV.hook-deps',
                rule: 'Rule DEV3 (Hook Dependency Array Missing)',
                category: 'architectural',
                fixStrategy: 'manual',
                message: `Hook '${hook}' is invoked without a dependency array. This triggers on every single render. Provide explicit dependencies or '[]'.`,
                severity: 'warning',
              })
            }
          }
        }

        // DEV2: Unguarded callback invocations
        if (ts.isCallExpression(child)) {
          let cbName: string | null = null
          if (ts.isIdentifier(child.expression)) {
            cbName = child.expression.text
          } else if (ts.isPropertyAccessExpression(child.expression)) {
            cbName = child.expression.name.text
          }

          if (cbName && (scopeOptionalCallbacks.has(cbName) || /^on[A-Z]/.test(cbName))) {
            const isOptionalCall = Boolean((child as any).questionDotToken)
            if (!isOptionalCall && !isNodeGuarded(child, cbName)) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(child.getStart())
              addViolation({
                file: path.relative(ROOT_DIR, file),
                line: line + 1,
                ruleId: 'DEV.optional-callbacks',
                rule: 'Rule DEV2 (Guarded Callback & Handler Invocations)',
                category: 'mechanical',
                fixStrategy: 'auto',
                message: `Optional callback '${cbName}' is invoked directly without optional chaining ('${cbName}?.(...)') or guard condition.`,
                severity: 'warning',
              })
            }
          }
        }

        // DEV3: Unguarded collection property and method access (.length, .map, .filter, etc.)
        if (ts.isPropertyAccessExpression(child)) {
          const propName = child.name.text
          const target = child.expression.getText(sourceFile)

          if (
            (propName === 'length' ||
              ['map', 'filter', 'forEach', 'reduce', 'some', 'every', 'slice', 'find', 'findIndex'].includes(
                propName
              )) &&
            scopeOptionalCollections.has(target)
          ) {
            const isOptionalAccess = Boolean(child.questionDotToken)
            if (!isOptionalAccess && !isNodeGuarded(child, target)) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(child.getStart())
              addViolation({
                file: path.relative(ROOT_DIR, file),
                line: line + 1,
                ruleId: 'DEV.defensive-collection',
                rule: 'Rule DEV1 (Defensive Collection & Array Access)',
                category: 'structural',
                fixStrategy: 'semi-auto',
                message: `Unguarded access '${target}.${propName}' on optional collection '${target}'. Use '${target}?.${propName}' or provide a default fallback ('${target} = []').`,
                severity: 'warning',
              })
            }
          }
        }

        // DEV4: Unguarded method calls on optional objects / refs / motion values
        if (ts.isCallExpression(child) && ts.isPropertyAccessExpression(child.expression)) {
          const methodName = child.expression.name.text
          const objTarget = child.expression.expression.getText(sourceFile)

          if (
            ['set', 'play', 'pause', 'stop', 'focus', 'blur', 'seek', 'disconnect', 'subscribe'].includes(
              methodName
            ) &&
            (scopeOptionalObjects.has(objTarget) ||
              /^(?:raw|motion|anim|prev|next|target|current|ref)[A-Z]/.test(objTarget) ||
              /Ref(?:\.current)?$/.test(objTarget))
          ) {
            const isOptionalChaining =
              Boolean((child as any).questionDotToken) || Boolean(child.expression.questionDotToken)
            if (!isOptionalChaining && !isNodeGuarded(child, objTarget)) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(child.getStart())
              addViolation({
                file: path.relative(ROOT_DIR, file),
                line: line + 1,
                ruleId: 'DEV.null-guard',
                rule: 'Rule DEV4 (Defensive Ref / MotionValue Method Invocations)',
                category: 'mechanical',
                fixStrategy: 'auto',
                message: `Method invocation '${objTarget}.${methodName}(...)' on potentially nullable instance/ref should use optional chaining ('${objTarget}?.${methodName}(...)').`,
                severity: 'warning',
              })
            }
          }
        }

        // DEV5: Safe math / Division by zero protection
        if (ts.isBinaryExpression(child) && child.operatorToken.kind === ts.SyntaxKind.SlashToken) {
          const rightText = child.right.getText(sourceFile).trim()
          if (
            rightText.endsWith('.length') ||
            rightText === 'total' ||
            rightText === 'count' ||
            rightText === 'steps' ||
            rightText === 'items'
          ) {
            const isProtected =
              rightText.includes('||') ||
              rightText.includes('??') ||
              rightText.includes('Math.max') ||
              rightText.includes('max(') ||
              child.parent.getText(sourceFile).includes('? :')

            if (!isProtected) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(child.getStart())
              addViolation({
                file: path.relative(ROOT_DIR, file),
                line: line + 1,
                ruleId: 'DEV.safe-math',
                rule: 'Rule DEV5 (Safe Math & Division by Zero Protection)',
                category: 'structural',
                fixStrategy: 'semi-auto',
                message: `Division by '${rightText}' without zero protection ('|| 1' or 'Math.max(1, ${rightText})'). May produce NaN or Infinity if collection is empty.`,
                severity: 'warning',
              })
            }
          }
        }

        ts.forEachChild(child, auditScopeNodes)
      }

      if (funcNode.body) {
        auditScopeNodes(funcNode.body)
      }
    }

    // Traverse all functions and components in the file
    function walkFileFunctions(node: ts.Node) {
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node)
      ) {
        auditFunctionScope(node)
      }
      ts.forEachChild(node, walkFileFunctions)
    }

    walkFileFunctions(sourceFile)
  }
}

// =============================================================================
// Main Runner & Actionable Report Formatter
// =============================================================================
export function runAudit() {
  console.log('🔍 Running Consona Interface Architecture & Rules Audit...\n')

  auditEngineFiles()
  auditHooks()
  auditComponents()
  auditDocs()
  auditDefensiveLogicAndEngineeringPatterns()

  const errors = violations.filter((v) => v.severity === 'error')
  const warnings = violations.filter((v) => v.severity === 'warning')

  const autoFixable = violations.filter((v) => v.fixStrategy === 'auto')
  const semiAutoFixable = violations.filter((v) => v.fixStrategy === 'semi-auto')
  const manualFixable = violations.filter((v) => v.fixStrategy === 'manual')

  console.log(`📊 Audit Summary:`)
  console.log(`   Total Findings: ${violations.length}`)
  console.log(`   Errors:         ${errors.length}`)
  console.log(`   Warnings:       ${warnings.length}`)
  console.log(`   ───────────────────────────────`)
  console.log(`   🟢 Batch Auto-Fixable:      ${autoFixable.length}`)
  console.log(`   🟡 Semi-Automated / Assist: ${semiAutoFixable.length}`)
  console.log(`   🔴 Manual / Architectural:  ${manualFixable.length}\n`)

  // ---------------------------------------------------------------------------
  // Build Rule Grouping Aggregation
  // ---------------------------------------------------------------------------
  interface RuleGroupData {
    ruleId: string
    ruleName: string
    category: 'mechanical' | 'structural' | 'architectural'
    fixStrategy: 'auto' | 'semi-auto' | 'manual'
    errorsCount: number
    warningsCount: number
    total: number
    affectedFilesCount: number
    sampleFiles: string[]
  }

  const ruleGroups: Record<string, RuleGroupData> = {}
  for (const v of violations) {
    if (!ruleGroups[v.ruleId]) {
      ruleGroups[v.ruleId] = {
        ruleId: v.ruleId,
        ruleName: v.rule,
        category: v.category,
        fixStrategy: v.fixStrategy,
        errorsCount: 0,
        warningsCount: 0,
        total: 0,
        affectedFilesCount: 0,
        sampleFiles: [],
      }
    }
    const rg = ruleGroups[v.ruleId]
    if (v.severity === 'error') rg.errorsCount++
    else rg.warningsCount++
    rg.total++
    if (!rg.sampleFiles.includes(v.file)) {
      rg.sampleFiles.push(v.file)
      rg.affectedFilesCount++
    }
  }

  // ---------------------------------------------------------------------------
  // Build Structured Module-by-Module Hierarchy
  // ---------------------------------------------------------------------------
  interface ComponentAuditData {
    file: string
    status: 'CLEAN' | 'WARNINGS' | 'ERRORS'
    errorsCount: number
    warningsCount: number
    autoCount: number
    manualCount: number
    violations: Violation[]
  }

  interface ModuleAuditData {
    name: string
    status: 'CLEAN' | 'WARNINGS' | 'ERRORS'
    errorsCount: number
    warningsCount: number
    autoCount: number
    manualCount: number
    components: Record<string, ComponentAuditData>
  }

  const moduleHierarchy: Record<string, ModuleAuditData> = {}

  function getModuleName(filePath: string): string {
    if (filePath.startsWith('src/modules/')) {
      const parts = filePath.split('/')
      return parts[2] || 'general'
    }
    if (filePath.startsWith('app/src/docs/')) {
      const parts = filePath.split('/')
      return parts[3] || 'docs'
    }
    if (filePath.startsWith('src/core/')) return 'core-substrate'
    if (filePath.startsWith('src/hooks/')) return 'universal-hooks'
    if (filePath.startsWith('src/theme/')) return 'theme'
    return 'root'
  }

  function getComponentName(filePath: string): string {
    const base = path.basename(filePath, path.extname(filePath))
    if (base.endsWith('.doc')) return base.replace(/\.doc$/, '')
    return base
  }

  for (const v of violations) {
    const modName = getModuleName(v.file)
    const compName = getComponentName(v.file)

    if (!moduleHierarchy[modName]) {
      moduleHierarchy[modName] = {
        name: modName,
        status: 'CLEAN',
        errorsCount: 0,
        warningsCount: 0,
        autoCount: 0,
        manualCount: 0,
        components: {},
      }
    }

    const mod = moduleHierarchy[modName]
    if (v.severity === 'error') mod.errorsCount++
    else mod.warningsCount++
    if (v.fixStrategy === 'auto') mod.autoCount++
    else mod.manualCount++
    mod.status = mod.errorsCount > 0 ? 'ERRORS' : 'WARNINGS'

    if (!mod.components[compName]) {
      mod.components[compName] = {
        file: v.file,
        status: 'CLEAN',
        errorsCount: 0,
        warningsCount: 0,
        autoCount: 0,
        manualCount: 0,
        violations: [],
      }
    }

    const comp = mod.components[compName]
    if (v.severity === 'error') comp.errorsCount++
    else comp.warningsCount++
    if (v.fixStrategy === 'auto') comp.autoCount++
    else comp.manualCount++
    comp.status = comp.errorsCount > 0 ? 'ERRORS' : 'WARNINGS'
    comp.violations.push(v)
  }

  // ---------------------------------------------------------------------------
  // Generate audit-report.json
  // ---------------------------------------------------------------------------
  const reportPathJson = path.join(ROOT_DIR, 'audit-report.json')
  const jsonReport = {
    timestamp: new Date().toISOString(),
    summary: {
      total: violations.length,
      errors: errors.length,
      warnings: warnings.length,
      autoFixable: autoFixable.length,
      semiAutoFixable: semiAutoFixable.length,
      manualFixable: manualFixable.length,
      complianceScore: `${(((violations.length - errors.length) / Math.max(1, violations.length)) * 100).toFixed(1)}%`,
      status: errors.length === 0 ? 'PASSED' : 'FAILED',
    },
    strategyTiers: {
      tier1_batchAutoFix: Object.values(ruleGroups).filter((r) => r.fixStrategy === 'auto'),
      tier2_semiAutomated: Object.values(ruleGroups).filter((r) => r.fixStrategy === 'semi-auto'),
      tier3_manualArchitectural: Object.values(ruleGroups).filter((r) => r.fixStrategy === 'manual'),
    },
    ruleGroups,
    modules: moduleHierarchy,
    violations,
  }
  fs.writeFileSync(reportPathJson, JSON.stringify(jsonReport, null, 2), 'utf-8')

  // ---------------------------------------------------------------------------
  // Generate Actionable audit-report.md
  // ---------------------------------------------------------------------------
  const reportPathMd = path.join(ROOT_DIR, 'audit-report.md')

  let mdContent = `# 🛡️ Consona Interface Architecture & Rules Audit Report\n\n`
  mdContent += `> **Actionable Single Source of Truth for Architecture Invariants, Slot Surfaces, Compound Contracts, and Auto-Fix Playbook.**\n\n`
  mdContent += `**Generated:** ${new Date().toISOString()}  \n`
  mdContent += `**Overall Status:** ${errors.length === 0 ? '✅ **PASSED** (0 Errors)' : `❌ **FAILED** (${errors.length} Critical Errors)`}  \n`
  mdContent += `**Findings Summary:** Total: **${violations.length}** | ❌ Errors: **${errors.length}** | ⚠️ Warnings: **${warnings.length}**  \n`
  mdContent += `**Remediation Strategy:** 🟢 Batch Auto-Fixable: **${autoFixable.length}** | 🟡 Semi-Automated: **${semiAutoFixable.length}** | 🔴 Manual/Architectural: **${manualFixable.length}**\n\n`
  mdContent += `---\n\n`

  // Section 1: Strategy & Playbook Matrix (Grouped by Rule Category)
  mdContent += `## 🎯 Remediation Strategy & Batch Playbook\n\n`
  mdContent += `Execute remediation in **3 sequential phases** to maximize speed while safeguarding stability:\n\n`
  mdContent += `| Phase | Tier | Strategy | Total Findings | Description & Action |\n`
  mdContent += `| :---: | :---: | :---: | :---: | :--- |\n`
  mdContent += `| **Phase 1** | 🟢 Tier 1 | **Batch AST Auto-Fix** | **${autoFixable.length}** | Safe, 100% deterministic code transformations (config slots, type aliases, missing index.ts, defaultComponent lambdas). |\n`
  mdContent += `| **Phase 2** | 🟡 Tier 2 | **Assisted Semi-Auto** | **${semiAutoFixable.length}** | Rule-targeted AST migrations with type verification (JSDoc generation, slotProps forwarding, optical scale tokens). |\n`
  mdContent += `| **Phase 3** | 🔴 Tier 3 | **Component Family Review** | **${manualFixable.length}** | Manual architecture improvements per component family (embedded slots, collection loops, ad-hoc overlay replacements). |\n\n`

  mdContent += `### Rule Groups & Batch Remediation Matrix\n\n`
  mdContent += `| Rule ID | Rule Description | Tier | Strategy | Findings | Affected Files |\n`
  mdContent += `| :--- | :--- | :---: | :---: | :---: | :---: |\n`

  const sortedRuleGroups = Object.values(ruleGroups).sort((a, b) => {
    const stratOrder: Record<string, number> = { auto: 1, 'semi-auto': 2, manual: 3 }
    if (stratOrder[a.fixStrategy] !== stratOrder[b.fixStrategy]) {
      return stratOrder[a.fixStrategy] - stratOrder[b.fixStrategy]
    }
    return b.total - a.total
  })

  for (const rg of sortedRuleGroups) {
    const tierIcon = rg.fixStrategy === 'auto' ? '🟢 Tier 1' : rg.fixStrategy === 'semi-auto' ? '🟡 Tier 2' : '🔴 Tier 3'
    const stratName = rg.fixStrategy === 'auto' ? 'Batch Auto-Fix' : rg.fixStrategy === 'semi-auto' ? 'Assisted Script' : 'Manual Review'
    mdContent += `| \`${rg.ruleId}\` | **${rg.ruleName}** | ${tierIcon} | ${stratName} | **${rg.total}** | ${rg.affectedFilesCount} files |\n`
  }

  mdContent += `\n---\n\n`

  // Section 2: Module Health Scoreboard
  mdContent += `## 📊 Module Health Scoreboard\n\n`
  mdContent += `| Module | Status | Errors | Warnings | 🟢 Auto-Fixable | 🔴 Manual Review | Total |\n`
  mdContent += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`

  const sortedModules = Object.keys(moduleHierarchy).sort()
  for (const modKey of sortedModules) {
    const mod = moduleHierarchy[modKey]
    const badge = mod.errorsCount > 0 ? '❌ Action Needed' : '⚠️ Warnings Only'
    mdContent += `| [**\`${modKey}\`**](#module-${modKey.toLowerCase()}) | ${badge} | **${mod.errorsCount}** | ${mod.warningsCount} | ${mod.autoCount} | ${mod.manualCount} | **${mod.errorsCount + mod.warningsCount}** |\n`
  }
  mdContent += `\n---\n\n`

  // Section 3: Actionable Punch Lists by Module & Component
  mdContent += `## 🚀 Actionable Punch Lists by Module\n\n`

  for (const modKey of sortedModules) {
    const mod = moduleHierarchy[modKey]
    mdContent += `<a id="module-${modKey.toLowerCase()}"></a>\n`
    mdContent += `### 📦 Module: \`${modKey}\` (${mod.errorsCount} Errors, ${mod.warningsCount} Warnings)\n\n`

    const compKeys = Object.keys(mod.components).sort()
    for (const compKey of compKeys) {
      const comp = mod.components[compKey]
      const statusBadge = comp.errorsCount > 0 ? '❌ **Fix Required**' : '⚠️ **Refactor Recommended**'

      mdContent += `#### Component: \`${compKey}\` — [${comp.file}](file://${path.join(ROOT_DIR, comp.file)}) (${statusBadge})\n\n`
      mdContent += `| State | Line | Strategy | Rule | Violation & Remediation Action |\n`
      mdContent += `| :---: | :---: | :---: | :--- | :--- |\n`

      for (const v of comp.violations) {
        const checkIcon = v.severity === 'error' ? '❌' : '⚠️'
        const stratBadge = v.fixStrategy === 'auto' ? '🟢 Auto' : v.fixStrategy === 'semi-auto' ? '🟡 Assisted' : '🔴 Manual'
        const lineStr = v.line ? `[L${v.line}](file://${path.join(ROOT_DIR, v.file)}#L${v.line})` : '-'
        mdContent += `| - [ ] ${checkIcon} | ${lineStr} | ${stratBadge} | **${v.rule}** | ${v.message.replace(/\|/g, '\\|')} |\n`
      }
      mdContent += `\n`
    }
    mdContent += `---\n\n`
  }

  fs.writeFileSync(reportPathMd, mdContent, 'utf-8')
  console.log(`📝 Actionable dual-strategy report saved to:\n   - ${path.relative(ROOT_DIR, reportPathMd)}\n   - ${path.relative(ROOT_DIR, reportPathJson)}\n`)

  if (errors.length > 0) {
    process.exitCode = 1
  }

  return { errors: errors.length, warnings: warnings.length }
}

runAudit()
