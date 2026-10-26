# Consona Interface Enhanced: Engineering Rules & Architecture Invariants

> **The Single Source of Truth for Code Organization, Engine Authoring, Hook Contracts, Component Factories, Slot Systems, Downstream Customization, and Provider Architecture.**

---

## 1. Directory Structure & File Placement Rules

Every file in `@consona/interface` must reside strictly in its designated domain directory. No ad-hoc, flat, or misplaced files are permitted.

```
src/
├── core/                               # 🧠 Micro-Kernel Platform Substrate
│   ├── component-factory.tsx           # createInterfaceComponent, .extend(), getComponent resolve
│   ├── slot-resolver.ts                # resolveSlots, mergeSlotProps, renderSlot
│   ├── size-context.tsx                # SizeProvider & useOpticalSize cascade
│   ├── cn.ts                           # cn, cx, mergeProps deep utility
│   ├── engine.ts                       # BaseEngine<TState> pure class with batching & attachStorage
│   ├── storage.ts                      # StorageAdapter, createPrefixStorageAdapter, createSafeJSONSerializer
│   ├── event-bus.ts                    # Wildcard event matching & isolated engine → provider bridge
│   ├── plugin.ts                       # InterfacePlugin contract & definePlugin()
│   ├── hooks.ts                        # useEngineState, useEngine, useControllableState
│   ├── provider.tsx                    # <InterfaceProvider /> root composer
│   ├── overlay-trigger.tsx             # OverlayTrigger, useOverlayDismiss, registerOverlaySurfaceSelector
│   ├── context.ts                      # useInterface() hook & createCompoundContext() factory
│   ├── types.ts                        # ComponentConfig, ComponentCategory, InterfaceComponent
│   └── index.ts                        # Substrate re-exports
│
├── theme/                              # 🎨 Visual Design System & Optical Geometry
│   ├── styles.css                      # Tailwind 4 engine, OKLCH colors, optical tokens
│   ├── tokens.ts                       # Preset configs, font definitions, token helpers
│   ├── theme-provider.tsx              # <ThemeProvider /> with dynamic CSS variables
│   └── index.ts
│
├── hooks/                              # 🪝 Universal Utility Hooks (Context-Free)
│   ├── use-clipboard.ts                # Clipboard hook with pluggable writer adapter
│   ├── use-is-mobile.ts                # Responsive viewport breakpoint detector
│   └── index.ts
│
├── modules/                            # 📦 Domain Modules (Subpath package exports)
│   ├── core/                           # Base UI Components & Atoms
│   │   ├── components/                 # Individual component folders
│   │   │   ├── <component-name>/       # e.g., button/, badge/, field/, sidebar/, slider/
│   │   │   │   ├── <name>.tsx          # Component definition with createInterfaceComponent
│   │   │   │   └── index.ts            # Local component barrel export
│   │   │   └── index.ts                # Re-exports all component folders
│   │   └── index.ts                    # Root module entrypoint
│   │
│   ├── audio/                          # 🎙️ Audio Engine & Visualizer Fleet
│   │   ├── engine/                     # AudioEngine.ts, recorder.ts, analyser.ts
│   │   ├── hooks/                      # useAudio.ts, useAudioDevices.ts
│   │   ├── components/                 # audio-player/, voice-waveform/, sound-meter/
│   │   ├── plugin.ts                   # AudioPlugin definition
│   │   └── index.ts                    # @consona/interface/audio entrypoint
│   │
│   ├── orb/                            # 🔮 WebGL 3D Canvas Orbs & Shaders
│   │   ├── engine/                     # OrbPhysicsEngine.ts, shader-pipeline.ts
│   │   ├── hooks/                      # useOrbPhysics.ts, useShaderMaterial.ts
│   │   ├── components/                 # orb-canvas/, orb-mesh/
│   │   ├── plugin.ts                   # OrbPlugin definition
│   │   └── index.ts                    # @consona/interface/orb entrypoint
│   │
│   ├── glass/                          # 🧊 Glassmorphism Physics & Container Effects
│   │   ├── components/                 # glass-card/, glass-surface/, glass-panel/
│   │   ├── styles/                     # Refraction shaders, backdrop tokens
│   │   └── index.ts                    # @consona/interface/glass entrypoint
│   │
│   ├── overlay/                        # 🎯 Spotlight & Geometry Cutout Engine
│   │   ├── engine/                     # OverlayEngine.ts, mask-geometry.ts
│   │   ├── hooks/                      # useOverlay.ts, useSpotlight.ts
│   │   ├── components/                 # spotlight-overlay/, cutout-mask/
│   │   ├── plugin.ts                   # OverlayPlugin definition
│   │   └── index.ts                    # @consona/interface/overlay entrypoint
│   │
│   ├── onboarding/                     # 🧭 Tour & Checklist Engine
│   │   ├── engine/                     # OnboardingEngine.ts, tour-storage.ts
│   │   ├── hooks/                      # useOnboarding.ts, useTour.ts, useChecklist.ts
│   │   ├── components/                 # tour-popover/, tour-checklist/, step-badge/
│   │   ├── plugin.ts                   # OnboardingPlugin definition
│   │   └── index.ts                    # @consona/interface/onboarding entrypoint
│   │
│   └── composites/                     # 🧩 Multi-Module Experiences & Mashups
│       ├── components/                 # orb-audio-player/, voice-assistant/
│       └── index.ts                    # @consona/interface/composites entrypoint
│
├── registry/                           # ⚡ Dynamic AST Registry System
│   ├── types.ts                        # RegistryDoc, ComponentDoc, HookDoc
│   ├── builder.ts                      # Structured source scan → JSON
│   ├── resolve.ts                      # Family lookup + slot occupant inference
│   ├── loader.ts                       # Dynamic JSON registry loader
│   ├── registry.json                   # Generated full AST registry
│   ├── metadata-registry.json          # Generated lightweight summary
│   └── index.ts
│
└── index.ts                            # 🌐 Main Package Entrypoint (@consona/interface)
```

