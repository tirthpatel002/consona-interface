import type { LucideIcon } from 'lucide-react'
import {
  Box,
  Compass,
  FileText,
  Calendar,
  CircleDot,
  Layers3,
  Layers,
  Sparkles,
  Sliders,
  Volume2,
  BarChart3,
  Globe,
  Wand2,
  GripVertical,
  GanttChart,
} from 'lucide-react'

export interface ComponentCategoryDefinition {
  title: string
  icon: LucideIcon | any
  color: string
  description: string
  items: string[]
}

/**
 * Single source of truth for component categories, their display metadata, and constituent component IDs.
 */
export const COMPONENT_CATEGORIES_CONFIG: Record<string, ComponentCategoryDefinition> = {
  foundation: {
    title: 'Foundation & Atoms',
    icon: Box,
    color: 'text-primary',
    description: 'Fundamental interactive atoms, tokens, typography, badges, and layout separators.',
    items: ['button', 'badge', 'avatar', 'link', 'kbd', 'separator', 'loader', 'text', 'gradient'],
  },
  navigation: {
    title: 'Navigation & Shell',
    icon: Compass,
    color: 'text-primary',
    description: 'Breadcrumbs, navbars, paginations, and interactive multi-level hierarchy shells.',
    items: ['nav', 'breadcrumbs', 'pagination', 'chapter-scrubber', 'sidebar'],
  },
  form: {
    title: 'Form & Input Fleet',
    icon: FileText,
    color: 'text-primary',
    description: 'Accessible inputs, native selects, multi-combos, dropzones, sliders, switches, and pickers.',
    items: [
      'field',
      'input',
      'number-field',
      'search-field',
      'textarea',
      'checkbox',
      'choice-box',
      'switch',
      'radio',
      'slider',
      'select',
      'native-select',
      'combo-box',
      'multiple-select',
      'color',
      'drop-zone',
      'file-trigger',
      'rating',
    ],
  },
  temporal: {
    title: 'Temporal & Calendar',
    icon: Calendar,
    color: 'text-primary',
    description: 'Precision date-time pickers, multi-month calendars, time wheels, and countdown timers.',
    items: ['calendar', 'date-picker', 'time-field', 'clock', 'timer', 'time-wheel', 'date-time-picker'],
  },
  overlay: {
    title: 'Floating & Overlay',
    icon: CircleDot,
    color: 'text-primary',
    description: 'Modals, popovers, tooltips, drawers, context menus, and keyboard command palettes.',
    items: ['popover', 'modal', 'tooltip', 'menu', 'drawer', 'command-menu', 'context-menu'],
  },
  structural: {
    title: 'Structural & Composites',
    icon: Layers3,
    color: 'text-primary',
    description: 'Cards, tabs, accordions, scroll areas, theme editors, and responsive aspect frames.',
    items: ['card', 'theme-editor', 'tabs', 'scroll-area', 'accordion', 'aspect-ratio', 'layout'],
  },
  data: {
    title: 'Data & Enterprise Grids',
    icon: Layers,
    color: 'text-primary',
    description: 'Virtual tables, tree grids, data selection bars, and high-density description lists.',
    items: [
      'counter',
      'table',
      'data-table',
      'grid-list',
      'tree',
      'description-list',
      'data-selection-bar',
      'show-more',
      'paginated-section',
      'infinite-scroll-section',
    ],
  },
  feedback: {
    title: 'Feedback & Status',
    icon: Sparkles,
    color: 'text-primary',
    description: 'Alert notes, progress indicators, meters, skeletons, toast alerts, and empty states.',
    items: ['note', 'progress', 'meter', 'skeleton', 'toast', 'empty-state', 'snippet'],
  },
  panes: {
    title: 'Interactive Panes & Tools',
    icon: Sliders,
    color: 'text-primary',
    description: 'Split panes, compare sliders, diff viewers, toolbars, carousels, and bento grids.',
    items: ['split-pane', 'compare-pane', 'diff-viewer', 'toolbar', 'carousel', 'bento-grid', 'stepper', 'steps', 'json-viewer'],
  },
  media: {
    title: 'Rich Media & Players',
    icon: Volume2,
    color: 'text-primary',
    description: 'Audio players, waveform visualizers, voice buttons, transcript inspectors, and video players.',
    items: ['audio-player', 'audio-recorder', 'bar-visualizer', 'voice-button', 'transcript-viewer', 'video-player', 'media-image', 'orb-audio-player'],
  },
  generative: {
    title: 'Generative Surfaces',
    icon: Wand2,
    color: 'text-primary',
    description: 'Procedural, shader-driven, and ambient surface primitives — orbs, liquid glass, noise fields, and real-time generative visual substrates.',
    items: ['orb', 'glass', 'sensitive-orb'],
  },
  charts: {
    title: 'Enterprise Charts',
    icon: BarChart3,
    color: 'text-primary',
    description: 'Hardware-accelerated line, bar, area, candlestick, sunburst, radar, and sankey visualizations.',
    items: [
      'chart-container',
      'area-chart',
      'bar-chart',
      'candlestick-chart',
      'funnel-chart',
      'heatmap-chart',
      'line-chart',
      'pie-chart',
      'radar-chart',
      'radial-bar-chart',
      'sunburst-chart',
      'sankey-chart',
      'treemap-chart',
      'scatter-chart',
      'stream-chart',
      'bump-chart',
      'chord-chart',
    ],
  },
  maps: {
    title: 'Geospatial & Maps',
    icon: Globe,
    color: 'text-primary',
    description: 'Interactive tile maps, globe projections, cluster layers, routing arcs, and spatial controls.',
    items: ['map'],
  },
  spotlight: {
    title: 'Overlay & Spotlight',
    icon: CircleDot,
    color: 'text-primary',
    description: 'Focus backdrops, callouts, and feature beacons for highlighting UI targets.',
    items: ['overlay'],
  },
  onboarding: {
    title: 'Guided Onboarding',
    icon: Compass,
    color: 'text-primary',
    description: 'Interactive product tours, checklists, beacons, and step-by-step walkthrough flows.',
    items: ['onboarding'],
  },
  dnd: {
    title: 'Drag & Drop Fleet',
    icon: GripVertical,
    color: 'text-primary',
    description: 'Kanban boards, sortable lists, 2D grids, spatial positioning, drag overlays, and type acceptance rules.',
    items: ['dnd-board', 'sortable-list', 'sortable-grid', 'positionable', 'draggable', 'droppable', 'drag-overlay', 'cross-container-dnd'],
  },
  gantt: {
    title: 'Gantt & Timeline',
    icon: GanttChart,
    color: 'text-primary',
    description: 'Accessors-based project timelines with sticky rails, snap move/resize, view-range modes, now line, and optional dependency edges.',
    items: ['gantt'],
  },
  sound: {
    title: 'Sound & Audio Feedback',
    icon: Volume2,
    color: 'text-primary',
    description: 'Web Audio procedural sound synthesis engine, 9 canonical semantic cues, acoustic variants, typing cadence, and declarative HTML attributes.',
    items: ['sound'],
  },
}

/**
 * Lookup a category configuration by key.
 */
export function getCategoryConfig(key: string): ComponentCategoryDefinition | undefined {
  return COMPONENT_CATEGORIES_CONFIG[key]
}

/**
 * Find which category key a component belongs to.
 */
export function findCategoryForComponent(componentId: string): string | undefined {
  for (const [catKey, cat] of Object.entries(COMPONENT_CATEGORIES_CONFIG)) {
    if (cat.items.includes(componentId)) {
      return catKey
    }
  }
  return undefined
}
