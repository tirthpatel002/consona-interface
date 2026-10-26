# Interface Enhancements — Composition & Robustness

> **Canonical authoring rules now live in [`RULES.md`](./RULES.md) → Rule C8 (Fail-Closed Defaults & Compound Composition), plus C3 / C5–C5.2 / C6.**  
> This file keeps the discovery narrative and the migration backlog. Do not invent a second contract here — update RULES when the bar changes.

## Finding

Interface components today are strong at **slots + `.extend()`** (replace pieces, bake a look). They are **not yet consistently strong** at **compound composition** — the JSX tree pattern downstream expects:

```tsx
<Calendar>
  <Calendar.Header>
    <Calendar.MonthPicker />
    <Calendar.YearPicker />
    <Calendar.NavButton slot="previous" />
    <Calendar.NavButton slot="next" />
  </Calendar.Header>
  <Calendar.Grid>
    <Calendar.GridHeader>
      {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
    </Calendar.GridHeader>
    <Calendar.GridBody>
      {(date) => <Calendar.Cell date={date} />}
    </Calendar.GridBody>
  </Calendar.Grid>
</Calendar>
```

Calendar was the first surface brought to this bar. Gaps that showed up (and will show up elsewhere):

| Failure mode | Example | Fix |
|---|---|---|
| Sub-part is a thin RAC pass-through | `<Calendar.MonthPicker />` with no children | RAC called `children` as a function → crash |
| Parent ignores `children` | `Calendar.Header` always rendered pickers/nav | Compound trees could not rearrange chrome |
| Missing compound attachments | No `Heading` / `NavButton` / `HeaderCell` | Downstream had no stable named parts |
| Defaults only inside one parent | Picker UI lived only inside Header | Standalone part was unusable |

**Conclusion:** every `createInterfaceComponent` that is meant for product UI must support **both**:

1. **Slots / `.extend()`** — programmatic / design-system overrides  
2. **Compound composition** — declarative JSX trees with `Root.Part` attachments  

…and must be **fail-closed with defaults**: omitting children or slots never throws; it falls back to a complete, accessible default tree.

`modules/composites/` remains for **cross-module mashups** (e.g. Field + Chart + Overlay). Compound `Root.Part` APIs live on the core component itself — not in composites.

---

## Two customization axes (keep both)

```
Downstream
├── Compound JSX          → layout / structure / which parts appear
│     <Root><Root.Header/>…
└── slots + .extend()     → look / baked variants / deep overrides
      Root.extend({ slots, props })
```

Rules of thumb:

- Prefer **compound children** when the consumer is assembling structure.
- Prefer **slots / `.extend()`** when the consumer is specializing chrome without rewriting the tree.
- When `children` is provided on a region that owns a default layout, **honor children and skip the default chrome** for that region.
- When `children` is omitted, **always render the full default** for that region.

---

## How to make any Interface component composition-ready

Use this checklist when authoring or hardening a component.

### 1. Split into named parts

Extract every meaningful region into its own `createInterfaceComponent`:

- Prefer names that match the region: `Header`, `Body`, `Trigger`, `Content`, `Cell`, …
- Each part must be usable **alone under the root context** (RAC/state context), not only as an internal helper.

### 2. Attach parts on the root

```ts
export const Widget = createInterfaceComponent({ name: 'Widget', … }, WidgetPrimitive)

Widget.Header = WidgetHeader
Widget.Body = WidgetBody
Widget.Cell = WidgetCell
// mirror on related roots (e.g. RangeCalendar) when they share parts
```

`InterfaceComponent` already allows `[key: string]: any` for attachments. Keep attachments stable — do not rename casually.

### 3. Root: `children` OR default tree

```tsx
function WidgetInner({ children, slots, slotProps }) {
  return (
    <>
      {children ?? (
        <>
          {renderSlot(slots.header, …, { defaultComponent: WidgetHeader })}
          {renderSlot(slots.body, …, { defaultComponent: WidgetBody })}
        </>
      )}
    </>
  )
}
```

- `children` present → compose mode (no default regions).  
- `children` absent → slot defaults (which themselves have robust internals).

### 4. Region parents: honor `children` too

If `Widget.Header` has its own default chrome (title + actions):

```tsx
function WidgetHeaderPrimitive({ children, className, … }) {
  if (children != null) {
    return <header className={…}>{children}</header>
  }
  // default chrome…
}
```

Same pattern for `Grid`, `Footer`, `Overlay`, etc.

### 5. Parts that wrap render-prop libraries — ship defaults

Anything whose underlying API expects `children` to be a **function** (RAC pickers, grid headers/bodies, etc.) **must** supply a default render prop when `children` is omitted:

```tsx
function MonthPickerPrimitive({ children, … }) {
  const defaultChildren = ({ items, …pickerProps }) => (
    /* complete Select UI */
  )
  return (
    <RACMonthPicker>
      {children ?? defaultChildren}
    </RACMonthPicker>
  )
}
```