Factory, theme, hooks, provider, and registry live at `src/core`, `src/theme`, `src/hooks`, `src/provider`, and `src/registry` — **not** inside `modules/core`. Domain folders (`audio`, `orb`, `glass`, `overlay`, `onboarding`, `composites`) may start as plugin scaffolds; they must still export a valid `index.ts` (and `plugin.ts` when the domain has an engine).

Streaming AI patch compilers (`uiStream.patch`) are a **future** product on top of this kernel. Do not add them to the substrate until the ladder below is complete.

---

## 1.1 Customization Precedence

When multiple customization layers apply, resolve in this order (later wins):

1. **Optical tokens** (`ThemeProvider` knobs + CSS variables)
2. **Definition-time `.extend({ props, slots })`**
3. **`<InterfaceProvider components />` then `plugin.components`** (plugin map wins on key collision)
4. **Per-instance `slots` / `slotProps`**
5. **Explicit JSX children** of compound families

Global `components={{ Button: AcmeButton }}` is resolved inside `createInterfaceComponent`. Replacements must be `.extend()` variants or complete stand-ins. **Do not** register a wrapper that renders the same `config.name` (that is a loop). A resolving-name guard blocks one level of recursion.

`<InterfaceProvider>` mounts at most one `ThemeProvider`. If a `ThemeProvider` already exists and `config.theme` is omitted, the existing theme is reused.

### Theme knobs (exactly four)

| Knob | Config key | Tokens | Values |
| :--- | :--- | :--- | :--- |
| Curvature | `radius` | `--radius`, `--radius-macro/base/micro/atom/inset` | `none` `sm` `md` `lg` `xl` |
| Density | `density` | `--density-factor`, `--space-*` | `compact` `normal` `spacious` |
| Elevation | `shadow` | `--shadow-*` via `color-mix` with `--fg` | `none` `subtle` `soft` `strong` |
| Stroke | `stroke` | `--border-width` | `flat` `standard` `bold` |

Shadows must use `color-mix(in oklab, var(--fg) …)` so they remain visible on dark surfaces. Do not use raw `rgb(0 0 0 / α)`.

---

## 2. Component Authoring Rules

### Rule C0: Reuse Interface First, Promote If Shared, Else RAC
When composing UI, do not reach for `react-aria-components` (or a one-off local widget) if `@consona/interface` already has the piece.

1. **Use what exists.** Prefer interface-enhanced components, slots, hooks, and kernel helpers (`Button`, `Popover`, `PopoverTrigger`, `OverlayTrigger`, `CollectionPopover`, `ScrollArea`, `useOverlayDismiss`, `useControllableState`, …). Same open/close, press, and optical contracts everywhere.
2. **Promote if it is general-purpose.** If it does not exist, and it can serve **more than one family** (not a single widget hack), and it can be a stable public primitive, **build it in interface-enhanced first** (kernel in `src/core/` or a module component), then use that. Calendar month/year lists use `CollectionPopover`, not a private `RACPopover`. Overlay press/dismiss lives in `overlay-trigger.tsx`, not in Clock or DateTimePicker.
3. **Otherwise import RAC.** Leaf RAC is allowed when the need is collection-internal, RAC-only (e.g. `ListBox` items inside `Select`), or truly local to one component and not worth a shared API.

Do not copy-paste a second portal, trigger, or dismiss path. Do not wrap a trigger in `Popover` — `Popover` is the surface; `OverlayTrigger` / `PopoverTrigger` is the host.

### Rule C1: The Mandatory Factory Wrapper
Every UI component **must** be created using `createInterfaceComponent<Props, Slots>(config, renderFn)`. Never export raw functional components directly.

```tsx
// ✅ CORRECT: Factory-wrapped with metadata, typed slots, and default props
export interface BadgeSlots {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  intent?: 'primary' | 'secondary' | 'accent' | 'danger' | 'warning' | 'success' | 'outline' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  slots?: SlotComponents<BadgeSlots>
  slotProps?: SlotPropsMap<BadgeSlots>
}

export const Badge = createInterfaceComponent<BadgeProps, BadgeSlots>(
  {
    name: 'Badge',
    category: 'feedback',
    description: 'Compact status badge indicator with optical geometry and semantic intent ramps.',
    version: '1.0.0',
    props: {
      intent: 'primary',
      size: 'md',
    },
    slots: {
      icon: undefined,
    },
  },
  BadgePrimitive
)
```

### Rule C2: Folder-per-Component Structure
Every component must live inside its own directory:
- Component file: `src/modules/<module>/components/<name>/<name>.tsx`
- Local index: `src/modules/<module>/components/<name>/index.ts` containing `export * from './<name>'`

### Rule C3: Downstream Customization & Symmetrical `.extend()`
Downstream design systems and consumer applications can customize any component in two primary ways:

#### 1. Definition-Time Specialization via `.extend()`
```tsx
// Create branded or specialized variants with overridden default props & slots
export const DangerBadge = Badge.extend({
  name: 'DangerBadge',
  props: {
    intent: 'danger',
    className: 'shadow-xs uppercase font-bold',
  },
  slots: {
    icon: AlertTriangleIcon,
  },
})
```

