#!/usr/bin/env node
/**
 * Consona Interface Registrar CLI
 * Allows developers and AI subagents to query the registry directly via CLI in both JSON and Markdown formats.
 */

import { registrar } from '../src/registry/registrar.ts'

const args = process.argv.slice(2)

function printHelp() {
  console.log(`
Consona Interface Registrar CLI
===============================
Query and inspect the complete interface registry with zero hallucination and token-efficient output.

Usage:
  npm run registrar -- --search <Query> [-n <N>] [--list] [--doc] [--json|--md]
  npm run registrar -- --tag <TagName> [-n <N>] [--list] [--doc] [--json|--md]
  npm run registrar -- --tags [--format json|markdown]
  npm run registrar -- --catalog [-n <N>] [--list] [--json|--md] [--out <file>]
  npm run registrar -- --inspect <EntityName> [--json|--md] [--out <file>]
  npm run registrar -- --code <EntityName> [--json|--md] [--out <file>]
  npm run registrar -- --filePath <EntityName> [--json|--md] [--out <file>]
  npm run registrar -- --component <ComponentName> [--json|--md] [--out <file>]
  npm run registrar -- --engine <EngineName> [--json|--md] [--out <file>]
  npm run registrar -- --hook <HookName> [--json|--md] [--out <file>]
  npm run registrar -- --provider <ProviderName> [--json|--md] [--out <file>]
  npm run registrar -- --plugin <PluginName> [--json|--md] [--out <file>]
  npm run registrar -- --type <TypeName> [--json|--md] [--out <file>]
  npm run registrar -- --props <ComponentName> [--json|--md] [--out <file>]
  npm run registrar -- --slots <ComponentName> [--json|--md] [--out <file>]
  npm run registrar -- --composites <ComponentName> [--json|--md] [--out <file>]
  npm run registrar -- --module <ModuleName> [--json|--md] [--out <file>]
  npm run registrar -- --context <Name1> <Name2> ... [--json|--md] [--out <file>]
  npm run registrar -- --ask "<Question>" [--json|--md] [--out <file>]

Filtering & Modifier Flags:
  -n <N>, --limit <N>         Limit output to top N results (e.g. -n 5)
  --list, -l                  Output only a clean flat list of entity names (string[])
  --doc, --docs, -d           Include complete TypeScript JSDocs & AST specifications
  --json, --format json       Output results as formatted JSON
  --md, --markdown            Output results as GitHub-flavored Markdown (default)
  --out <file>                Save output directly to specified file path
`)
}

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  printHelp()
  process.exit(0)
}

// Parse Format
let format: 'markdown' | 'json' = 'markdown'
if (args.includes('--json') || args.includes('-j')) {
  format = 'json'
} else {
  const formatIdx = args.indexOf('--format')
  if (formatIdx !== -1 && args[formatIdx + 1]?.toLowerCase() === 'json') {
    format = 'json'
  }
}

// Parse Modifiers
const limitIdx = args.indexOf('--limit') !== -1 ? args.indexOf('--limit') : args.indexOf('-n')
const limit = limitIdx !== -1 && args[limitIdx + 1] && !args[limitIdx + 1].startsWith('-')
  ? parseInt(args[limitIdx + 1], 10)
  : undefined

const isList = args.includes('--list') || args.includes('-l')
const isDoc = args.includes('--doc') || args.includes('--docs') || args.includes('-d')

// Parse Output File
const outIdx = args.indexOf('--out')
const writeToFile = outIdx !== -1 ? args[outIdx + 1] : undefined

function extractPositionalArgs(startIdx: number, argsList: string[]): string[] {
  const terms: string[] = []
  for (let i = startIdx; i < argsList.length; i++) {
    const item = argsList[i]!
    if (item.startsWith('-')) {
      if (item === '-n' || item === '--limit' || item === '--format' || item === '--out') {
        i++
      }
      continue
    }
    const prev = argsList[i - 1]
    if (prev === '-n' || prev === '--limit' || prev === '--format' || prev === '--out') {
      continue
    }
    terms.push(item)
  }
  return terms
}