**Never** ship `<Part />` that only forwards `undefined` children into a render-prop host.

### 6. Stable component types in slots

`renderSlot(..., { defaultComponent: () => <X /> })` creates a **new component type every render** → remount loops / max update depth.

Always pass a **stable** reference:

```tsx
{ defaultComponent: WidgetBody }           // good
{ defaultComponent: () => <WidgetBody /> } // forbidden
```

If you need to inject props, put them in the `props` argument to `renderSlot`, not in an inline wrapper component.

### 7. Wire slots and compound parts to the same primitives

Slots should resolve to the **same** components attached as compound parts:

```ts
slots: {
  header?: ComponentType<WidgetHeaderProps>
  cell?: ComponentType<WidgetCellProps>
}
```

Default slot = `WidgetHeader` / `WidgetCell`. Downstream can override via `slots` **or** compose via `Widget.Header` / `Widget.Cell`. One source of truth.

### 8. Document both paths

Every doc that owns a compound-capable root should include:

1. Default usage (no children).  
2. Compound tree example with controlled value + bounds when relevant.  
3. Optional `.extend()` / slots example for look specialization.

---

## Robustness contract (never fail)

Every Interface component and part must obey:

### Defaults always exist

| Input | Behavior |
|---|---|
| No `children` | Full default tree |
| No `slots.*` | `defaultComponent` for that region |
| `slots.x = null` | Region opted out (explicit hide) — do not fall back |
| Empty / invalid value | Safe empty UI, not throw |
| Missing render prop | Built-in default render prop |

### Guard data paths

- Canonicalize dates/times before compare / pass to RAC (`canonicalDate`, `sameDate`, …).  
- Early-return on same value to avoid update loops.  
- Stabilize identity for `minValue` / `maxValue` / `focusedValue` when objects are recreated each render (`useStableDateValue`, etc.).

### Guard render paths

- No inline `defaultComponent` factories.  
- No hooks inside playground `render()` callbacks unless mounted as components (docs harness already mounts them as components).  
- Compound parts that need root state must read context and degrade gracefully if context is missing (disabled controls, `null` UI) — not throw.

### Accessibility defaults

Default trees must remain keyboard-accessible and labelled even when the consumer only writes `<Root aria-label="…" />`.

### Type safety for composition

- Export part props types.  
- Prefer explicit render-prop parameter types in docs (`(day: string)`, `(date: DateValue)`).  
- Avoid exporting type names that collide with component values (`DateLike` vs `DateInput` component).

---

## Priority backlog (apply this checklist)

Bring these to Calendar’s composition bar next (order ≈ user impact):

1. **DatePicker / DateRangePicker** — `Trigger`, `Overlay`, `Input`, calendar parts composable  
2. **DateTime / DateTimePicker / DateTimeContent** — trigger, content regions, footer, presets, tabs as true compound parts with defaults  
3. **TimeField / TimeWheel** — input / segments / columns as attachable parts with defaults  
4. **Field family** (Email, Password, Phone, Username, OTP) — label / control / description / error / adornments composable  
5. **Dialog / Modal / Popover / Overlay** — trigger + content + close as compound with safe defaults  
6. **DataTable / Tree / GridList** — header / body / row / cell composition  

For each: attach parts, honor `children` on regions, default render props, stable slot defaults, doc example.

---

## Authoring template (copy when adding a new compound root)

```tsx
/* Parts */
export const WidgetHeader = createInterfaceComponent(/* … */, ({ children, … }) =>
  children != null ? <header>{children}</header> : /* default chrome */
)

export const WidgetBody = createInterfaceComponent(/* … */, (props) => /* always complete */)

/* Root */
const WidgetPrimitive = ({ children, slots = {}, slotProps = {}, … }) => (
  <RacRoot>
    {children ?? (
      <>
        {renderSlot(slots.header, slotProps.header, { defaultComponent: WidgetHeader })}
        {renderSlot(slots.body, slotProps.body, { defaultComponent: WidgetBody })}
      </>
    )}
  </RacRoot>
)

export const Widget = createInterfaceComponent({ name: 'Widget', … }, WidgetPrimitive)
Widget.Header = WidgetHeader
Widget.Body = WidgetBody
```

---

## Definition of done (per component)

- [ ] Root works with **zero children** (full default UI).  
- [ ] Root works with a **full compound tree** of `Root.Part`s.  
- [ ] Every attached part works with **zero children** / no render prop.  
- [ ] Regions that own chrome **honor `children`** when provided.  
- [ ] Slots resolve to the **same** part components.  
- [ ] No inline `defaultComponent` lambdas.  
- [ ] Docs show default + compound (+ optional `.extend`) examples.  
- [ ] Type-check clean; no runtime throw on empty composition.

Calendar (and RangeCalendar attachments) are the reference implementation. Match that bar everywhere else.