#### 2. Runtime Slot Injection & Overrides
```tsx
// Downstream consumers can swap internal sub-parts and pass slot props on the fly
<Button
  intent="primary"
  slots={{
    loader: CustomBrandedLoader,
    leftIcon: SparklesIcon,
  }}
  slotProps={{
    loader: { size: 'sm', className: 'text-amber-400' },
  }}
>
  Deploy Pipeline
</Button>
```

`.extend({ props, slots })` and per-instance `slots` / `slotProps` are production-ready **when** every addressed region also obeys **Rule C8** (fail-closed defaults, stable `defaultComponent`, compound `Root.Part` parity). A slot map without defaults is not customizable — it is fragile.
### Rule C4: Optical Scale & Spacing Conformance
Components **must never** use hardcoded, arbitrary pixels (`rounded-[7px]`, `p-[13px]`). Always use semantic optical tokens:

| Scale Token | Intended Usage | Formula |
| :--- | :--- | :--- |
| `rounded-macro` | Modals, Sheets, Popovers, Outer Cards, Sidebar Shells | `calc(var(--radius) * 1.5 * density)` |
| `rounded-base` | Buttons, Inputs, Select Triggers, Textareas | `calc(var(--radius) * 1.0 * density)` |
| `rounded-micro` | Badges, Date Cells, Preset Chips | `calc(var(--radius) * 0.75 * density)` |
| `rounded-atom` | Checkbox, Switch Toggles, Slider Thumbs, Kbd tags | `calc(var(--radius) * 0.4 * density)` |
| `rounded-full` | Circular badges, avatars, pill buttons | `9999px` |
| `rounded-soft-square` | Squircle avatars (`isSquare` / `shape="square"`) | `20%` (`--radius-soft-square`) |
| `rounded-inset` | Nested inner surfaces (concentric) | `max(2px, var(--radius-macro) - var(--space-md))` |
| `p-space-*` / `gap-space-*` | Density-aware spacing that must scale | `calc(base * var(--density-factor))` |

Padding/gaps that should respond to Density **must** use `p-space-*` / `gap-space-*` / `m-space-*`. Hardcoded `p-3` / `gap-2` will not compact. Tailwind `rounded-xl` and above alias to the optical ramp (never a 2.5×–3.5× explosion).

Composite parents that accept `size` automatically publish `SizeProvider`. Inner atoms read `useOpticalSize(sizeProp)` so `size="sm"` cascades without a prop drill.

### Rule C5: Explicit Slot Marking & State-Aware Variant Slots
For every component containing internal sub-elements (loaders, icons, thumb, track, header, footer, rail, output, searchbar):
1. **Define a dedicated Slots interface**: `export interface <Name>Slots { ... }`.
2. **State & Variant Typing**: Use `SlotDefinition<SlotState, Variants>` when slots adapt to parent state (e.g. `expanded` vs `collapsed` in `Sidebar` or `checked` vs `unchecked` in toggles).
3. **Include slot typing in Props**: `slots?: SlotComponents<<Name>Slots>; slotProps?: SlotPropsMap<<Name>Slots>;`.
4. **Pass both Props and Slots to the factory**: `createInterfaceComponent<<Name>Props, <Name>Slots>(config, renderFn)`.
5. **Render via `renderSlot` / `<RenderSlot />`**: In the primitive render function, dispatch slots via `renderSlot(slots.header, slotState, { activeVariant })`.
6. **`renderSlot` component detection**: `forwardRef`, `memo`, lazy, and InterfaceComponent objects are **components**, not variant maps. Variant maps are only plain objects without `$$typeof`. Never treat `Object.values(slot)[0]` of a `forwardRef` as a renderer (that value is `Symbol(react.forward_ref)` and React will silently drop it).

#### Symmetrical Slot Passing Modalities Supported Downstream:
- **Direct Component**: `slots={{ header: CustomHeader }}`
- **Render Function with State**: `slots={{ header: ({ isOpen, toggleSidebar }) => (isOpen ? <FullHeader /> : <MiniLogo />) }}`
- **Variant Object Map**: `slots={{ header: { expanded: ExpandedHeader, collapsed: CollapsedLogo }, search: { expanded: SearchInput, collapsed: SearchIconBtn } }}`

### Rule C5.0: Systematic Slot Surface (Downstream Control Budget)
Slots are the primary downstream control plane. **A larger, well-typed slot surface gives design systems more replacement points without forking the component.** We therefore prefer exposing more slots over baking internals into an opaque tree — *provided* the map is decided systematically, not incrementally or by taste.

A slot is an **injection address**: a named, typed, layout-stable region that downstream code can replace, decorate, or `.extend()`. More addresses ⇒ more control. An unplanned bag of slots ⇒ an unstable API and a broken AST inspector.

#### 1. Inventory before authoring
Before writing JSX, decompose the original anatomy (`interface/src/components/<name>/`) into a **region graph**. Every visually distinct, replaceable region becomes a candidate slot. Do not collapse two regions into one because the default occupant is small.

| Region class | Examples | Must be a slot? |
| :--- | :--- | :--- |
| **Chrome** | `header`, `body`, `footer`, `rail`, `aside` | Yes — structural landmarks |
| **Control atoms** | `icon`, `close`, `loader`, `clear`, `copy`, `trigger` | Yes — highest swap frequency |
| **Track / fill / thumb** | slider, progress, meter, rating | Yes — visual identity lives here |
| **Content wells** | `title`, `description`, `illustration`, `highlight`, `empty` | Yes — copy and media vary per product |
| **Affordance chrome** | `badge`, `kbd`, `shortcut`, `indicator` | Yes when the original renders one |
| **Private scaffolding** | anonymous wrappers used only for grid/flex | No — not a product extension point |

