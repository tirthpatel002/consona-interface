# Consona Interface 

> **Vision:** Transform Consona Interface from a static component collection into a **modular, pluggable, self-documenting design engine**.
>
> Enable downstream applications and third-party libraries to customize, compose, swap internal atoms, and intercept engine behaviors with absolute granularity — without forking or maintaining redundant codebases.

---

## Honest positioning

This library is a **substrate**: React Aria primitives, an optical token ramp, a factory (`.extend()`), named slots + nested `slotProps`, and a generated registry. It is not a replacement for MUI’s ecosystem, React Spectrum’s maturity, or shadcn’s “own the JSX” distribution.

### What is actually better here

- **Controlled extensibility.** A downstream design system can replace `DateTime.trigger` or restyle Button’s loader without forking a thousand-line file. shadcn does not offer a stable injection address; you edit the copy. MUI’s `slots` / `slotProps` is the closest peer — we add compound `Root.Member` attachments and one `.extend()` path for every public atom.
- **Primitive → composite in one optical system.** Button and Field sit on the same tokens as Calendar, TimeWheel, and DateTimePicker. Spectrum covers that range with Adobe’s look; Aria/Radix stop at unstyled primitives.
- **A machine-readable occupant graph.** `npm run build:registry` writes `resolvesTo`, prop **deltas**, `validValues`, and `registry.graph` (`DateTimeContent.calendar → Calendar`, variant `RangeCalendar`). The demo walks that graph. Almost no open-source UI kit treats this as a product surface.

### What is not better

- Ecosystem, examples, and battle-testing: MUI, Aria, shadcn win.
- Raw accessibility pedigree: React Aria / Spectrum.
- **A shipped marketing kit.** Untitled UI / Tailwind UI *are* kits. This repo is the kernel those kits would sit on. Taste, copy, and a curated example set still have to be designed. The machinery to *build* a kit without forking is here (below).

### Can this build kits easily?

**A branded kit, yes — that is the point.** You do not fork the fleet.

1. **Theme knobs** — one `ThemeProvider` (`radius`, `density`, `shadow`, `stroke`) retints geometry for every atom and composite.
2. **`.extend()`** — `AcmeButton = Button.extend({ props: { intent: 'primary' }, slots: { leftIcon: AcmeMark } })`. Same for `Calendar.Header`, `DateTime.trigger`.
3. **`InterfaceProvider components`** — register the extended map once; app code still writes `<Button />`.
4. **Nested `slotProps`** — swap an inner occupant (`search.leftIcon`) without rewriting the parent.

**A storefront-quality kit is still work.** The kernel will not invent a marketing page, empty-state illustrations, or a 40-screen design mockup. Easy = consistent brand over the existing fleet. Hard = new compositions, motion, and editorial polish. There is no visual “kit builder” product yet — it is code (and later, an agent that reads the registry).

### Useful vs slop

**Keep:** slots, nested `slotProps`, `.extend()`, attachments, `resolvesTo` (merge occupant props at read time), `validValues`, the optical ramp. Those change what a second team — or future you — can do without a fork.

**Do not sell as the product:** the edge-list JSON, “AST engine” branding (it is a structured source scan), or a homepage that is only the slot tree. Most app developers want eight props and one example. The registry is leverage **if something reads it** (docs, codegen, an agent). If nothing does, it is a detailed catalog of our own homework.

### AI flows

This helps when generation is **constrained to Consona** (or an IR that compiles to Consona): list from `metadata-registry`, fetch one `components[Name]`, follow `graph`, reject illegal `intent` / occupants with `validValues` and `resolvesTo`. Do not dump the full pretty-printed JSON into every prompt.

It does **not** make a model better at “any library.” If the agent may emit shadcn or `<input type="date">`, this file is unused. A library-agnostic plan + a router that *then* compiles to Consona is the only honest “any library” story.

---

## 1. Executive Summary & Architectural Philosophy

Modern enterprise design systems struggle with two fundamental dilemmas:

### 1.1 The Customization Paradox

- **Too rigid (Monolithic):** Changing an internal icon, replacing a calendar cell with stock badges, or swapping a time wheel requires copy-pasting the entire 1,000-line component.
- **Too flexible (Unstyled Headless):** Every app must write its own complex styling, accessibility glue, animations, and focus management.

### 1.2 The Optical Proportionality Dilemma

- **Flat global tokens create visual distortion:** Applying a flat `16px` radius or `12px` padding across every component makes large cards look subtle, but turns small checkboxes or calendar cells into deformed pills.
- **Nested corner radius collision:** When an outer card has a `16px` radius with `12px` padding, placing a `16px` radius on inner elements causes corner clashes rather than harmonic concentric curves.

  `R_inner = R_outer - padding`

- **Component-specific settings create picker fatigue:** Exposing 100 individual sliders in the theme picker overwhelms users with configuration clutter.

Consona Interface resolves these challenges through a **4-Tier Customization Ladder** powered by **Optical Geometry & Token Ramps**:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: Headless Component Hooks & Engine Middleware Pipeline                │
│         Pure logic, ARIA math, time physics, step validation,                 │
│         sound/haptic triggers                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ TIER 2: Slot Injection & Compound Anatomy                                    │
│         Replace any internal sub-component globally or per-instance           │
│         via slots & context                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ TIER 1: Unified Component Factory & Extensions                                │
│         .extend({ name, props, slots })                                       │
│         Pre-package brand variants with baked-in sub-atoms, styles & props    │
├──────────────────────────────────────────────────────────────────────────────┤
│ TIER 0: Optical Tokens & Dynamic Design Ramps                                 │
│         Macro/Base/Micro geometry scales, concentric radii, density factors,  │
│         OKLCH                                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
````

---

# 1.3 Universal Navigation Engine, Providers & Native Routing

Consona Interface includes a dedicated, framework-agnostic **Hierarchical Navigation Engine & Provider Subsystem** (`@consona/interface/navigation`).