function renderOutput(result: any, defaultFile: string) {
  if (result === undefined) {
    console.error('No matching entity found in Interface Registry.')
    process.exit(1)
  }

  if (writeToFile) {
    console.log(`✅ Result saved to: ${writeToFile}`)
    return
  }

  if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'string' && format !== 'json') {
    console.log(result.join('\n'))
  } else if (typeof result === 'object') {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(result)
  }
}

// 1. Catalog
if (args.includes('--catalog')) {
  const targetFile = writeToFile || (args.includes('--save') ? (format === 'json' ? 'interface-catalog.json' : 'interface-catalog.md') : undefined)
  const result = registrar.getCatalog({ format, writeToFile: targetFile })
  renderOutput(result, format === 'json' ? 'interface-catalog.json' : 'interface-catalog.md')
  process.exit(0)
}

// 2. Source Code
const codeIdx = args.indexOf('--code')
if (codeIdx !== -1) {
  const name = args[codeIdx + 1]
  if (!name) {
    console.error('Please specify an entity name to fetch source code.')
    process.exit(1)
  }
  const result = registrar.getCode(name, { format, writeToFile })
  renderOutput(result, `${name}-code.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 3. File Path
const filePathIdx = args.indexOf('--filePath') !== -1 
  ? args.indexOf('--filePath') 
  : (args.indexOf('--file-path') !== -1 ? args.indexOf('--file-path') : args.indexOf('--file'))
if (filePathIdx !== -1) {
  const name = args[filePathIdx + 1]
  if (!name) {
    console.error('Please specify an entity name to inspect file path.')
    process.exit(1)
  }
  const result = registrar.getFilePath(name, { format, writeToFile })
  renderOutput(result, `${name}-filepath.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 4. Universal Inspect (Resolves Component, Engine, Hook, Provider, Plugin, Type, Module)
const inspectIdx = args.indexOf('--inspect')
if (inspectIdx !== -1) {
  const name = args[inspectIdx + 1]
  if (!name) {
    console.error('Please specify an entity name to inspect.')
    process.exit(1)
  }
  const result = registrar.inspect(name, { format, writeToFile })
  renderOutput(result, `${name}-spec.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 5. Inspect Component
const compIdx = args.indexOf('--component')
if (compIdx !== -1) {
  const name = args[compIdx + 1]
  if (!name) {
    console.error('Please specify a component name to inspect.')
    process.exit(1)
  }
  const result = registrar.inspectComponent(name, { format, writeToFile })
  renderOutput(result, `${name}-spec.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 6. Inspect Engine
const engineIdx = args.indexOf('--engine')
if (engineIdx !== -1) {
  const name = args[engineIdx + 1]
  if (!name) {
    console.error('Please specify an engine name to inspect.')
    process.exit(1)
  }
  const result = registrar.inspectEngine(name, { format, writeToFile })
  renderOutput(result, `${name}-engine.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 7. Inspect Hook
const hookIdx = args.indexOf('--hook')
if (hookIdx !== -1) {
  const name = args[hookIdx + 1]
  if (!name) {
    console.error('Please specify a hook name to inspect.')
    process.exit(1)
  }
  const result = registrar.inspectHook(name, { format, writeToFile })
  renderOutput(result, `${name}-hook.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 8. Inspect Provider
const providerIdx = args.indexOf('--provider')
if (providerIdx !== -1) {
  const name = args[providerIdx + 1]
  if (!name) {
    console.error('Please specify a provider name to inspect.')
    process.exit(1)
  }
  const result = registrar.inspectProvider(name, { format, writeToFile })
  renderOutput(result, `${name}-provider.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 9. Inspect Plugin
const pluginIdx = args.indexOf('--plugin')
if (pluginIdx !== -1) {
  const name = args[pluginIdx + 1]
  if (!name) {
    console.error('Please specify a plugin name to inspect.')
    process.exit(1)
  }
  const result = registrar.inspectPlugin(name, { format, writeToFile })
  renderOutput(result, `${name}-plugin.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 10. Inspect Type
const typeIdx = args.indexOf('--type')
if (typeIdx !== -1) {
  const name = args[typeIdx + 1]
  if (!name) {
    console.error('Please specify a type name to inspect.')
    process.exit(1)
  }
  const result = registrar.inspectType(name, { format, writeToFile })
  renderOutput(result, `${name}-type.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 11. Inspect Props
const propsIdx = args.indexOf('--props')
if (propsIdx !== -1) {
  const name = args[propsIdx + 1]
  if (!name) {
    console.error('Please specify a component name to inspect props.')
    process.exit(1)
  }
  const result = registrar.inspectProps(name, { format, writeToFile })
  renderOutput(result, `${name}-props.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 12. Inspect Slots
const slotsIdx = args.indexOf('--slots')
if (slotsIdx !== -1) {
  const name = args[slotsIdx + 1]
  if (!name) {
    console.error('Please specify a component name to inspect slots.')
    process.exit(1)
  }
  const result = registrar.inspectSlots(name, { format, writeToFile })
  renderOutput(result, `${name}-slots.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 13. Inspect Composites / Subcomponents
const compoIdx = args.indexOf('--composites') !== -1 ? args.indexOf('--composites') : args.indexOf('--subcomponents')
if (compoIdx !== -1) {
  const name = args[compoIdx + 1]
  if (!name) {
    console.error('Please specify a component name to inspect composites/subcomponents.')
    process.exit(1)
  }
  const result = registrar.inspectComposites(name, { format, writeToFile })
  renderOutput(result, `${name}-composites.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 14. Inspect Module
const moduleIdx = args.indexOf('--module')
if (moduleIdx !== -1) {
  const name = args[moduleIdx + 1]
  if (!name) {
    console.error('Please specify a module name to inspect.')
    process.exit(1)
  }
  const result = registrar.inspectModule(name, { format, writeToFile })
  renderOutput(result, `${name}-module.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 15. Query by Tag or List Tags
const tagIdx = args.indexOf('--tag')
if (tagIdx !== -1) {
  const tagName = args[tagIdx + 1]
  if (!tagName || tagName.startsWith('-')) {
    const result = registrar.listTags()
    renderOutput(result, `tags-list.${format === 'json' ? 'json' : 'md'}`)
    process.exit(0)
  }
  const result = registrar.getByTag(tagName, { format, writeToFile, limit, list: isList, doc: isDoc })
  renderOutput(result, `tag-${tagName}.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

if (args.includes('--tags')) {
  const result = registrar.listTags()
  renderOutput(result, `tags-list.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 16. Agent Context Generator
const contextIdx = args.indexOf('--context')
if (contextIdx !== -1) {
  const targets = extractPositionalArgs(contextIdx + 1, args)
  if (targets.length === 0) {
    console.error('Please specify target symbol names for context generation.')
    process.exit(1)
  }
  const result = registrar.generateAgentContext(targets, { format, writeToFile })
  renderOutput(result, `interface-agent-context.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 17. Search
const searchIdx = args.indexOf('--search')
if (searchIdx !== -1) {
  const q = extractPositionalArgs(searchIdx + 1, args).join(' ')
  const results = registrar.search(q, { format, writeToFile, limit, list: isList, doc: isDoc })
  renderOutput(results, `search-results.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// 18. Natural Language Ask
const askIdx = args.indexOf('--ask')
if (askIdx !== -1) {
  const q = extractPositionalArgs(askIdx + 1, args).join(' ')
  const answer = registrar.ask(q, { format, writeToFile })
  renderOutput(answer, `query-answer.${format === 'json' ? 'json' : 'md'}`)
  process.exit(0)
}

// Fallback: universal inspect or smart search
const nonFlagArgs = extractPositionalArgs(0, args)

if (nonFlagArgs.length > 0) {
  const primary = nonFlagArgs[0]!
  const entity = !isList ? registrar.inspect(primary, { format }) : undefined
  if (entity) {
    renderOutput(entity, `${primary}-spec.${format === 'json' ? 'json' : 'md'}`)
  } else {
    const searchQuery = nonFlagArgs.join(' ')
    const results = registrar.search(searchQuery, { format, writeToFile, limit, list: isList, doc: isDoc })
    renderOutput(results, `search-results.${format === 'json' ? 'json' : 'md'}`)
  }
} else {
  printHelp()
}