#### 2. Naming & cardinality contract
- **One slot ↔ one layout address.** `icon` is not `leftIcon` + `rightIcon` smashed together. If the original has leading and trailing icons, expose both.
- **Stable verbs/nouns:** `icon`, `close`, `copy`, `track`, `fill`, `thumb`, `label`, `value`, `illustration`, `actions`. Do not invent poetic keys (`sparkle`, `gadget`).
- **Family alignment:** a slot that is itself a public sub-atom (`ProgressTrack`, `SnippetCopyButton`) is typed as that atom’s props interface and attached on the family namespace (`Progress.Track`). The slot key and the sub-atom name must be reconcilable (`track` → `Track`).
- **No catch-all slots.** `children` is composition, not a substitute for named regions. `extra` / `misc` / `addon` are forbidden unless the original has a documented generic well.

#### 3. Prefer depth over opacity
If a default occupant has its own internals (e.g. `search` occupied by `Input`), expose the parent slot **and** rely on nested `slotProps` (C5.1) rather than hiding the child. Downstream must be able to replace the occupant *or* retarget its inner slots without rewriting the parent.

```tsx
// ✅ Systematic surface: parent address + child addresses
<Sidebar
  slots={{ search: Input, header: BrandHeader }}
  slotProps={{
    search: { slots: { leftIcon: SearchIcon, rightIcon: KbdShortcut } },
    header: { title: 'Acme', slots: { logo: AcmeMark } },
  }}
/>

// ❌ Opaque: one slot that paints the entire chrome; downstream must fork
slots={{ chrome: EntireCustomSidebarChrome }}
```

#### 4. Decision test (all four must pass to add a slot)
1. **Replaceability:** a downstream DS would reasonably swap this region without forking the file.
2. **Independence:** the region can render `null` or an alternate occupant without breaking siblings.
3. **Addressability:** it has a single DOM/layout locus (`data-slot="<key>"`) that does not move across variants.
4. **Typability:** it has a dedicated props interface (C5.2) and JSDoc (C7). If you cannot name the props, it is not a slot yet.

If a node fails the test, keep it as private markup. If it passes, **you must expose it** — omitting a valid slot reduces downstream control and forces forks. Density of slots is a feature; entropy of slots is a defect.

#### 5. Default occupants
Every slot ships a default occupant (or `undefined` when empty is valid). Defaults preserve the original UI/UX pixel-for-pixel. Downstream control is additive: omit `slots` and the product is indistinguishable from the stock component. Provide `slots` / `slotProps` / `.extend({ slots })` and only the addressed regions change.

**`slots.x = null`** means the region is intentionally hidden — do **not** fall back to `defaultComponent`. Missing / `undefined` slots **do** fall back.

### Rule C6: Component Family Architecture & Universal Sub-Component Wrapping
Every component family (e.g. `Button`, `Sidebar`, `Slider`, `Field`, `Switch`, `Checkbox`, `Radio`, `Input`, `Badge`, `Typography`) must follow the unified Component Family Architecture:

1. **Universal `createInterfaceComponent` Wrapping**:
   - Every sub-component and anatomy element (`ButtonGroup`, `ButtonWithIndicator`, `SidebarItem`, `SidebarHeader`, `SliderTrack`, `SliderThumb`, `FieldGroup`, `Label`, `SwitchButton`, etc.) **must** be created with `createInterfaceComponent<Props, Slots>(config, renderFn)`.
   - Raw functions or un-wrapped components are prohibited as public exports.
   - This ensures every single sub-component is individually extensible via `.extend()` by downstream design systems (`Sidebar.Item.extend(...)`, `ButtonGroup.extend(...)`).

2. **Compound Namespace Attachments**:
   - The root family component must expose all members as static properties for ergonomic compound usage:
   ```tsx
   Button.Group = ButtonGroup
   Button.Toggle = ToggleButton
   Button.WithIndicator = ButtonWithIndicator
   Sidebar.Header = SidebarHeader
   Sidebar.Item = SidebarItem
   Sidebar.Trigger = SidebarTrigger
   ```

3. **AST Metadata Indexing**:
   - The AST builder automatically extracts both the root family container and all wrapped sub-components into `registry.json` and `metadata-registry.json`.
   - Every member has its own typed `props` and `slots` definitions extracted from TypeScript AST.

4. **Documentation Hierarchy**:
   - In documentation navigation and registry index, only top-level family roots (`Button`, `Sidebar`, `Slider`, etc.) appear.
   - Inside the family documentation page, a member tab switcher plus a **collapsible slot tree** inspects props, payload, and nested occupants. Clicking `Resolves to <Name>` jumps to that member (or adds it as a temporary tab if it is outside the family).

### Rule C7: Mandatory JSDoc Documentation on Component Props & Slots
Every prop and slot property defined in TypeScript interfaces **must** include descriptive JSDoc comments (`/** ... */`):
1. **Prop Descriptions**: Clearly document the purpose, valid tokens/values, and behavioral effects of each prop.
2. **Slot Descriptions**: Document the injection target, render conditions, and layout location of each slot.
3. **AST Extraction**: The AST registry builder automatically extracts these comments and populates `description` fields in `registry.json` and `metadata-registry.json` for live rendering in API Reference tables and IDE hover tooltips.

