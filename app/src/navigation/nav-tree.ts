import React from 'react'
import type { NavNode, NavTree } from '@consona/interface'
import {
  Compass,
  FileText,
  Cpu,
  Layers,
  Sparkles,
  Sliders,
  Box,
  Volume2,
  Calendar,
  Layers3,
  BarChart3,
  Globe,
  CircleDot,
  Terminal,
} from 'lucide-react'
import { getAllEngines, getAllProviders, getAllHooks, getAllPlugins } from '../registry/registry-client'
import { docsRegistry } from '../docs'

// Page & View Components attached directly to route nodes
import { OverviewPage } from '../components/overview-page'
import { ReadmePage } from '../components/readme-page'
import { NavigationPage } from '../components/navigation-page'
import { ArchitecturePage } from '../components/architecture-page'
import { ProvidersPage } from '../components/providers-page'
import { ProviderDocView } from '../components/provider-doc-view'
import { EnginesPage } from '../components/engines-page'
import { EngineDocView } from '../components/engine-doc-view'
import { HooksPage } from '../components/hooks-page'
import { HookDocView } from '../components/hook-doc-view'
import { PluginsPage } from '../components/plugins-page'
import { PluginDocView } from '../components/plugin-doc-view'
import { ComponentsPage } from '../components/components-page'
import { ComponentCategoryPage } from '../components/component-category-page'
import { ComponentDocView } from '../components/component-doc-view'
import { RegistrarPage } from '../components/registrar-page'

import { COMPONENT_CATEGORIES_CONFIG } from './categories'

export function buildNavTree(): NavTree {
  const allEngines = getAllEngines()
  const allProviders = getAllProviders()
  const allHooks = getAllHooks()
  const allPlugins = getAllPlugins()

  // 1. Architecture branch
  const engineNodes: NavNode[] = allEngines.map((e) => ({
    id: `engine-${e.name}`,
    title: e.name,
    shortTitle: e.name,
    href: `/architecture/engines/${e.name}`,
    icon: Sliders,
    badge: 'Engine',
    description: e.description,
    component: EngineDocView,
    data: { kind: 'engine', name: e.name },
  }))

  const providerNodes: NavNode[] = allProviders.map((p) => ({
    id: `provider-${p.name}`,
    title: p.name,
    shortTitle: p.name,
    href: `/architecture/providers/${p.name}`,
    icon: Layers,
    badge: p.type === 'global' ? 'Global' : 'Provider',
    description: p.description,
    component: ProviderDocView,
    data: { kind: 'provider', name: p.name },
  }))

  const hookNodes: NavNode[] = allHooks.map((h) => ({
    id: `hook-${h.name}`,
    title: h.name,
    shortTitle: h.name,
    href: `/architecture/hooks/${h.name}`,
    icon: Sparkles,
    badge: h.type === 'engine' ? 'Engine Hook' : 'Hook',
    description: h.description,
    component: HookDocView,
    data: { kind: 'hook', name: h.name },
  }))

  const pluginNodes: NavNode[] = allPlugins.map((pl) => ({
    id: `plugin-${pl.name}`,
    title: pl.name,
    shortTitle: pl.name,
    href: `/architecture/plugins/${pl.name}`,
    icon: Cpu,
    badge: 'Plugin',
    description: pl.description,
    component: PluginDocView,
    data: { kind: 'plugin', name: pl.name },
  }))

  // 2. Component Categories & Docs branch (derived from single source of truth)
  const componentCategoryNodes: NavNode[] = Object.entries(COMPONENT_CATEGORIES_CONFIG).map(([catKey, cat]) => {
    const childNodes: NavNode[] = cat.items
      .map((id) => {
        const doc = docsRegistry[id]
        if (!doc) return null
        return {
          id,
          title: doc.name,
          shortTitle: doc.name,
          href: `/components/${id}`,
          icon: cat.icon,
          badge: 'Component',
          description: doc.summary,
          component: ComponentDocView,
          data: { kind: 'component', spec: doc, componentId: id },
        }
      })
      .filter(Boolean) as NavNode[]

    return {
      id: `cat-${catKey}`,
      title: cat.title,
      shortTitle: cat.title,
      href: `/components/category/${catKey}`,
      icon: cat.icon,
      badge: `${childNodes.length}`,
      component: ComponentCategoryPage,
      data: { category: catKey },
      children: childNodes,
    }
  })

  // Master Root Tree
  const rootTree: NavTree = [
    {
      id: 'overview',
      title: 'Overview',
      href: '/',
      icon: Compass,
      component: OverviewPage,
      description: 'Executive system summary, token metrics, and runtime telemetry.',
    },
    {
      id: 'registrar',
      title: 'Registrar & CLI',
      href: '/registrar',
      icon: Terminal,
      component: RegistrarPage,
      description: 'Interface AST registrar, prop schemas, slot topologies, and interactive CLI shell.',
    },
    {
      id: 'docs-root',
      title: 'Documentation',
      href: '/documentation',
      icon: FileText,
      component: ReadmePage,
      children: [
        {
          id: 'readme',
          title: 'Architecture Spec',
          shortTitle: 'Spec (README)',
          href: '/documentation',
          icon: FileText,
          component: ReadmePage,
          description: 'Core platform specifications, slot architecture, and token system.',
        },
        {
          id: 'navigation-spec',
          title: 'Navigation Spec',
          shortTitle: 'Navigation',
          href: '/documentation/navigation',
          icon: Compass,
          component: NavigationPage,
          description: 'Tree routing engine, kinetic breadcrumb gliding menus, and state synchronization.',
        },
      ],
    },
    {
      id: 'architecture-root',
      title: 'Architecture',
      href: '/architecture',
      icon: Cpu,
      component: ArchitecturePage,
      children: [
        {
          id: 'architecture',
          title: 'System Hub',
          href: '/architecture',
          icon: Cpu,
          component: ArchitecturePage,
          description: 'Interactive architectural overview of all kernel subsystems.',
        },
        {
          id: 'providers-hub',
          title: 'Providers',
          shortTitle: 'Providers',
          href: '/architecture/providers',
          icon: Layers,
          badge: `${providerNodes.length}`,
          component: ProvidersPage,
          children: providerNodes,
        },
        {
          id: 'engines-hub',
          title: 'State Engines',
          shortTitle: 'Engines',
          href: '/architecture/engines',
          icon: Sliders,
          badge: `${engineNodes.length}`,
          component: EnginesPage,
          children: engineNodes,
        },
        {
          id: 'hooks-hub',
          title: 'Headless Hooks',
          shortTitle: 'Hooks',
          href: '/architecture/hooks',
          icon: Sparkles,
          badge: `${hookNodes.length}`,
          component: HooksPage,
          children: hookNodes,
        },
        {
          id: 'plugins-hub',
          title: 'Plugins',
          shortTitle: 'Plugins',
          href: '/architecture/plugins',
          icon: Cpu,
          badge: `${pluginNodes.length}`,
          component: PluginsPage,
          children: pluginNodes,
        },
      ],
    },
    {
      id: 'components-root',
      title: 'Components',
      href: '/components',
      icon: Box,
      component: ComponentsPage,
      children: componentCategoryNodes,
    },
  ]

  return rootTree
}
