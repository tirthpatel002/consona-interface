import ts from 'typescript'
import type { Plugin } from 'vite'

function dedent(text: string): string {
  const lines = text.split('\n')
  while (lines.length > 0 && lines[0].trim() === '') lines.shift()
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop()
  if (lines.length === 0) return ''

  let baseIndent = 0
  if (lines.length > 1) {
    const subsequentIndents = lines
      .slice(1)
      .filter((l) => l.trim().length > 0)
      .map((l) => l.match(/^[ \t]*/)?.[0].length ?? 0)
    if (subsequentIndents.length > 0) {
      const lastLineIndent = lines[lines.length - 1].match(/^[ \t]*/)?.[0].length ?? 0
      const minSubsequent = Math.min(...subsequentIndents)
      baseIndent = lastLineIndent > 0 ? lastLineIndent : minSubsequent
    }
  }

  return lines
    .map((line, idx) => {
      if (idx === 0) return line.trim()
      const currentIndent = line.match(/^[ \t]*/)?.[0].length ?? 0
      if (currentIndent >= baseIndent) {
        return line.slice(baseIndent)
      }
      return line.trim()
    })
    .join('\n')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** True when `text` references top-level `name` as JSX, call, or value. */
function referencesName(text: string, name: string): boolean {
  const n = escapeRegExp(name)
  if (new RegExp(`<${n}\\b`).test(text)) return true
  if (new RegExp(`\\b${n}\\s*\\(`).test(text)) return true
  // Value / type usage: `icon: Foo`, `: Foo`, `Foo.SVGProps`, JSX `{Foo}`
  if (new RegExp(`(?:^|[^\\w.$])${n}(?![\\w$])`).test(text)) return true
  return false
}

interface TopLevelDecl {
  name: string
  code: string
  order: number
}

interface NamedImportBinding {
  local: string
  imported: string
  isTypeOnly: boolean
}

interface ImportClauseInfo {
  order: number
  module: string
  /** Entire clause is `import type { … }` */
  isTypeOnly: boolean
  defaultName?: string
  namespace?: string
  named: NamedImportBinding[]
  /** All local binding names introduced by this import. */
  locals: string[]
}

/**
 * Collect every top-level value binding in the doc module:
 * functions, arrow/function consts, and factories like `const X = Widget.extend(...)`.
 */
function collectTopLevelDeclarations(sourceFile: ts.SourceFile): Map<string, TopLevelDecl> {
  const decls = new Map<string, TopLevelDecl>()
  let order = 0

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text
      decls.set(name, {
        name,
        code: dedent(node.getText(sourceFile)),
        order: order++,
      })
      return
    }

    if (!ts.isVariableStatement(node)) return

    for (const decl of node.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue
      const name = decl.name.text
      // Skip the exported doc object itself (large, not an example helper).
      if (/Doc$/.test(name) || name.endsWith('DocSpec')) continue
      decls.set(name, {
        name,
        code: dedent(node.getText(sourceFile)),
        order: order++,
      })
    }
  })

  return decls
}

function collectImportClauses(sourceFile: ts.SourceFile): ImportClauseInfo[] {
  const imports: ImportClauseInfo[] = []
  let order = 0

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isImportDeclaration(node) || !node.importClause) return
    if (!ts.isStringLiteral(node.moduleSpecifier)) return

    const module = node.moduleSpecifier.text
    const clause = node.importClause
    const info: ImportClauseInfo = {
      order: order++,
      module,
      isTypeOnly: Boolean(clause.isTypeOnly),
      named: [],
      locals: [],
    }

    if (clause.name) {
      info.defaultName = clause.name.text
      info.locals.push(clause.name.text)
    }

    const bindings = clause.namedBindings
    if (bindings) {
      if (ts.isNamespaceImport(bindings)) {
        info.namespace = bindings.name.text
        info.locals.push(bindings.name.text)
      } else if (ts.isNamedImports(bindings)) {
        for (const el of bindings.elements) {
          const local = el.name.text
          const imported = el.propertyName?.text ?? local
          info.named.push({
            local,
            imported,
            isTypeOnly: Boolean(el.isTypeOnly),
          })
          info.locals.push(local)
        }
      }
    }

    imports.push(info)
  })

  return imports
}

/**
 * Walk the render seed and every pulled declaration until the dependency
 * closure is complete. Emit helpers in source order.
 */
function collectTransitiveHelpers(
  seedText: string,
  decls: Map<string, TopLevelDecl>
): TopLevelDecl[] {
  const needed = new Set<string>()
  const queue: string[] = [seedText]

  while (queue.length > 0) {
    const text = queue.shift()!
    for (const [name, decl] of decls) {
      if (needed.has(name)) continue
      if (!referencesName(text, name)) continue
      needed.add(name)
      queue.push(decl.code)
    }
  }

  return [...decls.values()]
    .filter((decl) => needed.has(decl.name))
    .sort((a, b) => a.order - b.order)
}

/** Which imported locals appear in the extracted body. */
function collectUsedImportNames(body: string, imports: ImportClauseInfo[]): Set<string> {
  const used = new Set<string>()
  for (const info of imports) {
    for (const local of info.locals) {
      if (referencesName(body, local)) used.add(local)
    }
  }
  return used
}