```tsx
export interface LoaderProps extends Omit<React.ComponentPropsWithoutRef<'svg'>, 'display' | 'opacity'> {
  /** Visual animation style: discrete multi-bar 'spin' or continuous circle 'ring'. */
  variant?: keyof typeof LOADER_VARIANTS
  /** Size ramp token from xs (12px) to lg (20px). */
  size?: keyof typeof SIZE_CLASSES
  /** Current progress percentage (0-100) when running in deterministic mode. */
  percentage?: number
  /** Whether the loading state is indeterminate with continuous looping animation. */
  isIndeterminate?: boolean
}
```

```tsx
export interface SidebarSlotState {
  isOpen: boolean
  isCollapsed: boolean
  state: 'expanded' | 'collapsed'
  isMobile: boolean
  toggleSidebar: () => void
}

export interface SidebarSlots {
  header?: SlotDefinition<SidebarSlotState, 'expanded' | 'collapsed'>
  search?: SlotDefinition<SidebarSlotState, 'expanded' | 'collapsed'>
  content?: SlotDefinition<SidebarSlotState, 'expanded' | 'collapsed'>
  footer?: SlotDefinition<SidebarSlotState, 'expanded' | 'collapsed'>
  rail?: SlotDefinition<SidebarSlotState>
}
```
### Rule C5.1: Hierarchical & Nested Slots ("Slots of Slots")
When a container or composite component (`Sidebar`, `Modal`, `DataTable`, `Field`, `AudioPlayer`) defines a slot whose occupant is itself an Interface Component with internal slots (e.g. `Sidebar.search` occupied by `Input` with `leftIcon` and `rightIcon`):

1. **Passthrough via Nested `slotProps`**:
   Consumers can configure nested child slots through the parent `slotProps` without rewriting the component tree:
   ```tsx
   <Sidebar
     slots={{ search: Input }}
     slotProps={{
       search: {
         placeholder: 'Search docs...',
         slots: { leftIcon: CommandIcon },
         slotProps: { leftIcon: { className: 'text-primary' } },
       },
     }}
   />
   ```

2. **Compositional Sub-Tree Render Functions**:
   Consumers can customize nested slots conditionally based on parent slot state:
   ```tsx
   <Sidebar
     slots={{
       header: ({ isOpen }) => (
         <HeaderShell>
           <Badge intent="primary" slots={{ icon: SparklesIcon }}>
             {isOpen ? 'Enterprise V2' : 'V2'}
           </Badge>
         </HeaderShell>
       ),
     }}
   />
   ```

3. **Chained Definition-Time Specialization via `.extend()`**:
   ```tsx
   const BrandedSearch = Input.extend({
     props: { placeholder: 'Search...' },
     slots: { leftIcon: SearchIcon, rightIcon: KbdShortcut },
   })

   const BrandedSidebar = Sidebar.extend({
     slots: { search: BrandedSearch },
   })
   ```

### Rule C5.2: Mandatory Organized & Explicit Slot Props Typing
Every component defining customizable slots **must** describe the props payload of every slot in an organized, strongly-typed manner:

1. **No Untyped `any`**:
   Never define a slot as `slot?: React.ComponentType<any>` or `SlotDefinition<any>`. Always specify the exact props interface accepted by the slot component or passed into render functions.

2. **Dedicated Slot Props Interfaces**:
   When slots accept props or inherit ambient state, define explicit interfaces:
   ```tsx
   export interface SidebarHeaderSlotProps extends SidebarSlotState {
     title?: string
     subtitle?: string
     showLogo?: boolean
   }

   export interface SidebarSearchSlotProps extends SidebarSlotState {
     placeholder?: string
     shortcut?: string
     query?: string
     onSearch?: (value: string) => void
   }
   ```

3. **Sub-Atom Component Props Binding**:
   When slots correspond to internal sub-atoms (e.g. `SliderTrack`, `Loader`, `Label`), type the slot with the exported sub-atom props interface:
   ```tsx
   export interface SliderSlots {
     track?: React.ComponentType<SliderTrackProps>
     thumb?: React.ComponentType<SliderThumbProps>
     fill?: React.ComponentType<SliderFillProps>
     output?: React.ComponentType<SliderOutputProps>
   }
   ```

4. **AST Registry Compatibility Guarantee**:
   The builder extracts slot occupants from `ComponentType<FooProps>` → registry component `Foo`, then walks `Foo.slots` for the docs tree. `ComponentType<any>` **cannot** be followed. If a slot has two legal occupants, type a union (`CalendarProps | RangeCalendarProps`) and name both in JSDoc (`Calendar or RangeCalendar`). The inspector uses the first resolvable name as the default branch and lists the rest as variants.

5. **Inline intersection state is allowed, but keep it on one line or use `SlotDefinition`**:
   `React.ComponentType<React.SVGProps<SVGSVGElement> & { state?: ButtonState }>` is extracted (balanced braces). Prefer `SlotDefinition<ButtonState>` when the slot is state-aware so `stateType` is first-class.

### Rule C6: Compound Components & Ambient State Sub-Trees
When a component is composed of multiple coordinated elements sharing state (e.g. `DataTable`, `Sidebar`, `AudioSourcePicker`, `TranscriptViewer`):
- **Ambient Context Factory**: Use `createCompoundContext<TContextValue>('RootName')` from `src/core/context.ts` to instantiate a typed, fail-closed React Context with standardized developer error messages (`"<Root.Part> must be rendered within a <Root>"`).
- **Sub-Component Attachment & Named Exports**: Export sub-components individually (`DataTableHeader`, `DataTableBody`, `DataTableRow`) and attach them to the parent (`DataTable.Header = DataTableHeader`).
- **Render-Prop & Dual-Mode Support**: When wrapping stateful primitives, support both direct JSX children and render props (`({ state, actions }) => ReactNode`).