Instead of pulling heavy third-party routing libraries (like `react-router-dom` or `@remix-run/router`) that bloat bundles by ~60KB and force deep React Context nesting, Consona implements a **Pure TypeScript Engine Triad**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Pure TypeScript NavigationEngine (Zero React, Framework-Agnostic)        │
│    - O(1) Hash Map node & parent indexing                                   │
│    - Route pattern compilation (e.g., /components/category/:category)       │
│    - Ancestor trail resolution, sibling lookups, and forward routes         │
│    - Navigation guards & lifecycle event emitter (nav:change, nav:blocked)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Pluggable Router Adapters                                                │
│    - BrowserHistoryAdapter: Native HTML5 pushState & popstate API           │
│    - HashAdapter: Hash-based routing (#/route)                              │
│    - StateAdapter: In-memory state routing (unit tests / embedded widgets)  │
│    - Framework Adapters: Next.js (App / Pages Router) & React Router        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. React Integration Surface                                                │
│    - <NavigationProvider tree={navTree} adapter={new BrowserHistoryAdapter}>│
│    - useNavigation(): { activeId, activeNode, trail, params, state, ... }   │
│    - <NavOutlet />: Declarative component viewport & param injector         │
│    - <NavBreadcrumbs />: Interactive breadcrumbs with forward-route flyouts │
│    - <NavLevelMenu />: Cascading multi-layer flyouts anchored via DOM       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Core Building Blocks: What is What?

To avoid confusion, here is the exact responsibility of each building block in the navigation subsystem:

| Subsystem Component | Role & Responsibility | Where It Is Used |
| :--- | :--- | :--- |
| **`NavigationEngine`** | Pure TypeScript graph & state manager. Indexes the navigation tree into $O(1)$ Hash Maps, pre-compiles dynamic URL regex patterns, executes async guards, manages history stacks, and emits lifecycle events (`nav:change`). | Instantiated by `NavigationProvider` under the hood. |
| **`BrowserHistoryAdapter`** | Bridges the `NavigationEngine` to the browser's native HTML5 `window.history` API (`pushState`, `replaceState`, and `popstate` back/forward events). | Passed into `<NavigationProvider adapter={new BrowserHistoryAdapter()} />` in `main.tsx`. |
| **`NavigationProvider`** | React Context provider that exposes the active `NavigationEngine` instance and reactive navigation state to all child components. | Root entrypoint (`main.tsx`) wrapping `<App />`. |
| **`useNavigation()`** | The single unified React hook to read navigation state (`activeId`, `activeNode`, `currentPath`, `params`, `query`, `state`, `trail`) and dispatch transitions (`navigate`, `back`, `forward`). | Any component or view (e.g. `app.tsx`, headers, cards). |
| **`<NavOutlet />`** | Declarative viewport component that automatically renders `activeNode.component` and spreads dynamic route parameters (`params`) as React props. | Main content layout (Pattern A). |
| **`<NavBreadcrumbs />`** | Interactive breadcrumbs bar that queries the active trail and displays cascading hover menus for sibling and child routes. | Application topbar/header. |

---

### Comparison: React Router vs. Consona Navigation Engine

| Dimension | `react-router-dom` | Consona `NavigationEngine` |
| :--- | :--- | :--- |
| **Bundle Size Overhead** | **~50 KB – 65 KB** minified (~18 KB gzip) + 5 npm dependencies | **~3.5 KB** (Built directly into `@consona/interface`, **0 extra dependencies**) |
| **Route Resolution Speed** | Dynamic multi-pass tree scoring & rank traversal | **$O(1)$ Instant Map lookup** with pre-compiled RegEx cache (<0.05ms) |
| **React Fiber Overhead** | 4 nested Context Providers (`Router`, `Location`, `Route`, `Navigation`) | **1 single Context Provider** with zero fiber tree churn |
| **Ancestor & Sibling Trail** | Requires manual path splitting or custom `useMatches()` reducers | **Built-in graph indexing**: Instant ancestor trail, sibling lists, and forward child routes |

---

### Declarative Route & Component Rendering (`<NavOutlet />`)

In Consona Interface, page routing requires **zero if/else or switch ladders**. Attach component references directly to `NavNode.component` in your tree, and drop `<NavOutlet />` into your layout:

```tsx
// 1. In demo-nav-tree.ts (Component & Route Association):
const navTree: NavNode[] = [
  { id: 'overview', href: '/', component: OverviewPage },
  { id: 'buttons', href: '/components/buttons', component: ButtonsDocView },
  { id: 'providers', href: '/architecture/providers', component: ProvidersPage },
  // Dynamic Pattern Route:
  { pattern: '/components/category/:category', component: ComponentCategoryPage },
]

// 2. In app.tsx (1-Line Viewport):
import { NavOutlet } from '@consona/interface'

export function MainLayout() {
  return (
    <main className="flex-1 p-6">
      <NavOutlet fallback={<OverviewPage />} />
    </main>
  )
}
```

* **Compute Efficiency**: $O(1)$ instant component lookup from the pre-indexed `activeNode.component`.
* **Storage & Memory**: Zero intermediate router wrappers or re-render churn.
* **Developer Ergonomics**: Add a route or page by simply defining a node in the tree without touching any layout components.

---

### Passing State & Data with `navigate()`

The `navigate()` function allows you to pass **custom state payloads**, **dynamic parameters**, and **query parameters** across route transitions:

#### 1. Passing Route State (`state`), Params, and Query
```tsx
import { useNavigation } from '@consona/interface'

export function ComponentCard({ id, name, category }: ComponentCardProps) {
  const { navigate } = useNavigation()

  const handleCardClick = () => {
    // Navigate with a custom in-memory state payload and search query:
    navigate(`/components/${id}`, {
      // 1. Arbitrary ephemeral state payload (preserved in history and engine state):
      state: {
        fromHub: true,
        sourceCategory: category,
        selectedTab: 'playground',
        timestamp: Date.now(),
      },
      // 2. URL search parameters: -> /components/button?tab=playground&theme=dark
      query: {
        tab: 'playground',
        theme: 'dark',
      },
      // 3. Optional history replacement (replaceState vs pushState)
      replace: false,
    })
  }

  return (
    <div onClick={handleCardClick} className="cursor-pointer card">
      <h3>{name}</h3>
    </div>
  )
}
```

#### 2. Reading State, Params & Query on the Destination Page
```tsx
import { useNavigation } from '@consona/interface'

export function ComponentDocView() {
  const {
    activeId,      // 'button'
    currentPath,   // '/components/button?tab=playground&theme=dark'
    params,        // Dynamic path parameters: { category: 'form' }
    query,         // Parsed query dictionary: { tab: 'playground', theme: 'dark' }
    state,         // Custom state payload: { fromHub: true, sourceCategory: '...', ... }
    navigate,
    back,
  } = useNavigation()

  // Inspect the passed data payload:
  const wasFromHub = state?.fromHub
  const activeTab = query.tab || 'overview'

  return (
    <div>
      {wasFromHub && (
        <button onClick={() => back()} className="back-btn">
          ← Return to {state?.sourceCategory} Hub
        </button>
      )}
      <h2>Viewing {activeId} (Tab: {activeTab})</h2>
    </div>
  )
}
```

---

### Dynamic Routes & URL Parameter Support

`NavigationEngine` provides first-class support for dynamic route patterns (e.g. `/components/category/:category` or `/plugins/:pluginId/docs/:section`):

```tsx
// 1. Declare dynamic patterns in the nav tree:
const dynamicRoutes: NavNode[] = [
  {
    id: 'component-category',
    label: 'Component Category',
    pattern: '/components/category/:category', // 👈 Dynamic parameter placeholder
    component: ComponentCategoryPage,          // Receives { category } as props via <NavOutlet />
    hideInNav: true,                           // Exclude from static sidebar lists
  },
  {
    id: 'plugin-doc',
    label: 'Plugin Section',
    pattern: '/plugins/:pluginId/docs/:section',
    component: PluginDocPage,                  // Receives { pluginId, section } as props
    hideInNav: true,
  },
]

// 2. Programmatic Navigation using Node ID + Params:
navigate('component-category', {
  params: { category: 'form' },
  state: { referrer: 'sidebar-quick-filter' },
})
// -> Resolves and updates browser URL to: /components/category/form

// 3. Or navigate directly with the dynamic path string:
navigate('/components/category/form')
```

**How dynamic routing works under the hood:**
- **Pre-Compilation**: When `engine.setTree()` is called, string patterns with `:param` are pre-compiled into regular expressions (`^/components/category/([^/]+)$`) with an ordered array of key names.
- **$O(1)$ Resolution**: When matching a URL path, `resolveNode(path)` tests against the pre-compiled regex array and extracts matching capture groups into `params: Record<string, any>`.
- **Automatic Breadcrumb & Trail Sync**: Dynamic routes automatically resolve parent linkages, ancestor breadcrumb trails, and active navigation states.

---

# 2. Theming Surface: Extensible Architecture & Optical Geometry

## 2.1 Extensible Theme System & Lean Core

Consona Interface separates foundational styling from rich luxury presets and font catalogs:

* **Lean Core (`@consona/interface`)**: Contains essential geometric ramps, OKLCH color substrate, and foundational presets (`mono`, `slate`, `zinc`).
* **Theme Extenders (`ThemeExtension`)**: Downstream applications can inject custom presets, brand variables, and Google Fonts using `consonaThemeExtender` or `createThemeExtender()`.

```tsx
import { InterfaceProvider, ThemeProvider, consonaThemeExtender, createThemeExtender } from '@consona/interface'

// Define custom downstream brand extension
const brandExtender = createThemeExtender({
  name: 'acme-corp',
  presets: [
    {
      id: 'acme-electric',
      label: 'ACME Electric',
      preview: ['#00f0ff', '#0b0c10', '#1f2833'],
      tokens: { radius: 'md', shadow: 'strong', density: 'normal' },
      light: { bg: '#ffffff', fg: '#0b0c10', primary: '#0070f3', primaryFg: '#ffffff' },
      dark: { bg: '#0b0c10', fg: '#f8fafc', primary: '#00f0ff', primaryFg: '#0b0c10' },
    },
  ],
})

export function App() {
  return (
    <ThemeProvider
      defaultTheme="system"
      preset="acme-electric"
      extenders={[consonaThemeExtender, brandExtender]}
    >
      <MainApp />
    </ThemeProvider>
  )
}
```

---

## 2.2 Next-Generation Optical Scale System

To eliminate visual distortion without adding hundreds of confusing sliders to the Theme Picker, the theme engine provides **High-Level Control Knobs** that dynamically compute optical geometric scales:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Theme Picker & Control Knobs                          │
│                                                                             │
│  • Curvature:  [None (0) | SM | MD (0.5rem) | LG | Full]                   │
│  • Density:    [Compact (0.85) | Normal (1.0) | Spacious (1.15)]           │
│  • Elevation:  [None | Subtle | Soft | Strong]                              │
│  • Stroke:     [Flat (0px) | Standard (1px) | Bold (2px)]                  │
│  • Font Scale: [XS (13px) | SM (14px) | MD (16px) | LG (18px) | XL (20px)] │
│  • Typography: [Google Fonts Catalog: 40+ Sans & Mono Typefaces]            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Component & Atom Intent Mapping                         │
│                                                                             │
│  Outer Card / Modal (Macro) ──► var(--radius-macro)                         │
│  Input / Button     (Base)  ──► var(--radius-base)                          │
│  Cell / Chip / Atom (Micro) ──► var(--radius-micro)                         │
│  Concentric inner sub-parts ──► max(2px, calc(R_macro - padding))          │
│  Data padding / spacing     ──► calc(space * density_factor)                │
│  Floating surfaces / dialog ──► var(--shadow-lg), var(--shadow-2xl)         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dynamic CSS Optical Ramps

```css
@theme inline {
  /* Dynamic Geometric Optical Ramps */
  --radius-macro: calc(var(--radius, 0.5rem) * 1.5 * var(--density-factor, 1));
  --radius-base:  calc(var(--radius, 0.5rem) * 1.0 * var(--density-factor, 1));
  --radius-micro: calc(var(--radius, 0.5rem) * 0.75 * var(--density-factor, 1));
  --radius-atom:  calc(var(--radius, 0.5rem) * 0.4 * var(--density-factor, 1));

  /* Standard Tailwind Compatibility Aliases */
  --radius-sm: var(--radius-micro);
  --radius-md: var(--radius-base);
  --radius-lg: var(--radius-macro);
  --radius-xl: var(--radius-macro);

  /* Optical Density & Spacing Ramps */
  --spacing-space-2xs: calc(0.125rem * var(--density-factor, 1));
  --spacing-space-xs:  calc(0.25rem * var(--density-factor, 1));
  --spacing-space-sm:  calc(0.5rem * var(--density-factor, 1));
  --spacing-space-md:  calc(0.75rem * var(--density-factor, 1));
  --spacing-space-lg:  calc(1rem * var(--density-factor, 1));
  --spacing-space-xl:  calc(1.5rem * var(--density-factor, 1));

  /* Pure Dynamic Typography Scale */
  --text-xs:   calc(0.75rem * var(--font-size-factor, 1));
  --text-sm:   calc(0.875rem * var(--font-size-factor, 1));
  --text-base: calc(1rem * var(--font-size-factor, 1));
  --text-lg:   calc(1.125rem * var(--font-size-factor, 1));
  --text-xl:   calc(1.25rem * var(--font-size-factor, 1));
}
```

---

## 2.3 Global Cascading Elevation & Surface Layer

Rather than requiring manual configuration across hundreds of components, `@consona/interface` enforces **global semantic surface layers** in CSS:

* **Floating Overlays** (`.react-aria-Popover`, `[data-slot="popover"]`, `[data-slot="menu-popover"]`, `[data-slot="select-popover"]`, `[data-slot="combobox-popover"]`, `[data-slot="multiple-select-popover"]`) automatically follow `var(--shadow-lg)`.
* **Modals & Drawers** (`.react-aria-Modal`, `[data-slot="modal-content"]`, `[data-slot="drawer-surface"]`) automatically follow `var(--shadow-2xl)`.
* **Tooltips** (`.react-aria-Tooltip`) automatically follow `var(--shadow-xs)`.
* **Solid & Elevated Buttons** automatically inherit subtle elevation (`var(--shadow-2xs)`).
* When Elevation is set to `none`, all shadow variables collapse cleanly to `none`.

---

## 2.4 Subtree Theme Isolation & Hardcoded Locking (`<ThemeScope>`)

Downstream consumers can isolate any component, section, or widget to a hardcoded preset, dark/light mode, or custom token set that **ignores global Theme Editor changes**:

```tsx
import { ThemeScope, Button, Drawer, Select } from '@consona/interface'

// 1. Lock a specific widget to a dark editorial theme
<ThemeScope preset="noir-emeraude" mode="dark">
  <Select ... />
  <Button intent="primary">Always Dark Preset</Button>
</ThemeScope>

// 2. Lock geometric tokens (sharp corners, custom shadow, compact density)
<ThemeScope radius="none" shadow="subtle" density="compact">
  <Drawer ... />
</ThemeScope>
```

---

# 3. The 4-Tier Customization Ladder

## Tier 0: Design Tokens & Dynamic Token Engine

### Purpose

Unified, first-class design token substrate:
* OKLCH Color Palettes (Light & Dark modes)
* Optical Radius & Concentric Inset Ramps
* Mathematical Optical Density Scaling
* Dark-Mode Adaptive Specular Elevation
* Dynamic Typography Scale & Google Font Catalogs

### Dynamic Token Runtime Engine (`useTheme()`)

The `useTheme()` hook provides comprehensive runtime control over presets, tokens, and descriptors:

```tsx
const {
  // Presets
  presets,            // All merged presets (core + extenders + dynamic)
  activePreset,       // Currently active ThemePreset
  presetId,           // Active preset identifier
  setPresetId,        // Switch active preset
  registerPreset,     // Dynamically register a new ThemePreset at runtime
  unregisterPreset,   // Remove a registered preset

  // Unified Token Engine
  tokens,             // Dynamic token map
  getToken,           // Read a token value
  setToken,           // Set a CSS variable dynamically (e.g. setToken('primary', '#ff0055'))
  setTokens,          // Batch update tokens
  removeToken,        // Remove a custom token
  resetTokens,        // Clear all token overrides

  // Geometric Knobs
  radius, setRadius,
  shadow, setShadow,
  density, setDensity,
  stroke, setStroke,
  fontSize, setFontSize,
  fontFamily, setFontFamily,

  // Global Reset
  resetTheme,
} = useTheme()
```

---

# Tier 1: Unified Component Factory & Extensions

In design systems, components fall into two categories:

### Atomic Components

Examples:

* `Button`
* `Badge`
* `Avatar`
* `Input`

These are generally single DOM nodes where configuring props such as:

* `className`
* `intent`
* `size`

is sufficient.

### Composite / Multi-Atom Components

Examples:

* `DateTimePicker`
* `Modal`
* `Select`
* `AudioRecorder`
* `DataTable`

These are complex component trees made of multiple internal sub-parts:

* Triggers
* Calendar grids
* Date cells
* Time wheels
* Visualizer bars
* Action footers

The `.extend()` API follows the natural DOM and React principle:

> **Every component is defined simply by its `props` and its `slots`.**

```tsx
Component.extend({
  name: 'NewComponentName',
  props: { ... },
  slots: { ... },
})
```

---

## Example A: Atomic Component Extension

```tsx
import { Button } from '@consona/interface'

export const BrandAction = Button.extend({
  name: 'BrandAction',

  props: {
    className:
      'shadow-glow uppercase tracking-wider rounded-2xl font-bold',

    intent: 'primary',
    size: 'lg',
  },
})
```

---

## Example B: Composite Component Extension

A fintech team can create a company-wide `FinanceDateTimePicker` that locks in 15-minute intervals, styles the time wheel, and uses a stock market date cell atom without boilerplate.

```tsx
import { DateTimePicker } from '@consona/interface'
import {
  StockMarketCalendarCell,
  FinanceTrigger,
} from './atoms'

export const FinanceDateTimePicker = DateTimePicker.extend({
  name: 'FinanceDateTimePicker',

  props: {
    className:
      'border-emerald-500/30 bg-emerald-950/20 backdrop-blur-xl',

    minuteStep: 15,
    showDayName: true,
    is24Hour: true,

    slotProps: {
      presets: {
        className:
          'bg-emerald-900/20 border-b border-emerald-500/20 py-2',
      },

      timeWheel: {
        className:
          'text-emerald-400 font-mono tracking-tight',
      },

      footer: {
        className:
          'bg-emerald-950/60 border-t border-emerald-500/20 p-3',
      },

      popover: {
        placement: 'bottom end',
        offset: 12,
      },
    },
  },

  slots: {
    CalendarCell: StockMarketCalendarCell,
    Trigger: FinanceTrigger,
  },
})
```

### Developer Usage

```tsx
<FinanceDateTimePicker />

// One-off instance override
<FinanceDateTimePicker
  slots={{
    Footer: SpecialAuditFooter,
  }}
/>
```

---

## Example C: Media Component Extension

```tsx
export const VoiceNoteRecorder = AudioRecorder.extend({
  name: 'VoiceNoteRecorder',

  props: {
    maxDurationSeconds: 120,

    visualizerVariant: 'sine-wave',

    slotProps: {
      visualizer: {
        className:
          'h-16 bg-card/50 rounded-xl',
      },

      controls: {
        className:
          'justify-between px-4',
      },
    },
  },

  slots: {
    RecordButton: PulsingMicButton,
    TimerDisplay: MonospaceLiveBadge,
  },
})
```

---

# Tier 2: Slot Injection & Compound Anatomy

Downstream applications must be able to **swap out any internal part of a complex component** while preserving surrounding:

* Layout
* Accessibility
* State
* Behavior

---

## 2.1 Component Anatomy & Slot Definition

Every complex component defines its internal slots:

```tsx
export interface DateTimePickerSlots {
  Trigger?: React.ComponentType<DateTimePickerTriggerProps>
  Presets?: React.ComponentType<DateTimePickerPresetsProps>
  DatePane?: React.ComponentType<DateTimePickerDatePaneProps>
  TimeWheel?: React.ComponentType<InteractiveTimeWheelProps>
  CalendarCell?: React.ComponentType<CalendarCellProps>
  Footer?: React.ComponentType<DateTimePickerFooterProps>
}
```

---

## 2.2 Per-Instance Slot Overrides

```tsx
<DateTimePicker
  slots={{
    CalendarCell: ({ date, isSelected }) => (
      <div
        className={cn(
          "size-9 flex flex-col items-center",
          isSelected && "bg-emerald-500"
        )}
      >
        <span className="text-xs">
          {date.day}
        </span>

        <span className="text-[9px] text-emerald-400 font-mono">
          +$240
        </span>
      </div>
    ),

    TimeWheel: ({ value, onChange }) => (
      <CustomRadialClock
        value={value}
        onChange={onChange}
      />
    ),

    Footer: ({ onClear, onDone }) => (
      <div className="flex gap-2 p-2">
        <Button intent="plain" onPress={onClear}>
          Reset
        </Button>

        <Button
          intent="primary"
          onPress={autoScheduleWithAI}
        >
          AI Schedule
        </Button>
      </div>
    ),
  }}

  slotProps={{
    presets: {
      className:
        'grid grid-cols-3 gap-1 bg-neutral-900/50',
    },

    footer: {
      className:
        'bg-card border-t border-border/80',
    },

    popover: {
      placement: 'top end',
      offset: 12,
    },
  }}
/>
```

---

## 2.3 Global Component Overrides

Downstream applications can set global component overrides at the root:

```tsx
<InterfaceProvider
  components={{
    Button: AcmeButton,
    CalendarCell: AcmeStockCalendarCell,
    Loader: AcmePulseLoader,
  }}
>
  <App />
</InterfaceProvider>
```

---

## 2.4 Compound Sub-Components & Family Architecture

Components can expose compound sub-components for flexible layout composition:

```tsx
<DateTimePicker.Root
  value={value}
  onChange={setValue}
>
  <div className="flex flex-row gap-4">

    <aside className="w-48 border-r border-border p-2">
      <DateTimePicker.Presets direction="vertical" />
    </aside>

    <main className="flex-1 p-2">
      <DateTimePicker.DatePane />
      <DateTimePicker.TimePane />
      <DateTimePicker.Footer />
    </main>

  </div>
</DateTimePicker.Root>
```

---

## 2.5 Universal `createInterfaceComponent` Wrapping

Every family sub-component should be wrapped in `createInterfaceComponent`.

Examples:

```text
Button.Group
Button.WithIndicator

Sidebar.Header
Sidebar.Item
Sidebar.Trigger

Slider.Track
Slider.Thumb

Field.Group
Field.Label

Switch.Button
```

This guarantees:

### Symmetrical Downstream Extensibility

Every sub-part can be customized through `.extend()`:

```tsx
const BrandedItem = Sidebar.Item.extend({
  className:
    'font-mono text-xs uppercase tracking-wider',
})
```

### Automatic Runtime DOM & CSS Targeting

Every component wrapped in `createInterfaceComponent` automatically receives standard runtime identifiers injected into its DOM node:

* **Semantic CSS Class (`.interface-*`)**: e.g., `.interface-button`, `.interface-date-picker-trigger`, `.interface-marker-popup`.
* **Stable Data Attribute (`data-component`)**: e.g., `data-component="Button"`, `data-component="DatePickerTrigger"`.

This enables effortless targeting in stylesheets, E2E tests (Playwright/Cypress), runtime queries, and tour beacon target locators:

```css
/* Custom CSS override across all instances */
.interface-button {
  transition: transform 0.15s ease;
}

[data-component="Select"] {
  min-width: 200px;
}
```

```tsx
// Targeting in onboarding tours or DOM queries
<TourBeacon target='[data-component="DatePickerTrigger"]' title="Pick a Date" />
```

### Automatic AST Registry Extraction

`npm run build:registry` scans source (`src/registry/builder.ts` + `src/registry/resolve.ts`) and writes:

* Props (including cross-file `extends` / `Omit<FooProps, …>`)
* Slot definitions, payloads, and `resolvesTo` occupants
* Family attachments (`Calendar.Header` → `CalendarHeader`)
* Injected DOM metadata (`semanticClass` and `dataComponent`)

into:

```text
src/registry/registry.json
src/registry/metadata-registry.json
```

The demo API tables and collapsible slot tree read this JSON. Rebuild after any props/slots/`Attach` change.

### Rich JSDoc Documentation

Every property and slot across root components and sub-parts can contain JSDoc descriptions extracted into registry metadata.

This enables:

* Live interactive documentation
* Developer IDE hints
* Machine-readable API references

### Interactive Sub-Component API Reference

Documentation can expose an interactive tab bar allowing developers to inspect:

* Exact props
* Descriptions
* Slots
* Component family members

without cluttering top-level navigation.

---

# Tier 3: Headless Component Hooks & Engine Middleware

Downstream applications can reuse Consona's:

* Keyboard navigation
* Date/time physics
* ARIA accessibility
* Validation math
* State machines
* Sound/haptic triggers

while rendering completely custom markup.

This allows implementations such as:

* Mobile bottom sheets
* Watch widgets
* Command palettes
* Custom application shells

---

## 3.1 Headless Component Hooks

Example:

```tsx
export function useDateTimePicker(
  props: DateTimePickerProps
) {
  const [date, setDate] = useState(...)
  const [time, setTime] = useState(...)
  const [tab, setTab] =
    useState<'date' | 'time'>('date')

  return {
    state: {
      date,
      time,
      tab,
      is24Hour,
      isMobile,
    },

    actions: {
      setDate,
      setTime,
      setTab,
      snapMinute,
      applyPreset,
      clear,
      done,
    },

    helpers: {
      formattedString,
      isValidRange,
      timeRemaining,
    },

    ariaProps: {
      triggerProps,
      calendarProps,
      wheelProps,
    },
  }
}
```

---

# 3.2 The 3-Layer Engine Architecture

Consona engines follow a clean, decoupled three-layer architecture:

```text
┌──────────────────────────────────────────────────────────────┐
│ 1. Pure TypeScript Engine Class                              │
│    Framework-Agnostic Core                                   │
│                                                              │
│    class OnboardingEngine { ... }                            │
│    class OverlayEngine { ... }                               │
│                                                              │
│    Holds:                                                     │
│    - State machines                                           │
│    - DOM event listeners                                      │
│    - Mathematics                                              │
│    - Storage                                                  │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ Reactive binding
                               │ via useSyncExternalStore
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. React Binding                                              │
│                                                              │
│    OnboardingProvider                                         │
│    useOnboarding                                              │
│                                                              │
│    Connects pure engine instances to React trees              │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ Bundles into
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Plugin & Root Bootstrapping                               │
│                                                              │
│    export const OnboardingPlugin: InterfacePlugin = {...}    │
│                                                              │
│    <InterfaceProvider                                          │
│      plugins={[OnboardingPlugin]}                             │
│    />                                                         │
└──────────────────────────────────────────────────────────────┘
```

---

# 3.3 Pluggable Engines & Lifecycle Interceptors

A **Plugin** packages:

* An engine Provider
* Optional component overrides
* Event listeners

```tsx
export interface InterfacePlugin {
  name: string
  version?: string

  /** The Engine's React Provider wrapper */
  Provider?: React.ComponentType<{
    children: React.ReactNode
  }>

  /** Global component / slot overrides */
  components?: Record<
    string,
    React.ComponentType<any>
  >

  /** Optional lifecycle event listeners */
  events?: Record<
    string,
    (
      payload: any
    ) => void | Promise<boolean | void>
  >
}
```

---

# 3.4 360° Extensibility Matrix

| Layer          | What You Want to Do         | How Downstream Does It                                                                   |
| -------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| **Engines**    | Listen to Events            | `events={{ 'onboarding:stepChange': (step) => ... }}` or `engine.on('state:change', fn)` |
|                | Configure Options           | Pass custom options such as storage keys, keyboard flags, z-index via Provider or Plugin |
|                | Swap Drivers / Adapters     | Inject custom storage such as `new CloudSyncStorage()`                                   |
|                | Subclass / Extend Core Math | Extend `OverlayEngine` and override geometry/masking methods                             |
|                | Add Brand New Engines       | Register Haptics, Voice, Copilot, etc. via `plugins={[MyPlugin]}`                        |
| **Hooks**      | Extend Utility Hooks        | Pass custom options/adapters                                                             |
|                | Extend Engine Hooks         | Compose wrapper hooks or access raw engine instances                                     |
|                | Extend Headless UI Hooks    | Wrap actions with custom validation/rules                                                |
| **Components** | Extend & Brand Variant      | `DateTimePicker.extend({ props, slots })`                                                |
|                | Swap Globally               | `components={{ Button: MyCustomButton }}`                                                |
|                | Swap Locally                | `<DateTimePicker slots={{ footer: CustomFooter }} />`                                    |

---

## Example: Downstream Feature Plugin

```tsx
// plugins/audio-feedback-plugin.ts

export const audioFeedbackPlugin: InterfacePlugin = {
  name: 'audio-feedback',

  Provider: AudioProvider,

  events: {
    // Play subtle audio click whenever onboarding advances
    'onboarding:stepChange': ({ stepId }) => {
      audioPlayer.play('soft-pop')
    },

    // Play haptic/audio alert on errors
    '*:error': ({ error }) => {
      audioPlayer.play('alert-buzz')
    },
  },
}
```

---

# 4. Universal Component Factory

A component blueprint is defined through a single unified `ComponentConfig`.

The same configuration model is used both when creating a component and when extending it through `.extend()`.

```tsx
// src/lib/component-factory.tsx

import React, {
  type ComponentType,
  type ReactNode,
} from 'react'

import { cn } from 'cn'

export interface ComponentConfig<
  Props = any,
  Slots = any
> {
  name: string
  category?:
    | 'form'
    | 'feedback'
    | 'navigation'
    | 'overlay'
    | 'media'
    | 'data'

  description?: string
  version?: string
  docUrl?: string

  props?: Partial<Props>
  slots?: Partial<Slots>
}

export interface InterfaceComponent<
  Props,
  Slots = any
> {
  (
    props: Props & {
      slots?: Partial<Slots>
    }
  ): ReactNode

  displayName: string

  config: ComponentConfig<Props, Slots>

  extend: (
    config: ComponentConfig<Props, Slots>
  ) => InterfaceComponent<Props, Slots>
}

export function createInterfaceComponent<
  Props extends {
    className?: string
    slotProps?: Record<string, any>
  },
  Slots = Record<
    string,
    ComponentType<any>
  >
>(
  config: ComponentConfig<Props, Slots>,
  RenderComponent: ComponentType<
    Props & {
      slots?: Partial<Slots>
    }
  >
): InterfaceComponent<Props, Slots> {

  const Comp: any = (props: any) => {
    const mergedProps = {
      ...config.props,
      ...props,

      className: cn(
        config.props?.className,
        props.className
      ),
    }

    const mergedSlots = {
      ...config.slots,
      ...props.slots,
    }

    const mergedSlotProps = {
      ...config.props?.slotProps,
      ...props.slotProps,
    }

    return (
      <RenderComponent
        {...mergedProps}
        slots={mergedSlots}
        slotProps={mergedSlotProps}
      />
    )
  }

  Comp.displayName = config.name
  Comp.config = config

  Comp.extend = (
    extendedConfig: ComponentConfig<
      Props,
      Slots
    >
  ) => {
    return createInterfaceComponent(
      {
        ...config,
        ...extendedConfig,

        props: {
          ...config.props,
          ...extendedConfig.props,
        },

        slots: {
          ...config.slots,
          ...extendedConfig.slots,
        },
      },
      RenderComponent
    )
  }

  return Comp
}
```

---

# 5. `<InterfaceProvider />` & Plugin Composition

`<InterfaceProvider />` manages three primary concerns:

1. **Visual Theme**

   * Theme tokens
   * Light/dark mode

2. **Component & Slot Overrides**

   * Global component replacement

3. **Pluggable Engine Providers**

   * Plugin-based engine composition

```tsx
// src/components/interface-provider.tsx

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'

import {
  ThemeProvider,
  type ThemeConfig,
} from './theme/theme-provider'

import type {
  InterfacePlugin,
} from '../engine/types'

export interface InterfaceConfig {
  /** Visual token theme overrides */
  theme?: ThemeConfig

  /** Global component & slot replacements */
  components?: Record<
    string,
    React.ComponentType<any>
  >

  /** Pluggable engine bundles */
  plugins?: InterfacePlugin[]

  /** Global event listeners across engines */
  events?: Record<
    string,
    (
      payload: any
    ) => void | Promise<boolean | void>
  >
}

interface InterfaceContextValue {
  getComponent: <
    T extends React.ComponentType<any>
  >(
    name: string,
    fallback: T
  ) => T

  emit: (
    event: string,
    payload?: any
  ) => Promise<void>
}

const InterfaceContext =
  createContext<InterfaceContextValue | null>(
    null
  )

export const useInterface = () => {
  const ctx = useContext(InterfaceContext)

  if (!ctx) {
    throw new Error(
      'useInterface must be used within an <InterfaceProvider>'
    )
  }

  return ctx
}

export function InterfaceProvider({
  config = {},
  plugins = [],
  children,
}: {
  config?: InterfaceConfig
  plugins?: InterfacePlugin[]
  children: ReactNode
}) {
  const allPlugins = useMemo(
    () => [
      ...(config.plugins ?? []),
      ...plugins,
    ],
    [config.plugins, plugins]
  )

  const contextValue =
    useMemo<InterfaceContextValue>(() => {
      const components = new Map<
        string,
        React.ComponentType<any>
      >(
        Object.entries(
          config.components ?? {}
        )
      )

      for (const plugin of allPlugins) {
        if (plugin.components) {
          Object.entries(
            plugin.components
          ).forEach(([key, component]) => {
            components.set(key, component)
          })
        }
      }

      return {
        getComponent: (
          name,
          fallback
        ) =>
          (components.get(name) as any) ??
          fallback,

        emit: async (
          event: string,
          payload?: any
        ) => {
          config.events?.[event]?.(
            payload
          )

          for (const plugin of allPlugins) {
            await plugin.events?.[
              event
            ]?.(payload)
          }
        },
      }
    }, [
      allPlugins,
      config.components,
      config.events,
    ])

  const wrappedContent = useMemo(() => {
    return allPlugins.reduceRight(
      (acc, plugin) => {
        if (!plugin.Provider) return acc

        const Provider = plugin.Provider

        return (
          <Provider>
            {acc}
          </Provider>
        )
      },
      children
    )
  }, [allPlugins, children])

  return (
    <InterfaceContext.Provider
      value={contextValue}
    >
      <ThemeProvider {...config.theme}>
        {wrappedContent}
      </ThemeProvider>
    </InterfaceContext.Provider>
  )
}
```

---

# 6. Architectural Rules & Engineering Invariants

To maintain clean code quality, predictability, and downstream extensibility, every component, hook, and engine must follow defined authoring rules.

---

## 6.1 Component Authoring Rules

### Rule C1 & C2 — Factory Wrap & Isomorphic Config

Every component must be created using `createInterfaceComponent`.

Default styles belong inside:

* `props.className`
* `props.slotProps`

```tsx
export const Button =
  createInterfaceComponent<
    ButtonProps,
    ButtonSlots
  >(
    {
      name: 'Button',
      category: 'form',

      description:
        'Interactive button atom with optical border radius.',

      props: {
        variant: 'default',
        size: 'md',

        className:
          'inline-flex items-center justify-center font-medium transition-colors rounded-micro',
      },

      slots: {
        loader: Loader,
      },
    },

    ({
      className,
      variant,
      size,
      slots,
      children,
      ...props
    }) => {
      const LoaderComp =
        slots?.loader ?? Loader

      return (
        <button
          className={cn(
            className,
            buttonVariants({
              variant,
              size,
            })
          )}
          {...props}
        >
          {props.loading && (
            <LoaderComp
              className="mr-2 h-4 w-4 animate-spin"
            />
          )}

          {children}
        </button>
      )
    }
  )
```

---

## 6.2 Rule C3 — Optical Scale Conformance

Never use raw or arbitrary radius values.

Always use the token ramp:

```tsx
// ❌ Incorrect

<div className="rounded-[7px] p-4">
  ...
</div>

// ✅ Correct

<div className="rounded-macro p-4">
  {/* Outer container */}
  
  <div className="rounded-base p-3">
    {/* Inner card */}

    <button className="rounded-micro px-3">
      {/* Atom button */}

      <span className="rounded-atom px-1">
        New
      </span>

    </button>
  </div>
</div>
```

---

## 6.3 Rule C4 & C5 — Slots, SlotProps & Compound Sub-Components

```tsx
export const DateTimePicker =
  createInterfaceComponent<
    DateTimePickerProps,
    DateTimePickerSlots
  >(
    {
      name: 'DateTimePicker',

      props: {
        className:
          'w-full max-w-sm rounded-macro border border-border bg-popover',
      },

      slots: {
        header: DateTimePickerHeader,
        footer: DateTimePickerFooter,
      },
    },

    ({
      slots,
      slotProps,
      ...props
    }) => {
      const Header =
        slots?.header ??
        DateTimePickerHeader

      const Footer =
        slots?.footer ??
        DateTimePickerFooter

      return (
        <div className={props.className}>
          <Header
            {...slotProps?.header}
          />

          <DateTimePicker.Presets />

          <Footer
            {...slotProps?.footer}
          />
        </div>
      )
    }
  )

DateTimePicker.Presets = PresetsPane
DateTimePicker.DatePane = DatePane
```

---

# 7. Hook Authoring Rules

## 7.1 Type A — Utility Hooks

Utility hooks under `/hooks` must be:

* Standalone
* Context-free
* Adapter-driven

```tsx
export interface ClipboardOptions {
  timeout?: number

  /**
   * Custom platform writer.
   *
   * Examples:
   * - Electron bridge
   * - Native mobile clipboard
   */
  writeText?: (
    value: string
  ) => Promise<void>

  onCopy?: (
    text: string
  ) => void
}

export function useClipboard(
  options: ClipboardOptions = {}
) {
  const [copied, setCopied] =
    useState(false)

  const copy = async (
    text: string
  ) => {
    if (options.writeText) {
      await options.writeText(text)
    } else {
      await navigator.clipboard.writeText(
        text
      )
    }

    setCopied(true)

    options.onCopy?.(text)

    setTimeout(
      () => setCopied(false),
      options.timeout ?? 2000
    )
  }

  return {
    copy,
    copied,
  }
}
```

---

## 7.2 Type B — Headless UI Component Hooks

Headless component hooks must return:

```text
{
  state,
  actions,
  helpers,
  ariaProps
}
```

They must contain **zero markup**.

```tsx
export function useDateTimePicker(
  props: DateTimePickerProps
) {
  const [internalDate, setInternalDate] =
    useState<Date | null>(
      props.defaultValue ?? null
    )

  const date =
    props.value !== undefined
      ? props.value
      : internalDate

  const [tab, setTab] =
    useState<'date' | 'time'>('date')

  const setDate = (
    newDate: Date | null
  ) => {
    setInternalDate(newDate)
    props.onChange?.(newDate)
  }

  return {
    state: {
      date,
      tab,
      is24Hour: !!props.is24Hour,
    },

    actions: {
      setDate,
      setTab,
      clear: () => setDate(null),
    },

    helpers: {
      isValid:
        date !== null &&
        !isNaN(date.getTime()),
    },

    ariaProps: {
      role: 'dialog',
      'aria-label':
        props['aria-label'] ??
        'Choose date and time',
    },
  }
}
```

---

## 7.3 Type C — Engine Runtime Hooks

Engine runtime hooks must consume engine instances through `useSyncExternalStore`.

```tsx
export function useOverlay() {
  const engine =
    useContext(OverlayContext)

  if (!engine) {
    throw new Error(
      'useOverlay must be used within <OverlayProvider>'
    )
  }

  const state =
    useSyncExternalStore(
      (cb) => engine.subscribe(cb),
      () => engine.getState()
    )

  return {
    ...state,

    open:
      engine.open.bind(engine),

    close:
      engine.close.bind(engine),

    setSpotlight:
      engine.setSpotlight.bind(engine),
  }
}
```

---

# 8. Engine Authoring Rules

## 8.1 Rule ENG1 & ENG2 — Pure TypeScript Class & Event Emitter

Engines must contain **zero React imports**.

```ts
// src/engine/overlay/overlay-engine.ts

export class OverlayEngine {
  private isOpen = false

  private listeners =
    new Map<string, Set<Function>>()

  private subscribers =
    new Set<() => void>()

  public on(
    event: string,
    listener: Function
  ) {
    if (
      !this.listeners.has(event)
    ) {
      this.listeners.set(
        event,
        new Set()
      )
    }

    this.listeners
      .get(event)!
      .add(listener)

    return () =>
      this.listeners
        .get(event)!
        .delete(listener)
  }

  public emit(
    event: string,
    payload?: any
  ) {
    this.listeners
      .get(event)
      ?.forEach((fn) =>
        fn(payload)
      )
  }

  public subscribe(
    cb: () => void
  ) {
    this.subscribers.add(cb)

    return () =>
      this.subscribers.delete(cb)
  }

  public getState() {
    return {
      isOpen: this.isOpen,
    }
  }

  public open(target: string) {
    this.isOpen = true

    this.emit('open', {
      target,
    })

    this.subscribers
      .forEach((cb) => cb())
  }
}
```

---

## 8.2 Rule ENG3 & ENG4 — Engine Triad

Every engine package exports three things:

1. **Engine Class**

   * `OverlayEngine`

2. **React Provider & Hook**

   * `OverlayProvider`
   * `useOverlay()`

3. **Plugin Bundle**

   * `OverlayPlugin`

```tsx
// src/plugins/overlay-plugin.ts

export const OverlayPlugin:
  InterfacePlugin = {
    name: 'overlay',
    Provider: OverlayProvider,
  }
```

---

# 9. AST-Driven Registry Extraction & Live Documentation

Component source stays free of schema JSON. Metadata is extracted by a structured source scan (not the TypeScript Compiler API):

```text
src/registry/builder.ts     # scan + write JSON
src/registry/resolve.ts     # family lookup + slot occupant inference
npm run build:registry
```

The builder extracts:

* Prop types and JSDoc (follows exported `interface` `extends` / `Omit` across files)
* Slot shapes, payloads, `stateType`, and `defaultComponent`
* Slot occupants (`ComponentType<ButtonProps>` → `Button`; JSDoc / slot name when the type is `any`)
* Compound attachments (`Root.Member = Target`)
* Hook / engine / plugin / subpath summaries

---

## 9.1 Component Source

Component source code only defines essential human metadata:

```tsx
export const DateTimePicker =
  createInterfaceComponent<
    DateTimePickerProps,
    DateTimePickerSlots
  >(
    {
      name: 'DateTimePicker',

      category: 'form',

      description:
        'High-precision date and time picker with calendar matrix and momentum wheels.',

      props: {
        is24Hour: false,

        className:
          'rounded-macro border border-border bg-popover',
      },

      slots: {
        header:
          DateTimePickerHeader,

        footer:
          DateTimePickerFooter,
      },
    },

    renderFn
  )
```

---

## 9.2 AST Registry Extraction Pipeline

```text
┌──────────────────────────────────────────────────────────────┐
│ TypeScript source (export interface *Props / *Slots)         │
│ createInterfaceComponent + Root.Member = Target              │
└──────────────────────────────┬───────────────────────────────┘
                               │ structured scan
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ src/registry/builder.ts                                      │
│ - Cross-file interface catalog                               │
│ - Balanced-brace props / slots                               │
│ - inferResolvedSlotTarget → resolvesTo + nested payload      │
└──────────────────────────────┬───────────────────────────────┘
                               │ writes
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ src/registry/registry.json                                   │
│ src/registry/metadata-registry.json                          │
└──────────────────────────────┬───────────────────────────────┘
                               │ resolve.ts + demo
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Family tabs + collapsible slot tree                          │
│ (payload, variants, jump to resolved occupant)               │
└──────────────────────────────────────────────────────────────┘
```

`ComponentType<any>` cannot be followed unless JSDoc, `defaultComponent`, or the slot name names a registry component (e.g. `calendar` → `Calendar`). Author unions + JSDoc for dual occupants (`Calendar or RangeCalendar`).

---

## 9.3 Generated Registry Example

```json
{
  "name": "DateTimePicker",
  "category": "form",
  "description": "High-precision date and time picker with calendar matrix and momentum wheels.",
  "module": "@consona/interface/core",
  "semanticClass": "interface-date-time-picker",
  "dataComponent": "DateTimePicker",

  "props": {
    "value": {
      "type": "Date | null",
      "optional": true,
      "description": "Controlled date value"
    },

    "is24Hour": {
      "type": "boolean",
      "optional": true,
      "default": false,
      "description": "Enable 24-hour time format"
    },

    "className": {
      "type": "string",
      "optional": true,
      "description": "Tailwind classes for root container"
    }
  },

  "slots": {
    "content": {
      "type": "React.ComponentType<DateTimeContentProps>",
      "description": "Main internal composite picker panel slot.",
      "resolvesTo": "DateTimeContent"
    },
    "calendar": {
      "type": "React.ComponentType<any>",
      "description": "Date calendar view slot (Calendar or RangeCalendar).",
      "resolvesTo": "Calendar",
      "variants": ["Calendar", "RangeCalendar"]
    }
  },

  "attachments": {
    "Content": "DateTimeContent",
    "Wheel": "InteractiveTimeWheel"
  },

  "hook": {
    "name": "useDateTimePicker",

    "state": [
      "date",
      "time",
      "tab",
      "is24Hour",
      "isMobile"
    ],

    "actions": [
      "setDate",
      "setTime",
      "setTab",
      "snapMinute",
      "clear",
      "done"
    ]
  }
}
```

---

# 10. Modular Domain Architecture

To ensure:

* Tree-shaking
* Zero unused bundle bloat
* Clean domain boundaries
* Self-contained feature modules

the repository is organized around modular feature domains.

```text
interface/src/

├── modules/

│   ├── core/
│   │   ├── factory/
│   │   │   ├── createInterfaceComponent
│   │   │   ├── .extend()
│   │   │   └── slot resolver
│   │   │
│   │   ├── components/
│   │   │   ├── Button
│   │   │   ├── Input
│   │   │   ├── Modal
│   │   │   ├── Popover
│   │   │   ├── Card
│   │   │   └── Dropdown
│   │   │
│   │   ├── theme/
│   │   │   ├── optical scale tokens
│   │   │   └── styles.css
│   │   │
│   │   └── index.ts
│   │
│   ├── audio/
│   │   ├── engine/
│   │   │   ├── AudioEngine
│   │   │   ├── analyser
│   │   │   ├── recorder
│   │   │   └── storage
│   │   ├── hooks/
│   │   │   ├── useAudio
│   │   │   ├── useAudioDevices
│   │   │   └── useAudioAnalyser
│   │   ├── components/
│   │   │   ├── AudioPlayer
│   │   │   ├── VoiceWaveform
│   │   │   └── SoundMeter
│   │   ├── plugin.ts
│   │   └── index.ts
│   │
│   ├── orb/
│   │   ├── components/
│   │   │   ├── Orb
│   │   │   ├── OrbCanvas
│   │   │   └── Shaders
│   │   ├── hooks/
│   │   │   ├── useOrbPhysics
│   │   │   └── useShaderMaterial
│   │   └── index.ts
│   │
│   ├── glass/
│   │   ├── components/
│   │   │   ├── GlassCard
│   │   │   ├── GlassSurface
│   │   │   └── GlassPanel
│   │   ├── styles/
│   │   │   ├── backdrop filters
│   │   │   └── refraction shaders
│   │   └── index.ts
│   │
│   ├── overlay/
│   │   ├── engine/
│   │   │   ├── OverlayEngine
│   │   │   ├── geometry
│   │   │   ├── mask
│   │   │   └── tracker
│   │   ├── hooks/
│   │   │   ├── useOverlay
│   │   │   └── useSpotlight
│   │   ├── components/
│   │   │   ├── SpotlightOverlay
│   │   │   └── CutoutMask
│   │   ├── plugin.ts
│   │   └── index.ts
│   │
│   ├── onboarding/
│   │   ├── engine/
│   │   │   ├── OnboardingEngine
│   │   │   ├── storage
│   │   │   └── dom
│   │   ├── hooks/
│   │   │   ├── useOnboarding
│   │   │   ├── useTour
│   │   │   └── useChecklist
│   │   ├── components/
│   │   │   ├── TourPopover
│   │   │   ├── TourChecklist
│   │   │   └── StepBadge
│   │   ├── plugin.ts
│   │   └── index.ts
│   │
│   └── composites/
│       ├── orb-audio-player.tsx
│       ├── orb-audio-recorder.tsx
│       ├── voice-assistant.tsx
│       └── index.ts
│
├── provider/
│   ├── interface-provider.tsx
│   └── context.ts
│
├── registry/
│   ├── builder.ts
│   ├── resolve.ts
│   ├── types.ts
│   ├── registry.json
│   ├── metadata-registry.json
│   ├── loader.ts
│   └── index.ts
│
└── index.ts
```

---

## 10.1 Subpath Exports

```json
{
  "name": "@consona/interface",

  "exports": {
    ".": "./src/index.ts",
    "./audio": "./src/modules/audio/index.ts",
    "./orb": "./src/modules/orb/index.ts",
    "./glass": "./src/modules/glass/index.ts",
    "./overlay": "./src/modules/overlay/index.ts",
    "./onboarding": "./src/modules/onboarding/index.ts",
    "./composites": "./src/modules/composites/index.ts",
    "./registry": "./src/registry/index.ts"
  }
}
```

---

# 11. Generative AI & Streaming UI Synthesis Architecture

Consona Interface is structured to serve as an:

> **Autonomous UI Generation Engine for Generative AI Backends & Agents**

Traditional design systems can be difficult for LLMs because freeform JSX generation can produce:

* Hallucinated CSS classes
* Invalid props
* Invalid nesting
* Broken responsive layouts
* Inconsistent component composition

Consona addresses this through:

* Machine-readable schemas
* Slot patches
* Runtime `.extend()`
* Structured component manifests
* Headless state APIs

```text
┌──────────────────────────────────────────────────────────────┐
│ AI Agent / LLM Backend                                       │
│                                                              │
│ Streaming Token Stream                                       │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ Structured JSON
                               │ Component Patches
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Consona JSON Manifest & Slot Compiler                       │
│                                                              │
│ - Introspects Component.config schemas                        │
│ - Dynamically compiles .extend() variants                     │
│ - Injects slots without touching parent markup                │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Production-Grade UI                                          │
│                                                              │
│ - Concentric radii enforced                                  │
│ - Keyboard navigation intact                                 │
│ - Accessibility intact                                       │
│ - Headless state machines handle physics & math              │
└──────────────────────────────────────────────────────────────┘
```

---

## 11.1 Machine-Readable Component Schemas

Every component exposes a typed `ComponentConfig`.

AI systems can query the generated manifest and construct valid component trees:

```json
{
  "component": "DateTimePicker",

  "props": {
    "is24Hour": true,
    "className":
      "shadow-xl border-primary/20"
  },

  "slots": {
    "footer":
      "FlightBookingApprovalFooter"
  }
}
```

---

# 11.2 Streaming UI Through Patches

Instead of streaming hundreds of lines of brittle JSX, an AI can stream **micro-patches** targeting specific component slots.

### Patch 1 — Render Base Shell

```ts
uiStream.patch({
  component: 'Modal',
  props: {
    size: 'lg',
  },
})
```

### Patch 2 — Inject Analytics Pane

```ts
uiStream.patch({
  target: 'Modal.body',

  component: 'DataChart',

  props: {
    metric: 'daily_revenue',
    trend: '+28%',
  },
})
```

### Patch 3 — Inject Confirmation Action

```ts
uiStream.patch({
  target: 'Modal.footer',

  component: 'AIApprovalButton',

  props: {
    label: 'Approve Transaction',
    confidence: 0.98,
  },
})
```

### Patch 4 — Deep Path Patching

Nested slots can also be targeted:

```ts
uiStream.patch({
  target:
    'Modal.footer.action.loader',

  component:
    'GlowPulseLoader',

  props: {
    size: 'sm',
    intent: 'accent',
  },
})
```

This allows AI systems to modify deeply nested UI structures without rebuilding the entire parent tree.

---

# 11.3 Dynamic Assembly Through `.extend()`

An AI system can synthesize domain-specific component variants at runtime.

```tsx
const EmergencyDispatchPicker =
  DateTimePicker.extend({
    name:
      'EmergencyDispatchPicker',

    props: {
      is24Hour: true,

      className:
        'border-destructive bg-destructive/5',
    },

    slots: {
      footer:
        EmergencyDispatchFooter,
    },
  })
```

---

# 11.4 Mathematical Aesthetic Guardrails

Dynamic UI generation still follows the optical geometry system:

* Outer containers use `--radius-macro`.
* Nested cards use concentric `--radius-base`.
* Action buttons use `--radius-micro`.
* Badges and indicators use `--radius-atom`.
* Density scales through `--density-factor`.

This makes the design system's geometry rules part of the rendering substrate rather than relying entirely on AI-generated styling.

---

# 11.5 Headless State Hooks as AI Tools

AI agents can manipulate UI state programmatically through function calling rather than fragile DOM automation.

```ts
const tools = {
  setMeetingTime: async ({
    date,
    minuteSnap,
  }) => {
    pickerHook.actions.setDate(
      new Date(date)
    )

    pickerHook.actions.snapMinute(
      minuteSnap
    )

    return {
      success: true,

      formatted:
        pickerHook.helpers
          .formattedString,
    }
  },
}
```

---

# 12. Architectural Summary

Consona Interface provides:

1. **Harmonious Optical Geometry**

   * Macro/Base/Micro radius ramps
   * Concentric nested curves
   * Reduced corner clashes

2. **Global Density Scaling**

   * Single `--density-factor`
   * Compact, balanced, and spacious modes

3. **Clean, Isomorphic APIs**

   * Components are expressed through `props` and `slots`
   * `.extend({ name, props, slots })` uses the same model

4. **Deep Pre-Packaged Extensions**

   * Composite brand variants
   * Pre-baked sub-atoms
   * Pre-configured styles and props

5. **Infinite Customization**

   * Slot injection
   * Global component overrides
   * Headless component hooks
   * Engine extensibility
   * Plugin architecture

6. **Standardized Substrate**

   * Clear separation between:

     * Platform plumbing
     * UI components
     * Headless hooks
     * Pure engine classes

7. **AST-Driven Registry**

   * Machine-readable props, slots, and `resolvesTo` graphs
   * Live family tabs and collapsible slot trees
   * IDE / LLM-readable schemas (`npm run build:registry`)

8. **Generative AI Streaming Ready**

   * Structured UI manifests
   * Slot-level patches
   * Runtime component extensions
   * Programmatic headless state control

---

## Core Architectural Principle

> **Consona Interface is not merely a component library. It is a composable UI substrate where visual tokens, components, slots, headless logic, engines, plugins, registry metadata, and AI-generated UI operate on the same underlying architecture.**

```
```