/** Rebuild only the import lines required by `used`, preserving module order. */
function rebuildImports(imports: ImportClauseInfo[], used: Set<string>): string[] {
  const lines: string[] = []

  for (const info of imports) {
    const useDefault = Boolean(info.defaultName && used.has(info.defaultName))
    const useNamespace = Boolean(info.namespace && used.has(info.namespace))
    const usedNamed = info.named.filter((n) => used.has(n.local))

    if (!useDefault && !useNamespace && usedNamed.length === 0) continue

    const quote = `'${info.module.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
    const typePrefix = info.isTypeOnly ? 'type ' : ''

    if (useNamespace) {
      lines.push(`import ${typePrefix}* as ${info.namespace} from ${quote}`)
      continue
    }

    const parts: string[] = []
    if (useDefault) parts.push(info.defaultName!)

    if (usedNamed.length > 0) {
      const namedInline = usedNamed
        .map((n) => {
          const typeMod = !info.isTypeOnly && n.isTypeOnly ? 'type ' : ''
          const alias = n.imported !== n.local ? `${n.imported} as ${n.local}` : n.local
          return `${typeMod}${alias}`
        })
        .join(', ')

      const useMultiline = usedNamed.length > 3 || usedNamed.some((n) => n.isTypeOnly)
      if (useMultiline) {
        const multiline = usedNamed
          .map((n) => {
            const typeMod = !info.isTypeOnly && n.isTypeOnly ? 'type ' : ''
            const alias = n.imported !== n.local ? `${n.imported} as ${n.local}` : n.local
            return `  ${typeMod}${alias},`
          })
          .join('\n')
        parts.push(`{\n${multiline}\n}`)
      } else {
        parts.push(`{ ${namedInline} }`)
      }
    }

    if (parts.length === 1 && useDefault && usedNamed.length === 0) {
      lines.push(`import ${typePrefix}${parts[0]} from ${quote}`)
    } else if (useDefault && usedNamed.length > 0) {
      lines.push(`import ${typePrefix}${info.defaultName}, ${parts[1]} from ${quote}`)
    } else {
      lines.push(`import ${typePrefix}${parts.join(', ')} from ${quote}`)
    }
  }

  return lines
}

function buildExtractedCode(
  renderSnippet: string,
  helpers: TopLevelDecl[],
  imports: ImportClauseInfo[]
): string {
  const helperBlock = helpers.map((h) => h.code).join('\n\n')
  const body =
    helpers.length > 0
      ? `${helperBlock}\n\n// Render:\n${renderSnippet}`
      : renderSnippet

  const used = collectUsedImportNames(body, imports)
  const importLines = rebuildImports(imports, used)

  if (importLines.length === 0) return body
  return `${importLines.join('\n')}\n\n${body}`
}

export function transformDocSource(sourceText: string, fileName: string): string {
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const topLevelDeclarations = collectTopLevelDeclarations(sourceFile)
  const importClauses = collectImportClauses(sourceFile)

  interface Replacement {
    start: number
    end: number
    replacement: string
  }
  const replacements: Replacement[] = []

  function processRenderableObject(elem: ts.ObjectLiteralExpression) {
    let renderProp: ts.PropertyAssignment | undefined
    let codeProp: ts.PropertyAssignment | undefined

    for (const prop of elem.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        if (prop.name.text === 'render') {
          renderProp = prop
        } else if (prop.name.text === 'code') {
          codeProp = prop
        }
      }
    }

    if (!renderProp) return

    let rawRenderText = ''
    const init = renderProp.initializer

    if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
      const body = init.body
      if (ts.isParenthesizedExpression(body)) {
        rawRenderText = body.expression.getText(sourceFile)
      } else if (ts.isBlock(body)) {
        const blockText = body.getText(sourceFile)
        rawRenderText = blockText.slice(1, -1).trim()
      } else {
        rawRenderText = body.getText(sourceFile)
      }
    } else {
      rawRenderText = init.getText(sourceFile)
    }

    const renderSnippet = dedent(rawRenderText)
    const helpers = collectTransitiveHelpers(renderSnippet, topLevelDeclarations)
    const extractedCode = buildExtractedCode(renderSnippet, helpers, importClauses)
    const codeStringLiteral = JSON.stringify(extractedCode)

    if (codeProp) {
      replacements.push({
        start: codeProp.getStart(sourceFile),
        end: codeProp.getEnd(),
        replacement: `code: ${codeStringLiteral}`,
      })
    } else {
      replacements.push({
        start: renderProp.getEnd(),
        end: renderProp.getEnd(),
        replacement: `,\n      code: ${codeStringLiteral}`,
      })
    }
  }

  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)) {
      if (node.name.text === 'examples' && ts.isArrayLiteralExpression(node.initializer)) {
        for (const elem of node.initializer.elements) {
          if (ts.isObjectLiteralExpression(elem)) {
            processRenderableObject(elem)
          }
        }
      }

      if (node.name.text === 'playground' && ts.isObjectLiteralExpression(node.initializer)) {
        processRenderableObject(node.initializer)
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  if (replacements.length === 0) return sourceText

  replacements.sort((a, b) => b.start - a.start)

  let transformed = sourceText
  for (const rep of replacements) {
    transformed = transformed.slice(0, rep.start) + rep.replacement + transformed.slice(rep.end)
  }

  return transformed
}

export function docCodeExtractorPlugin(): Plugin {
  return {
    name: 'vite-plugin-doc-code-extractor',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('.doc.tsx') || id.includes('.doc.ts')) {
        return {
          code: transformDocSource(code, id),
          map: null,
        }
      }
      return null
    },
  }
}