### Rule C8: Fail-Closed Defaults & Compound Composition
Product UI must support **both** customization axes — and must **never throw** when the consumer omits structure:

| Axis | Purpose | API |
| :--- | :--- | :--- |
| **Slots / `.extend()` / `slotProps`** | Look, baked variants, deep overrides | `slots`, `slotProps`, `Root.extend({…})` |
| **Compound JSX** | Layout / which parts appear | `<Root><Root.Header/>…</Root>` |

`modules/composites/` is for **cross-module mashups** only. Compound `Root.Part` APIs live on the core family (e.g. `Calendar.Header`) — not under composites.

#### 1. Parts = slots = attachments (one source of truth)
Every structural region is a `createInterfaceComponent` part. That same part is:
- the slot `defaultComponent`,
- attached as `Root.Part`,
- usable alone under the root’s RAC/state context.

Do not invent a private Header for defaults and a different public `Root.Header`.

#### 2. `children` OR default tree — never neither, never crash
```tsx
// Root (and any region that owns chrome)
{children != null ? children : (
  <>
    {renderSlot(slots.header, slotProps.header, { defaultComponent: WidgetHeader })}
    {renderSlot(slots.body, slotProps.body, { defaultComponent: WidgetBody })}
  </>
)}
```
- `children` provided → compose mode; skip that region’s default chrome.
- `children` omitted → full default tree (accessible, labelled, interactive).

#### 3. Render-prop hosts must ship a default function
If the underlying library expects `children` to be a **function** (RAC month/year pickers, grid body, etc.), the Interface part **must** supply a complete default render prop when `children` is omitted. Shipping `<Part />` that forwards `undefined` into a render-prop host is a production defect.

#### 4. Stable `defaultComponent` references
```tsx
{ defaultComponent: WidgetBody }            // required
{ defaultComponent: () => <WidgetBody /> }  // forbidden — remount / max-update-depth loops
```
Pass extra props through `renderSlot`’s props argument, not an inline wrapper component.

#### 5. Never-fail / UX contract
| Input | Required behavior |
| :--- | :--- |
| No `children`, no `slots` | Stock UI — complete and keyboard-accessible |
| Invalid / empty value | Safe empty state — no throw, no infinite updates |
| Missing context for a part | Degrade (disabled / `null`) — no throw |
| Same controlled value re-emitted | Early-return — no feedback loops |
| Unstable date/identity props | Canonicalize / stabilize before RAC (`canonicalDate`, `useStableDateValue`, …) |

Default interaction must feel smooth: press targets work, focus rings visible, overlays dismiss cleanly, and selection/update paths are idempotent. Robustness is part of the UX, not an afterthought.

#### 6. Definition of done (every new/hardened family)
- [ ] Zero-children root renders full default UI  
- [ ] Full `Root.Part` tree works  
- [ ] Every attached part works with zero children / no render prop  
- [ ] Region chrome honors `children` when provided  
- [ ] Slots and attachments share the same part components  
- [ ] No inline `defaultComponent` lambdas  
- [ ] Docs: default + compound (+ optional slots/`.extend`) examples  

Calendar is the reference implementation for this rule.

---

## 3. Pure Engine Architecture Rules (The Engine Triad)

For feature domains requiring state machines, persistent storage, audio pipelines, WebGL loops, or DOM geometry tracking (e.g. `audio`, `orb`, `overlay`, `onboarding`):

```
┌────────────────────────────────────────────────────────┐
│  1. Pure TypeScript Engine Class (Framework-Agnostic)  │
│     class AudioEngine extends BaseEngine<AudioState>   │
├────────────────────────────────────────────────────────┤
│  2. React Binding (Provider + Engine Hook)             │
│     function AudioProvider({ children, engine })       │
│     function useAudio()                                │
├────────────────────────────────────────────────────────┤
│  3. Pluggable Plugin Bundle                            │
│     export const AudioPlugin: InterfacePlugin          │
│     definePlugin({ ... })                              │
└────────────────────────────────────────────────────────┘
```

### Rule ENG1: Zero React in Pure Engine Classes
The core engine class must be 100% pure TypeScript. It must **never** import `react` or `react-dom`.
- Inherit from `BaseEngine<TState>` in `src/core/engine.ts`.
- Encapsulate private state, public getters, event emitting (`this.emit('event', data)`), and state updates (`this.setState({ ... })`).

```ts
// src/modules/audio/engine/audio-engine.ts
import { BaseEngine } from '../../../core/engine'

export interface AudioState {
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
}

export class AudioEngine extends BaseEngine<AudioState> {
  constructor(initialState?: Partial<AudioState>) {
    super({
      isPlaying: false,
      volume: 1,
      currentTime: 0,
      duration: 0,
      ...initialState,
    })
  }

  public play() {
    this.setState({ isPlaying: true })
    this.emit('play', { timestamp: Date.now() })
  }

  public stop() {
    this.setState({ isPlaying: false, currentTime: 0 })
    this.emit('stop')
  }
}
```

- **Batching High-Frequency State Mutations**: Use `this.batch(() => { ... })` to bundle multiple rapid updates (e.g. streaming audio FFT, WebGL physics ticks, GIS Map coordinate stream) into a single subscriber notification cycle, avoiding React rendering bottlenecks.

### Rule ENG2: Pluggable Storage & Driver Adapters
Never hardcode `localStorage` or `sessionStorage` inside engines. Inject storage adapters through constructor options:

- **Declarative Storage Binding**: Use `this.attachStorage({ adapter, key, stateKeys, serialize, deserialize })` inside the engine constructor to automatically hydrate initial state and sync state mutations without boilerplate.
- **Namespace Isolation**: Use `createPrefixStorageAdapter('consona:<domain>:', adapter)` to prevent key collisions in shared storage.
- **Safe Serialization**: Use `createSafeJSONSerializer(defaultValue)` to guard against corrupted or invalid storage data.

```ts
export interface StorageAdapter {
  getItem: (key: string) => string | null | Promise<string | null>
  setItem: (key: string, value: string) => void | Promise<void>
  removeItem?: (key: string) => void | Promise<void>
}
```

---

## 4. Hook Architecture & Taxonomy Rules

Consona Interface distinguishes between **3 distinct types of hooks**:

### Type A: Universal Utility Hooks (`src/hooks/`)
- **Rules**:
  1. Must be completely independent of React Context or Providers.
  2. Must accept an `options` adapter object for custom native platform bridging (e.g., Electron, React Native, custom timeout).
  3. Must reside in `src/hooks/use-<name>.ts`.

```tsx
// src/hooks/use-clipboard.ts
export interface UseClipboardOptions {
  timeout?: number
  writeText?: (text: string) => Promise<void>
  onCopy?: (text: string) => void
}

export function useClipboard(options: UseClipboardOptions = {}) {
  // Standalone, adapter-driven logic
}
```

### Type B: Headless UI Component Hooks (`src/modules/<module>/hooks/`)
- **Rules**:
  1. Pure accessibility, math, and interaction state for complex UI controls (e.g., `useDateTimePicker`, `useTimeWheel`).
  2. Must render **zero JSX**.
  3. Must strictly return the **4-part signature contract**:
     ```ts
     return {
       state: { ... },    // Reactive values (isOpen, activeTab, selectedValue)
       actions: { ... },  // State mutators (setOpen, select, reset)
       helpers: { ... },  // Derived calculations (formattedString, isValid)
       ariaProps: { ... } // Accessibility attributes to spread on elements
     }
     ```

### Type C: Engine Runtime Hooks (`use<Engine>()`)
- **Rules**:
  1. Must bind to an active `EngineContext` in the React tree.
  2. Must use `useEngineState(engine)` (which leverages `useSyncExternalStore`) to guarantee **zero-tearing** and optimal render performance.
  3. Re-expose engine state and bound action methods.

```tsx
export function useAudio() {
  const engine = useContext(AudioContext)
  if (!engine) throw new Error('useAudio must be used within <AudioProvider>')
  
  const state = useEngineState(engine)

  return {
    ...state,
    play: () => engine.play(),
    stop: () => engine.stop(),
    setVolume: (v: number) => engine.setVolume(v),
    engine, // Expose raw engine for custom listeners
  }
}
```

---

## 5. Provider & Plugin Architecture Rules

### When to Create a Dedicated Provider vs Using `<InterfaceProvider />`

| Scenario | Architectural Choice | Location |
| :--- | :--- | :--- |
| **Atomic UI Component** (`Button`, `Badge`, `Field`, `Separator`) | **No Provider Needed**. Consumes props & global `<InterfaceProvider />` overrides. | `src/modules/core/components/<name>/` |
| **Compound Sub-Components sharing state** (`Sidebar`, `Tabs`, `Accordion`, `Menu`) | **Lightweight Context Provider** internal to the component folder. | `src/modules/core/components/<name>/` (`<name>.tsx` or `context.ts`) |
| **Domain Engine** (`Audio`, `Onboarding`, `Overlay`, `Orb`) | **Full Engine Provider & Plugin**. Wraps engine instance, lifecycle, and plugin registration. | `src/modules/<domain>/` |

### The Plugin Bundle Pattern
Every domain engine exports an `InterfacePlugin` object using `definePlugin()`:

```tsx
// src/modules/audio/plugin.ts
import { definePlugin } from '../../core/plugin'
import { AudioProvider } from './context'
import { VoiceWaveform } from './components/voice-waveform'

export const AudioPlugin = definePlugin({
  name: 'audio',
  version: '1.0.0',
  Provider: AudioProvider,
  components: {
    VoiceWaveform,
  },
})
```

Downstream consumers can register plugins cleanly:
```tsx
<InterfaceProvider
  plugins={[AudioPlugin, OnboardingPlugin]}
  config={{
    events: {
      '*:error': ({ error }) => console.error(error),
      'onboarding:stepChange': ({ stepId }) => {},
    },
  }}
>
  <App />
</InterfaceProvider>
```

`BaseEngine.emit` always forwards to `<InterfaceProvider emit />` through `event-bus`. Listener keys may be exact (`onboarding:stepChange`) or wildcards (`*`, `domain:*`, `*:error`). Returning `false` from a listener stops later listeners. Plugin `options` are passed through to `plugin.Provider`.

---

## 6. AST Registry Invariants & Code Hygiene

The demo API tables and slot tree are generated. If `registry.json` is stale, the docs lie. Treat a registry rebuild as part of the change, not a later chore.

1. **No hand-written per-component schema JSON.** `src/registry/builder.ts` is the only writer of `registry.json` and `metadata-registry.json`. Edit source interfaces; never patch the JSON.

2. **Parser contract (the builder will not see anything else):**
   - Props: `export interface <Name>Props` (not `type <Name>Props = { ... }`).
   - Slots: `export interface <Name>Slots`.
   - Factory: `export const <Name> = createInterfaceComponent<<Name>Props, <Name>Slots>(...)`.
   - Family attachments: `Root.Member = Target` (e.g. `Calendar.Header = CalendarHeader`). The builder indexes both the short key (`Header`) and the canonical name (`CalendarHeader`).

3. **What the builder actually resolves today** (structured scan, not `tsc`):
   - Cross-file `export interface` catalog — `DateTimePickerProps extends DateTimeContentProps` and `Omit<FooProps, 'slots'>` **are** followed when `FooProps` is an exported interface somewhere under `src/`.
   - Slot occupants: `ComponentType<ButtonProps>` → `Button`; then `Button.slots` become nested tree nodes.
   - Slot `props` are a **delta** over the occupant. Merge at read time: `{ ...target.props, ...slot.props }`.
   - `registry.graph` is the edge list (`DateTime.calendar → Calendar`). Do not duplicate occupant props into the graph.
   - Fallback when the type is unreadable (`any`, SVG/HTML attrs): `renderSlot(..., { defaultComponent: X })`, PascalCase slot name (`calendar` → `Calendar`), then capitalized identifiers in the slot JSDoc.
   - Slot interfaces that `extends` another `*Slots` interface inherit those members.
   - Inline `{ ... }` in a slot type must use **balanced braces**. A greedy `}` cut used to drop every slot after `leftIcon?: ... & { state?: ButtonState }`.

   Still invisible to the builder: RAC/`React.*` utility types, `VariantProps<typeof styles>`, and anything that is only a `type` alias. Put product props on the exported `interface`.

4. **Human metadata** on `createInterfaceComponent`: `name`, `category`, `description`, `version`, default `props` / `slots`.

5. **Docs / family lookup contract** (`src/registry/resolve.ts`):
   - Resolve by export name, attachment key, dotted name (`Calendar.Header`), or slug.
   - `listFamilyMembers` includes the root, attachments, explicit doc `subcomponents`, and first-level `resolvesTo` targets.
   - `inferResolvedSlotTarget` is the single resolver used by the builder **and** the demo tree. Do not invent a second mapping in the view.

6. **After any props/slots/`Attach`/JSDoc change:**
   ```bash
   cd interface-enhanced
   npm run type-check
   npm run build:registry
   ```
   Then reload the demo page (JSON is imported statically). Confirm the changed family: props count, every slot has a payload or an explicit reason it cannot (native SVG/HTML), and the tree reaches the leaf occupants.

7. **Runtime pitfalls the registry cannot catch (still authoring rules):**
   - Do not pass `defaultComponent: () => <Panel />` — a new type each render remounts the subtree (see **Rule C8**). Use a stable component reference.
   - RAC collections (`Select` / `ListBox`) need `items` on the collection root or they render “Select an item” with an empty list.
   - Overlay contract: `OverlayTrigger` is only the host (Pressable first child + RAC DialogTrigger). `Popover` is only the surface. `CollectionPopover` is the Dialog-free surface for RAC `Select` / `ListBox`. Popover defaults `isNonModal` so the page stays live; `useOverlayDismiss` closes via overlay trigger state. Do not use `Popover` as the trigger wrapper. Reuse these (C0) instead of new RAC overlay wiring.
   - `DialogTrigger` / `PressResponder` cannot wrap a second native `<button>` (clear control must not be a nested button).
   - Thin RAC pass-through parts without a default render prop will throw when used as `<Root.Part />` with no children (**Rule C8**).

---

## 7. Interface Registrar & AI Agent Query Engine

The **Consona Interface Registrar** (`src/registry/registrar.ts`) provides a high-density, token-efficient query engine for AI coding agents and developers to inspect components, slots, compound subcomponents, hooks, engines, providers, plugins, types, and raw source code with **zero hallucination** and **zero context window bloating**.

### CLI Query Interface (`npm run registrar`)

```bash
# Universal auto-resolving inspection
npm run registrar -- --inspect <EntityName> [--json]

# Direct source code & filesystem lookup
npm run registrar -- --code <EntityName> [--json]
npm run registrar -- --filePath <EntityName> [--json]

# Specialized entity inspection
npm run registrar -- --props <ComponentName> [--json]
npm run registrar -- --slots <ComponentName> [--json]
npm run registrar -- --composites <ComponentName> [--json]
npm run registrar -- --engine <EngineName> [--json]
npm run registrar -- --hook <HookName> [--json]
npm run registrar -- --provider <ProviderName> [--json]
npm run registrar -- --plugin <PluginName> [--json]
npm run registrar -- --type <TypeName> [--json]
npm run registrar -- --module <ModuleName> [--json]

# Token-dense AI agent context slicing (<1,500 tokens vs 1.2M tokens)
npm run registrar -- --context <Symbol1> <Symbol2> ... [--json]

# Full root catalog export
npm run registrar -- --catalog [--json|--md] [--out <filePath>]
```

### Programmatic SDK Interface (`InterfaceRegistrar`)

```ts
import { registrar } from '@consona/interface/registry'

// 1. Universal inspection
const spec = registrar.inspect('MapEngine', { format: 'json' })

// 2. Fetch exact source code on disk
const code = registrar.getCode('DataTable')

// 3. Inspect component slot injection surface
const slots = registrar.inspectSlots('DataTable')

// 4. Generate AI Agent prompt context slice
const agentContext = registrar.generateAgentContext(['DataTable', 'MapEngine', 'useAudio'])
```


