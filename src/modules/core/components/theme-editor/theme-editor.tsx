import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  SwatchIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ArrowPathIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  PaintBrushIcon,
  LanguageIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { parseColor, type Color as ColorValue } from '@react-stately/color'
import { ColorPicker as RACColorPicker } from 'react-aria-components'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useClipboard } from '../../../../hooks'
import {
  useTheme,
  useThemeOptional,
  type ThemeMode,
  THEME_PRESETS,
  RADIUS_PRESETS,
  SHADOW_PRESETS,
  ACCENT_SWATCHES,
  EDITABLE_COLOR_TOKENS,
  GOOGLE_FONTS_SANS,
  GOOGLE_FONTS_MONO,
  loadGoogleFont,
  resolveRadius,
  resolveFontSize,
  FONT_SIZE_PRESETS,
  SHADOW_VALUES,
  STROKE_VALUES,
  type RadiusPreset,
  type ShadowPreset,
  type DensityPreset,
  type StrokePreset,
  type FontSizePreset,
  type ThemePreset,
} from '../../../../theme'
import { Badge } from '../badge'
import { Button, type ButtonProps } from '../button'
import { Card } from '../card'
import { Checkbox } from '../checkbox'
import {
  Color,
  ColorArea,
  ColorSlider,
  ColorField,
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  EyeDropper,
} from '../color'
import { Input } from '../input'
import { Modal, type ModalProps } from '../modal'
import { ScrollArea } from '../scroll-area'
import { Separator } from '../separator'
import { Slider } from '../slider'
import { Switch } from '../switch'
import { Tabs, TabList, Tab, TabPanel } from '../tabs'
import { Tooltip, TooltipTrigger } from '../tooltip'

/* ==========================================================================
   Shared Context & Compound State
   ========================================================================== */

export type ThemeEditorSection = 'presets' | 'knobs' | 'colors' | 'typography' | 'preview'

export interface ThemeEditorContextValue {
  /** Currently active studio section */
  activeTab: ThemeEditorSection
  /** Switch active studio section */
  setActiveTab: (tab: ThemeEditorSection) => void
  /** Whether the container is in compact / mobile mode */
  isCompact: boolean
  /** Local color token overrides map */
  localOverrides: Record<string, string>
  /** Set a local token override value */
  setLocalOverride: (key: string, value: string) => void
  /** Active token being edited in color studio */
  activeTokenKey: string
  /** Change active token being edited */
  setActiveTokenKey: (key: string) => void
  /** Copy current CSS variables string */
  onCopyCSS: () => void
  /** Whether CSS variables were recently copied */
  isCopied: boolean
  /** Close callback */
  onClose?: () => void
}

export const { Context: ThemeEditorContext, useCompoundContext: useThemeEditorContext } =
  createCompoundContext<ThemeEditorContextValue>('ThemeEditor')

const EDITOR_SECTIONS: {
  id: ThemeEditorSection
  label: string
  hint: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}[] = [
  { id: 'presets', label: 'Palettes', hint: 'Curated systems', icon: SwatchIcon },
  { id: 'knobs', label: 'Geometry', hint: 'Optical scale', icon: AdjustmentsHorizontalIcon },
  { id: 'colors', label: 'Tokens', hint: 'Semantic color', icon: PaintBrushIcon },
  { id: 'typography', label: 'Type', hint: 'Font pairing', icon: LanguageIcon },
  { id: 'preview', label: 'Preview', hint: 'Live canvas', icon: EyeIcon },
]

function tileClass(selected?: boolean) {
  return cn(
    'rounded-base border text-left transition-all duration-150 cursor-pointer',
    selected
      ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs'
      : 'border-border/80 bg-transparent hover:border-border hover:bg-muted/25'
  )
}

const SectionIntro = ({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) => {
  return (
    <div className="flex items-start justify-between gap-space-md">
      <div className="min-w-0 flex flex-col gap-0.5">
        <h3 className="text-xs font-semibold text-fg">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-fg leading-snug max-w-prose">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

const FieldRow = ({
  title,
  hint,
  value,
}: {
  title: string
  hint?: string
  value?: React.ReactNode
}) => {
  return (
    <div className="flex items-start justify-between gap-space-sm">
      <div className="min-w-0 flex flex-col gap-0.5">
        <p className="text-xs font-semibold text-fg">{title}</p>
        {hint ? <p className="text-xs text-muted-fg">{hint}</p> : null}
      </div>
      {value ? (
        <span className="shrink-0 font-mono text-[11px] text-muted-fg">{value}</span>
      ) : null}
    </div>
  )
}

/* ==========================================================================
   ThemeEditor Header Sub-Atom & Slots
   ========================================================================== */

export interface ThemeEditorHeaderSlots {
  /** Leading icon for the theme editor header. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Reset to default theme settings action button. */
  resetButton?: React.ComponentType<ButtonProps>
  /** Close / dismiss action button. */
  closeButton?: React.ComponentType<ButtonProps>
}

export interface ThemeEditorHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title text displayed in the header. */
  title?: string
  /** Subtitle description text displayed below the title. */
  description?: string
  /** Optional live status chip (typically the active preset label). */
  status?: string
  /** Callback fired when the reset button is clicked. */
  onReset?: () => void
  /** Callback fired when the close button is clicked. */
  onClose?: () => void
  /** Injected slot component overrides. */
  slots?: SlotComponents<ThemeEditorHeaderSlots>
  /** Props passed down to injected slot components. */
  slotProps?: SlotPropsMap<ThemeEditorHeaderSlots>
}

const ThemeEditorHeaderPrimitive = ({
  title = 'Theme Studio',
  description = 'Shape palettes, optical geometry, type, and elevation in real time.',
  status,
  onReset,
  onClose,
  className,
  slots = {},
  slotProps = {},
  ...props
}: ThemeEditorHeaderProps) => {
  const defaultIcon = (
    <div
      data-slot="icon"
      className="flex size-8 shrink-0 items-center justify-center rounded-base bg-primary-subtle text-primary"
    >
      <SwatchIcon className="size-4" />
    </div>
  )

  const defaultResetBtn = onReset ? (
    <TooltipTrigger delay={300}>
      <Button
        intent="outline"
        size="xs"
        onPress={onReset}
        className="gap-space-xs"
        {...slotProps.resetButton}
      >
        <ArrowPathIcon data-slot="icon" className="size-3.5" />
        <span className="hidden @sm:inline">Reset</span>
      </Button>
      <Tooltip size="sm">Restore factory defaults</Tooltip>
    </TooltipTrigger>
  ) : null

  const defaultCloseBtn = onClose ? (
    <TooltipTrigger delay={300}>
      <Button
        intent="plain"
        size="sq-xs"
        isCircle
        onPress={onClose}
        aria-label="Close theme editor"
        className="text-muted-fg hover:text-fg"
        {...slotProps.closeButton}
      >
        <XMarkIcon data-slot="icon" className="size-4" />
      </Button>
      <Tooltip size="sm">Close</Tooltip>
    </TooltipTrigger>
  ) : null

  return (
    <div
      data-slot="theme-editor-header"
      className={cn(
        'flex items-center justify-between gap-space-sm @sm:gap-space-md px-space-md @sm:px-space-lg py-space-sm @sm:py-space-md shrink-0',
        'border-b border-border/70 bg-transparent',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-space-sm min-w-0">
        {slots.icon ? renderSlot(slots.icon, slotProps.icon) : defaultIcon}
        <div className="min-w-0">
          <div className="flex items-center gap-space-sm">
            <h2 className="text-sm font-semibold tracking-tight text-fg truncate">{title}</h2>
            {status ? (
              <Badge intent="outline" size="sm" className="hidden @sm:inline-flex font-medium">
                {status}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-fg truncate hidden @sm:block">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-space-xs shrink-0">
        {slots.resetButton
          ? renderSlot(slots.resetButton, slotProps.resetButton)
          : defaultResetBtn}
        {slots.closeButton
          ? renderSlot(slots.closeButton, slotProps.closeButton)
          : defaultCloseBtn}
      </div>
    </div>
  )
}

export const ThemeEditorHeader = createInterfaceComponent<
  ThemeEditorHeaderProps,
  ThemeEditorHeaderSlots
>(
  {
    name: 'ThemeEditorHeader',
    category: 'layout',
    description: 'Header landmark for ThemeEditor with studio branding, live preset status, and quick actions.',
    version: '1.0.0',
    slots: {
      icon: undefined,
      resetButton: undefined,
      closeButton: undefined,
    },
  },
  ThemeEditorHeaderPrimitive
)

/* ==========================================================================
   ThemeEditor Mode Toggle Sub-Atom
   ========================================================================== */

export interface ThemeEditorModeToggleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Active theme mode: light, dark, or system. */
  mode: ThemeMode
  /** Callback fired when a theme mode is selected. */
  onModeChange: (mode: ThemeMode) => void
}

const MODE_OPTIONS: { id: ThemeMode; label: string; icon: typeof SunIcon }[] = [
  { id: 'light', label: 'Light', icon: SunIcon },
  { id: 'dark', label: 'Dark', icon: MoonIcon },
  { id: 'system', label: 'System', icon: ComputerDesktopIcon },
]

const ThemeEditorModeTogglePrimitive = ({
  mode,
  onModeChange,
  className,
  ...props
}: ThemeEditorModeToggleProps) => {
  return (
    <div
      data-slot="theme-editor-mode-toggle"
      className={cn('flex flex-col items-stretch gap-space-xs', className)}
      {...props}
    >
      <p className="text-xs font-semibold text-fg">Color scheme</p>

      <Tabs
        selectedKey={mode}
        onSelectionChange={(k) => onModeChange?.(String(k) as ThemeMode)}
        variant="segmented"
        className="w-full"
      >
        <TabList variant="segmented" className="grid w-full grid-cols-3 p-space-2xs gap-1">
          {MODE_OPTIONS.map(({ id, label, icon: Icon }) => (
            <Tab
              key={id}
              id={id}
              variant="segmented"
              size="sm"
              icon={<Icon className="size-3.5 shrink-0" />}
              className="cursor-pointer gap-1.5 px-2 py-1 flex flex-row items-center justify-center flex-nowrap whitespace-nowrap min-w-0"
              aria-label={label}
            >
              <span className="text-[11px] font-medium leading-none truncate">{label}</span>
            </Tab>
          ))}
        </TabList>
      </Tabs>
    </div>
  )
}

export const ThemeEditorModeToggle = createInterfaceComponent<ThemeEditorModeToggleProps>(
  {
    name: 'ThemeEditorModeToggle',
    category: 'form',
    description: 'Compact segmented light/dark/system appearance switcher for the theme studio chrome.',
    version: '1.0.0',
  },
  ThemeEditorModeTogglePrimitive
)

/* ==========================================================================
   ThemeEditor Nav Sub-Atom & Slots
   ========================================================================== */

export interface ThemeEditorNavSlots {
  /** Custom navigation item renderer */
  item?: React.ComponentType<{
    id: string
    label: string
    hint: string
    selected: boolean
    isVertical: boolean
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    onSelect: () => void
  }>
}

export interface ThemeEditorNavProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Currently selected studio section id. */
  selectedKey: string
  /** Callback fired when a studio section is chosen. */
  onSelectionChange: (key: string) => void
  /** Whether the live preview item is included (typically when the preview column is hidden). */
  showPreview?: boolean
  /** Nav axis: vertical rail or horizontal mobile strip. */
  orientation?: 'horizontal' | 'vertical'
  /** Injected slot component overrides. */
  slots?: SlotComponents<ThemeEditorNavSlots>
  /** Props passed down to injected slot components. */
  slotProps?: SlotPropsMap<ThemeEditorNavSlots>
}

const ThemeEditorNavPrimitive = ({
  selectedKey,
  onSelectionChange,
  showPreview = true,
  orientation = 'vertical',
  className,
  slots = {},
  slotProps = {},
  ...props
}: ThemeEditorNavProps) => {
  const items = EDITOR_SECTIONS.filter((section) => showPreview || section.id !== 'preview')
  const isVertical = orientation === 'vertical'

  const navContent = (
    <div
      className={cn(
        isVertical ? 'flex flex-col gap-0.5' : 'flex items-center gap-1.5 p-space-2xs min-w-max'
      )}
      role="tablist"
      aria-orientation={orientation}
    >
      {items.map(({ id, label, hint, icon: Icon }) => {
        const selected = selectedKey === id
        const customItem = renderSlot(slots.item, {
          id,
          label,
          hint,
          selected,
          isVertical,
          icon: Icon,
          onSelect: () => onSelectionChange?.(id),
          ...(slotProps.item as object),
        })
        if (customItem) return <React.Fragment key={id}>{customItem}</React.Fragment>

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelectionChange?.(id)}
            className={cn(
              'flex cursor-pointer items-center gap-2 text-left outline-none transition-colors shrink-0',
              isVertical
                ? 'w-full px-2.5 py-2 rounded-base'
                : 'px-3 py-1.5 rounded-micro border border-transparent',
              selected
                ? isVertical
                  ? 'bg-primary/5 text-primary font-semibold'
                  : 'bg-primary/10 text-primary border-primary/20 font-semibold shadow-2xs'
                : 'text-muted-fg hover:bg-muted/30 hover:text-fg'
            )}
          >
            <Icon data-slot="icon" className="size-3.5 shrink-0" />
            <span className="min-w-0">
              <span className={cn('block text-xs', selected ? 'font-semibold' : 'font-medium')}>
                {label}
              </span>
              {isVertical ? (
                <span className="block text-[11px] font-normal text-muted-fg">{hint}</span>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <div
      data-slot="theme-editor-nav"
      className={cn(isVertical ? 'flex flex-col gap-space-xs' : 'min-w-0 w-full', className)}
      {...props}
    >
      {isVertical ? (
        navContent
      ) : (
        <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navContent}
        </div>
      )}
    </div>
  )
}

export const ThemeEditorNav = createInterfaceComponent<ThemeEditorNavProps, ThemeEditorNavSlots>(
  {
    name: 'ThemeEditorNav',
    category: 'navigation',
    description: 'Studio section navigator for ThemeEditor, rendering a vertical rail or scrollable horizontal strip.',
    version: '1.0.0',
    props: {
      showPreview: true,
      orientation: 'vertical',
    },
    slots: {
      item: undefined,
    },
  },
  ThemeEditorNavPrimitive
)

/* ==========================================================================
   ThemeEditor Presets Sub-Atom & Slots
   ========================================================================== */

export interface ThemeEditorPresetsSlots {
  /** Optional custom section intro slot */
  intro?: React.ComponentType<{ title: string; description?: string; count: number }>
}

export interface ThemeEditorPresetsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of available theme presets. */
  presets?: ThemePreset[]
  /** Currently selected preset ID. */
  activePresetId: string
  /** Currently active resolved theme mode for preview rendering. */
  resolvedTheme: 'light' | 'dark'
  /** Callback fired when a preset is chosen. */
  onSelectPreset: (id: string) => void
  /** Injected slot component overrides. */
  slots?: SlotComponents<ThemeEditorPresetsSlots>
  /** Props passed down to injected slot components. */
  slotProps?: SlotPropsMap<ThemeEditorPresetsSlots>
}

const ThemeEditorPresetsPrimitive = ({
  presets = THEME_PRESETS,
  activePresetId,
  resolvedTheme,
  onSelectPreset,
  className,
  slots = {},
  slotProps = {},
  ...props
}: ThemeEditorPresetsProps) => {
  return (
    <div data-slot="theme-editor-presets" className={cn('flex flex-col gap-space-lg', className)} {...props}>
      {slots.intro ? (
        renderSlot(slots.intro, {
          title: 'Curated palettes',
          description: 'Balanced surfaces, accents, and contrast. Selecting a system replaces the live token graph.',
          count: presets.length,
          ...slotProps.intro,
        })
      ) : (
        <SectionIntro
          title="Curated palettes"
          description="Balanced surfaces, accents, and contrast. Selecting a system replaces the live token graph."
          action={<span className="font-mono text-[11px] text-muted-fg">{presets.length}</span>}
        />
      )}

      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2.5">
        {presets.map((preset) => {
          const isSelected = activePresetId === preset.id
          const palette = resolvedTheme === 'dark' ? preset.dark : preset.light
          const swatches = preset.preview?.length
            ? preset.preview.slice(0, 3)
            : [
                palette.primary || (resolvedTheme === 'dark' ? '#38bdf8' : '#2563eb'),
                palette.bg || (resolvedTheme === 'dark' ? '#0f172a' : '#ffffff'),
                palette.secondary || (resolvedTheme === 'dark' ? '#1e293b' : '#f1f5f9'),
              ]

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset?.(preset.id)}
              className={cn(tileClass(isSelected), 'flex items-center gap-3 p-2.5')}
            >
              <div className="flex h-12 shrink-0 items-stretch gap-0.5 rounded-lg bg-white/5 p-1.5">
                {swatches.map((color, index) => (
                  <div
                    key={`${preset.id}-${index}`}
                    className="w-6 border border-white/10 shadow-2xs first:rounded-l-md last:rounded-r-md"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-fg">{preset.label}</span>
                </div>
                {preset.description ? (
                  <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-muted-fg">
                    {preset.description}
                  </p>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export const ThemeEditorPresets = createInterfaceComponent<ThemeEditorPresetsProps, ThemeEditorPresetsSlots>(
  {
    name: 'ThemeEditorPresets',
    category: 'form',
    description: 'Visual palette gallery with surface swatches and preset cards.',
    version: '1.0.0',
    slots: {
      intro: undefined,
    },
  },
  ThemeEditorPresetsPrimitive
)

/* ==========================================================================
   ThemeEditor Knobs Sub-Atom & Slots
   ========================================================================== */

export interface ThemeEditorKnobsSlots {
  /** Optional custom section intro slot */
  intro?: React.ComponentType<{ title: string; description?: string }>
}

export interface ThemeEditorKnobsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Active corner radius preset or CSS value. */
  radius: RadiusPreset | string
  /** Callback on corner radius change. */
  onRadiusChange: (radius: RadiusPreset | string) => void
  /** Active density preset or factor (0.85 - 1.15). */
  density: DensityPreset | number
  /** Callback on density change. */
  onDensityChange: (density: DensityPreset | number) => void
  /** Active shadow elevation preset. */
  shadow: ShadowPreset | string
  /** Callback on shadow elevation change. */
  onShadowChange: (shadow: ShadowPreset | string) => void
  /** Active stroke border-width preset. */
  stroke: StrokePreset | string
  /** Callback on stroke change. */
  onStrokeChange: (stroke: StrokePreset | string) => void
  /** Active base font size preset or value. */
  fontSize?: FontSizePreset | string
  /** Callback on base font size change. */
  onFontSizeChange?: (fontSize: FontSizePreset | string) => void
  /** Injected slot component overrides. */
  slots?: SlotComponents<ThemeEditorKnobsSlots>
  /** Props passed down to injected slot components. */
  slotProps?: SlotPropsMap<ThemeEditorKnobsSlots>
}

const ThemeEditorKnobsPrimitive = ({
  radius,
  onRadiusChange,
  density = 'normal',
  onDensityChange,
  shadow,
  onShadowChange,
  stroke,
  onStrokeChange,
  fontSize,
  onFontSizeChange,
  className,
  slots = {},
  slotProps = {},
  ...props
}: ThemeEditorKnobsProps) => {
  const densityKey: DensityPreset =
    density === 0.85 || density === 'compact'
      ? 'compact'
      : density === 1.15 || density === 'spacious'
        ? 'spacious'
        : 'normal'

  return (
    <div
      data-slot="theme-editor-knobs"
      className={cn('flex flex-col gap-space-lg', className)}
      {...props}
    >
      <div className="flex flex-col gap-2.5">
        <FieldRow
          title="Corner radius"
          hint="Optical curvature across controls and cards"
          value={typeof radius === 'string' ? resolveRadius(radius) : radius}
        />
        <div className="grid grid-cols-3 @sm:grid-cols-5 gap-2">
          {RADIUS_PRESETS.map((r) => {
            const selected = String(radius) === r.id
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onRadiusChange?.(r.id)}
                className={cn(
                  tileClass(selected),
                  'flex flex-col items-center justify-center gap-1.5 px-2 py-2.5'
                )}
                style={{ borderRadius: resolveRadius(r.id) }}
              >
                <span className={cn('text-xs capitalize', selected ? 'font-semibold text-primary' : 'font-medium text-fg')}>
                  {r.id}
                </span>
                <span className="font-mono text-[10px] text-muted-fg">{r.value}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-2.5">
        <FieldRow
          title="Interface density"
          hint="Scales padding, heights, and spacing"
          value={typeof density === 'number' ? `${Math.round(density * 100)}%` : density}
        />
        <div className="grid grid-cols-3 gap-2">
          {(['compact', 'normal', 'spacious'] as DensityPreset[]).map((d) => {
            const selected = densityKey === d
            return (
              <button
                key={d}
                type="button"
                onClick={() => onDensityChange?.(d)}
                className={cn(tileClass(selected), 'px-3 py-2.5 text-center')}
              >
                <span className={cn('text-xs capitalize', selected ? 'font-semibold text-primary' : 'font-medium text-fg')}>
                  {d}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {onFontSizeChange ? (
        <>
          <Separator />
          <div className="flex flex-col gap-2.5">
            <FieldRow
              title="Base font size"
              hint="Root typography scale and rem proportion"
              value={typeof fontSize === 'string' ? resolveFontSize(fontSize) : fontSize ?? '1rem'}
            />
            <div className="grid grid-cols-5 gap-2">
              {FONT_SIZE_PRESETS.map((sz) => {
                const selected = String(fontSize ?? 'md') === sz.id
                return (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => onFontSizeChange(sz.id)}
                    className={cn(
                      tileClass(selected),
                      'flex flex-col items-center justify-center gap-1 px-2 py-2 text-center'
                    )}
                  >
                    <span className={cn('text-xs uppercase', selected ? 'font-semibold text-primary' : 'font-medium text-fg')}>
                      {sz.id}
                    </span>
                    <span className="font-mono text-[10px] text-muted-fg">{sz.px}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      ) : null}

      <Separator />

      <div className="flex flex-col gap-2.5">
        <FieldRow
          title="Elevation"
          hint="OKLab color-mix shadow ramp"
          value={typeof shadow === 'string' ? shadow : 'subtle'}
        />
        <div className="grid grid-cols-2 @sm:grid-cols-4 gap-2">
          {SHADOW_PRESETS.map((s) => {
            const selected = String(shadow) === s.id
            const shadowPreview = SHADOW_VALUES[s.id]?.['shadow-md'] ?? 'none'
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onShadowChange?.(s.id)}
                className={cn(tileClass(selected), 'flex flex-col gap-1.5 p-3')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('text-xs capitalize', selected ? 'font-semibold text-primary' : 'font-semibold text-fg')}>
                    {s.id}
                  </span>
                  {selected ? <CheckIcon className="size-3.5 shrink-0 text-primary" /> : null}
                </div>
                <span
                  className="h-7 rounded-micro border border-border/70 bg-bg"
                  style={{ boxShadow: shadowPreview }}
                />
                <span className="line-clamp-1 text-[11px] text-muted-fg">{s.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-2.5">
        <FieldRow
          title="Border stroke"
          hint="Global outline width"
          value={typeof stroke === 'string' ? STROKE_VALUES[stroke as StrokePreset] ?? stroke : stroke}
        />
        <div className="grid grid-cols-3 gap-2">
          {(['flat', 'standard', 'bold'] as StrokePreset[]).map((st) => {
            const selected = String(stroke) === st
            const strokeWidth = STROKE_VALUES[st] ?? '1px'
            return (
              <button
                key={st}
                type="button"
                onClick={() => onStrokeChange?.(st)}
                className={cn(tileClass(selected), 'flex flex-col items-center gap-1.5 px-3 py-2.5')}
              >
                <span
                  className="size-5 rounded-micro border-fg"
                  style={{ borderWidth: strokeWidth }}
                />
                <span className={cn('text-xs capitalize', selected ? 'font-semibold text-primary' : 'font-medium text-fg')}>
                  {st}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const ThemeEditorKnobs = createInterfaceComponent<ThemeEditorKnobsProps, ThemeEditorKnobsSlots>(
  {
    name: 'ThemeEditorKnobs',
    category: 'form',
    description: 'Four-knob optical control panel for curvature, density, elevation, and stroke.',
    version: '1.0.0',
    props: {
      density: 'normal',
    },
    slots: {
      intro: undefined,
    },
  },
  ThemeEditorKnobsPrimitive
)

/* ==========================================================================
   ThemeEditor Colors Sub-Atom & Slots
   ========================================================================== */

export interface ThemeEditorColorsSlots {
  /** Optional custom section intro slot */
  intro?: React.ComponentType<{ title: string; description?: string; count: number }>
}

export interface ThemeEditorColorsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Active custom token overrides. */
  customTokens: Record<string, string>
  /** Resolved palette for the current mode (preset tokens before overrides). */
  palette?: Record<string, string>
  /** Callback fired when a custom token is set. */
  onSetCustomToken: (key: string, value: string) => void
  /** Callback to clear all token overrides. */
  onClearCustomTokens: () => void
  /** Injected slot component overrides. */
  slots?: SlotComponents<ThemeEditorColorsSlots>
  /** Props passed down to injected slot components. */
  slotProps?: SlotPropsMap<ThemeEditorColorsSlots>
}

function readCssVar(name: string): string {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()
}

const colorSampleCache = new Map<string, ColorValue>()
let sharedCanvas: HTMLCanvasElement | null = null
let sharedCtx: CanvasRenderingContext2D | null = null

function sampleCssColor(css: string): ColorValue | null {
  if (typeof document === 'undefined' || !css) return null
  const cached = colorSampleCache.get(css)
  if (cached) return cached

  try {
    if (!sharedCanvas) {
      sharedCanvas = document.createElement('canvas')
      sharedCanvas.width = 1
      sharedCanvas.height = 1
      sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true })
    }
    if (!sharedCtx) return null
    sharedCtx.fillStyle = '#000'
    sharedCtx.fillStyle = css
    sharedCtx.fillRect(0, 0, 1, 1)
    const data = sharedCtx.getImageData(0, 0, 1, 1).data
    const r = data[0] ?? 0
    const g = data[1] ?? 0
    const b = data[2] ?? 0
    const a = data[3] ?? 255
    const parsed =
      a < 255
        ? parseColor(`rgba(${r}, ${g}, ${b}, ${Number((a / 255).toFixed(2))})`)
        : parseColor(`rgb(${r}, ${g}, ${b})`)
    if (colorSampleCache.size > 200) {
      colorSampleCache.clear()
    }
    colorSampleCache.set(css, parsed)
    return parsed
  } catch {
    return null
  }
}

function cssToPickerColor(val: string): ColorValue {
  try {
    if (val && (val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl') || val.startsWith('hsb'))) {
      return parseColor(val)
    }
  } catch {
    // sample fallback
  }
  return sampleCssColor(val) ?? parseColor('#808080')
}

const TokenDot = ({ css }: { css: string }) => {
  return (
    <span
      className="size-4.5 sm:size-5 shrink-0 rounded-full border border-black/15 shadow-2xs"
      style={{ backgroundColor: css || 'var(--muted)' }}
    />
  )
}

const COLOR_TOKEN_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'brand', label: 'Brand & Accent' },
  { id: 'surface', label: 'Surfaces & Chrome' },
  { id: 'feedback', label: 'Status' },
] as const

function getTokenCategory(key: string): 'brand' | 'surface' | 'feedback' {
  if (key.startsWith('success') || key.startsWith('warning') || key.startsWith('danger')) {
    return 'feedback'
  }
  if (
    key.startsWith('primary') ||
    key.startsWith('secondary') ||
    key.startsWith('accent') ||
    key.startsWith('muted')
  ) {
    return 'brand'
  }
  return 'surface'
}

const ThemeEditorColorsPrimitive = ({
  customTokens,
  palette,
  onSetCustomToken,
  onClearCustomTokens,
  className,
  slots = {},
  slotProps = {},
  ...props
}: ThemeEditorColorsProps) => {
  const theme = useThemeOptional()
  const resolvedPalette = palette ?? (
    theme
      ? theme.resolvedMode === 'dark'
        ? theme.activePreset.dark
        : theme.activePreset.light
      : undefined
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'brand' | 'surface' | 'feedback'>('all')
  const [localOverrides, setLocalOverrides] = useState<Record<string, string>>({})
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getEffectiveTokenValue = useCallback(
    (key: string) => {
      return localOverrides[key] ?? customTokens[key] ?? resolvedPalette?.[key] ?? readCssVar(key) ?? ''
    },
    [localOverrides, customTokens, resolvedPalette]
  )

  const prevCustomTokensRef = useRef(customTokens)
  const prevPaletteRef = useRef(resolvedPalette)
  useEffect(() => {
    if (prevPaletteRef.current !== resolvedPalette) {
      prevPaletteRef.current = resolvedPalette
      setLocalOverrides({})
    }
    if (Object.keys(customTokens).length === 0 && Object.keys(prevCustomTokensRef.current).length > 0) {
      setLocalOverrides({})
    }
    prevCustomTokensRef.current = customTokens
  }, [customTokens, resolvedPalette])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleColorChangeForToken = useCallback(
    (tokenKey: string, col: ColorValue) => {
      let hexVal: string
      try {
        const alpha = col.getChannelValue('alpha')
        hexVal = alpha < 1 ? col.toString('hexa') : col.toString('hex')
      } catch {
        hexVal = col.toString('hex')
      }

      setLocalOverrides((prev) => ({ ...prev, [tokenKey]: hexVal }))

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        onSetCustomToken?.(tokenKey, hexVal)
      }, 500)
    },
    [onSetCustomToken]
  )

  const handleClear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    setLocalOverrides({})
    onClearCustomTokens?.()
  }, [onClearCustomTokens])

  const overrideCount = Object.keys({ ...customTokens, ...localOverrides }).length

  const filteredTokens = useMemo(() => {
    return EDITABLE_COLOR_TOKENS.filter((tok) => {
      const matchesCategory = categoryFilter === 'all' || getTokenCategory(tok.key) === categoryFilter
      if (!matchesCategory) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return tok.label.toLowerCase().includes(q) || tok.key.toLowerCase().includes(q)
    })
  }, [searchQuery, categoryFilter])

  return (
    <div data-slot="theme-editor-colors" className={cn('flex flex-col gap-space-md', className)} {...props}>
      {slots.intro ? (
        renderSlot(slots.intro, {
          title: 'Semantic tokens',
          description: 'Values resolve from the active preset, then your overrides. Click any color swatch to open the color picker.',
          count: overrideCount,
          ...slotProps.intro,
        })
      ) : (
        <SectionIntro
          title="Semantic tokens"
          description="Values resolve from the active preset, then your overrides. Click any color swatch to open the color picker."
          action={
            overrideCount > 0 ? (
              <Button
                intent="plain"
                size="xs"
                onPress={handleClear}
                className="text-xs text-muted-fg hover:text-danger"
              >
                Clear {overrideCount}
              </Button>
            ) : null
          }
        />
      )}

      <div className="flex flex-col @sm:flex-row items-stretch @sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-0">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-fg pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tokens (--primary, bg, text...)"
            className="w-full pl-8 pr-3 py-1.5 rounded-base border border-border/70 bg-bg/60 text-xs text-fg placeholder:text-muted-fg/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-fg hover:text-fg text-xs cursor-pointer"
            >
              <XMarkIcon className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
          {COLOR_TOKEN_CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  'px-2.5 py-1 rounded-micro text-xs font-medium transition-colors cursor-pointer shrink-0',
                  isSelected
                    ? 'bg-primary text-primary-fg shadow-2xs font-semibold'
                    : 'text-muted-fg bg-muted/30 hover:bg-muted/60 hover:text-fg'
                )}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-3 gap-3">
        {filteredTokens.map((token) => {
          const currentValue = getEffectiveTokenValue(token.key)
          const isOverride = Boolean(localOverrides[token.key] || customTokens[token.key])
          const colorVal = cssToPickerColor(currentValue)

          return (
            <div
              key={token.key}
              className={cn(
                'group/token rounded-base border border-border/80 bg-bg/60 hover:bg-muted/15 hover:border-border p-3 transition-all duration-150',
                'flex flex-col justify-between gap-2.5 shadow-2xs'
              )}
            >
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Color
                    value={colorVal}
                    onChange={(col) => handleColorChangeForToken(token.key, col)}
                    shape="square"
                    size="md"
                    fillTypes={['solid']}
                    defaultTab="editor"
                    popover={{ placement: 'bottom start', fillTypes: ['solid'] }}
                    aria-label={`Edit ${token.label} color`}
                    className="size-8 rounded-micro border border-black/10 shadow-xs group-hover/token:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-fg leading-tight truncate">
                      {token.label}
                    </span>
                    <span className="block font-mono text-[11px] text-muted-fg leading-tight mt-0.5 truncate">
                      --{token.key}
                    </span>
                  </div>
                </div>

                {isOverride ? (
                  <span className="shrink-0 rounded-micro bg-primary/10 px-1.5 py-0.5 text-2xs font-semibold text-primary">
                    edited
                  </span>
                ) : null}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                <span className="font-mono text-2xs text-muted-fg uppercase">HEX / CSS</span>
                <span className="font-mono font-medium text-fg uppercase bg-muted/40 px-1.5 py-0.5 rounded-atom text-2xs border border-border/50">
                  {currentValue || '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {filteredTokens.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-fg border border-dashed border-border/70 rounded-base">
          No color tokens match &ldquo;{searchQuery}&rdquo;
        </div>
      ) : null}
    </div>
  )
}

export const ThemeEditorColors = createInterfaceComponent<ThemeEditorColorsProps, ThemeEditorColorsSlots>(
  {
    name: 'ThemeEditorColors',
    category: 'form',
    description: 'Semantic color token studio with canvas picker, swatch rail, and token list.',
    version: '1.0.0',
    slots: {
      intro: undefined,
    },
  },
  ThemeEditorColorsPrimitive
)

/* ==========================================================================
   ThemeEditor Typography Sub-Atom & Slots
   ========================================================================== */

export interface ThemeEditorTypographySlots {
  /** Optional custom section intro slot */
  intro?: React.ComponentType<{ title: string; description?: string }>
}

export interface ThemeEditorTypographyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Active Sans font family name. */
  fontFamily: string
  /** Callback fired on Sans font change. */
  onFontFamilyChange: (font: string) => void
  /** Active Monospace font family name. */
  fontFamilyMono: string
  /** Callback fired on Monospace font change. */
  onFontFamilyMonoChange: (font: string) => void
  /** Active base font size preset or CSS value. */
  fontSize?: FontSizePreset | string
  /** Callback fired on base font size change. */
  onFontSizeChange?: (size: FontSizePreset | string) => void
  /** Injected slot component overrides. */
  slots?: SlotComponents<ThemeEditorTypographySlots>
  /** Props passed down to injected slot components. */
  slotProps?: SlotPropsMap<ThemeEditorTypographySlots>
}

const ThemeEditorTypographyPrimitive = ({
  fontFamily,
  onFontFamilyChange,
  fontFamilyMono,
  onFontFamilyMonoChange,
  fontSize,
  onFontSizeChange,
  className,
  slots = {},
  slotProps = {},
  ...props
}: ThemeEditorTypographyProps) => {
  const [typographyTab, setTypographyTab] = useState<'sans' | 'mono'>('sans')

  useEffect(() => {
    const fonts = typographyTab === 'sans' ? GOOGLE_FONTS_SANS : GOOGLE_FONTS_MONO
    fonts.forEach((f) => loadGoogleFont(f.name))
  }, [typographyTab])

  const resolvedBaseSize = fontSize ? resolveFontSize(fontSize) : '1rem'

  return (
    <div data-slot="theme-editor-typography" className={cn('flex flex-col gap-space-lg', className)} {...props}>
      <div className="flex flex-col gap-1.5 rounded-lg border border-border/70 bg-bg/50 p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-fg">Specimen Scale</span>
          <span className="font-mono text-xs text-primary font-medium">{resolvedBaseSize}</span>
        </div>
        <p
          className="text-xl font-semibold tracking-tight text-fg transition-all duration-150"
          style={{
            fontFamily: `'${fontFamily}', sans-serif`,
            fontSize: `calc(${resolvedBaseSize} * 1.25)`,
          }}
        >
          The quick brown fox jumps over 123
        </p>
        <p
          className="text-sm text-muted-fg transition-all duration-150"
          style={{
            fontFamily: `'${fontFamilyMono}', monospace`,
            fontSize: `calc(${resolvedBaseSize} * 0.875)`,
          }}
        >
          const value: number = 42.80; // responsive optical scale
        </p>
      </div>

      {onFontSizeChange ? (
        <div className="flex flex-col gap-2.5">
          <FieldRow
            title="Base font size"
            hint="Root rem scale for typography and spacing"
            value={typeof fontSize === 'string' ? resolveFontSize(fontSize) : fontSize ?? '1rem'}
          />
          <div className="grid grid-cols-5 gap-2">
            {FONT_SIZE_PRESETS.map((sz) => {
              const selected = String(fontSize ?? 'md') === sz.id
              return (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => onFontSizeChange(sz.id)}
                  className={cn(
                    tileClass(selected),
                    'flex flex-col items-center justify-center gap-1 px-2 py-2 text-center'
                  )}
                >
                  <span className={cn('text-xs uppercase font-semibold', selected ? 'font-semibold text-primary' : 'font-medium text-fg')}>
                    {sz.id}
                  </span>
                  <span className="font-mono text-[10px] text-muted-fg">{sz.px}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <Tabs
        selectedKey={typographyTab}
        onSelectionChange={(k) => setTypographyTab(k as 'sans' | 'mono')}
        variant="segmented"
        className="w-full flex flex-col gap-space-md"
      >
        <TabList variant="segmented" className="grid w-full grid-cols-2 p-space-2xs">
          <Tab id="sans" variant="segmented" size="sm" className="cursor-pointer">
            Sans-serif
          </Tab>
          <Tab id="mono" variant="segmented" size="sm" className="cursor-pointer">
            Monospace
          </Tab>
        </TabList>

        <TabPanel id="sans" className="outline-none">
          <div className="flex flex-col gap-3">
            <FieldRow title="Interface font" hint="Labels, headings, buttons, navigation" value={fontFamily} />

            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2.5">
              {GOOGLE_FONTS_SANS.map((f) => {
                const isSelected = fontFamily === f.name
                return (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => onFontFamilyChange?.(f.name)}
                    className={cn(tileClass(isSelected), 'flex flex-col items-start gap-1.5 p-3')}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span
                        className="truncate text-sm font-semibold text-fg"
                        style={{ fontFamily: `'${f.name}', sans-serif` }}
                      >
                        {f.label}
                      </span>
                      {isSelected ? <CheckIcon className="size-3.5 shrink-0 text-primary" /> : null}
                    </div>
                    {f.description ? (
                      <span className="line-clamp-1 text-xs text-muted-fg">{f.description}</span>
                    ) : null}
                    <span
                      className="pt-0.5 text-xs text-muted-fg/80"
                      style={{ fontFamily: `'${f.name}', sans-serif` }}
                    >
                      The quick brown fox jumps over 123
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </TabPanel>

        <TabPanel id="mono" className="outline-none">
          <div className="flex flex-col gap-3">
            <FieldRow title="Monospace font" hint="Code, tables, and tabular numbers" value={fontFamilyMono} />
            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2.5">
              {GOOGLE_FONTS_MONO.map((f) => {
                const isSelected = fontFamilyMono === f.name
                return (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => onFontFamilyMonoChange?.(f.name)}
                    className={cn(tileClass(isSelected), 'flex flex-col items-start gap-1.5 p-3')}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span
                        className="truncate text-sm font-semibold text-fg"
                        style={{ fontFamily: `'${f.name}', monospace` }}
                      >
                        {f.label}
                      </span>
                      {isSelected ? <CheckIcon className="size-3.5 shrink-0 text-primary" /> : null}
                    </div>
                    {f.description ? (
                      <span className="line-clamp-1 text-xs text-muted-fg">{f.description}</span>
                    ) : null}
                    <span
                      className="pt-0.5 font-mono text-xs text-muted-fg/80"
                      style={{ fontFamily: `'${f.name}', monospace` }}
                    >
                      const value: number = 42.80
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  )
}

export const ThemeEditorTypography = createInterfaceComponent<ThemeEditorTypographyProps, ThemeEditorTypographySlots>(
  {
    name: 'ThemeEditorTypography',
    category: 'form',
    description: 'Typography studio with live specimens and sans/mono Google Font pairings.',
    version: '1.0.0',
    slots: {
      intro: undefined,
    },
  },
  ThemeEditorTypographyPrimitive
)

/* ==========================================================================
   ThemeEditor Preview Sandbox Sub-Atom & Slots
   ========================================================================== */

export interface ThemeEditorPreviewSlots {
  /** Optional custom section intro slot */
  intro?: React.ComponentType<{ title: string; description?: string }>
}

export interface ThemeEditorPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Injected slot component overrides. */
  slots?: SlotComponents<ThemeEditorPreviewSlots>
  /** Props passed down to injected slot components. */
  slotProps?: SlotPropsMap<ThemeEditorPreviewSlots>
}

const ThemeEditorPreviewPrimitive = ({
  className,
  slots = {},
  slotProps = {},
  ...props
}: ThemeEditorPreviewProps) => {
  const [sliderVal, setSliderVal] = useState(65)
  const [switchChecked, setSwitchChecked] = useState(true)
  const [checkChecked, setCheckChecked] = useState(true)
  const theme = useThemeOptional()

  return (
    <div
      data-slot="theme-editor-preview"
      className={cn('flex h-full flex-col gap-space-lg', className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs font-semibold text-fg">Live preview</h3>
          <p className="text-xs text-muted-fg">Controls inherit the active tokens.</p>
        </div>
        {theme ? (
          <span className="font-mono text-[11px] text-muted-fg">{theme.activePreset.label}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold tracking-tight text-fg">Aurora Workspace</p>
        <p className="text-xs leading-relaxed text-muted-fg">
          Buttons, fields, and status update as you edit.
        </p>
        <Input placeholder="Search surfaces…" />
        <div className="flex flex-wrap gap-1.5">
          <Button intent="primary" size="xs">
            Deploy
          </Button>
          <Button intent="secondary" size="xs">
            Draft
          </Button>
          <Button intent="outline" size="xs">
            Review
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-fg">Notifications</span>
          <Switch isSelected={switchChecked} onChange={setSwitchChecked} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-fg">Remember device</span>
          <Checkbox isSelected={checkChecked} onChange={setCheckChecked} />
        </div>
        <Slider
          value={sliderVal}
          onChange={(v) => setSliderVal(v as number)}
          minValue={0}
          maxValue={100}
        />
        <div className="flex flex-wrap gap-1.5">
          <Badge intent="primary" size="sm">
            Primary
          </Badge>
          <Badge intent="warning" size="sm">
            Warning
          </Badge>
          <Badge intent="success" size="sm">
            Live
          </Badge>
        </div>
      </div>
    </div>
  )
}

export const ThemeEditorPreview = createInterfaceComponent<ThemeEditorPreviewProps, ThemeEditorPreviewSlots>(
  {
    name: 'ThemeEditorPreview',
    category: 'layout',
    description: 'Embedded live canvas demonstrating theme, radius, density, and stroke reactivity.',
    version: '1.0.0',
    slots: {
      intro: undefined,
    },
  },
  ThemeEditorPreviewPrimitive
)

/* ==========================================================================
   ThemeEditor Footer Sub-Atom & Slots
   ========================================================================== */

export interface ThemeEditorFooterSlots {
  /** Copy CSS variables button. */
  copyButton?: React.ComponentType<ButtonProps>
  /** Primary finish / done button. */
  doneButton?: React.ComponentType<ButtonProps>
}

export interface ThemeEditorFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Callback fired on copy CSS variables. */
  onCopyCSS?: () => void
  /** Whether the CSS variables were recently copied. */
  isCopied?: boolean
  /** Callback fired when Done / Finish is clicked. */
  onDone?: () => void
  /** Injected slot component overrides. */
  slots?: SlotComponents<ThemeEditorFooterSlots>
  /** Props passed down to injected slot components. */
  slotProps?: SlotPropsMap<ThemeEditorFooterSlots>
}

const ThemeEditorFooterPrimitive = ({
  onCopyCSS,
  isCopied = false,
  onDone,
  className,
  slots = {},
  slotProps = {},
  ...props
}: ThemeEditorFooterProps) => {
  const defaultCopyBtn = onCopyCSS ? (
    <Button
      intent="outline"
      size="sm"
      onPress={onCopyCSS}
      className="gap-space-xs"
      {...slotProps.copyButton}
    >
      {isCopied ? (
        <>
          <CheckIcon data-slot="icon" className="size-4 text-success" />
          Copied
        </>
      ) : (
        <>
          <DocumentDuplicateIcon data-slot="icon" className="size-4" />
          <span className="hidden @sm:inline">Copy CSS</span>
          <span className="@sm:hidden">Copy</span>
        </>
      )}
    </Button>
  ) : null

  const defaultDoneBtn = onDone ? (
    <Button intent="primary" size="sm" onPress={onDone} className="px-space-lg" {...slotProps.doneButton}>
      Done
    </Button>
  ) : null

  return (
    <div
      data-slot="theme-editor-footer"
      className={cn(
        'flex items-center justify-between gap-space-sm @sm:gap-space-md px-space-md @sm:px-space-lg py-space-sm @sm:py-space-md shrink-0',
        'border-t border-border/70 bg-transparent',
        className
      )}
      {...props}
    >
      <p className="hidden @sm:block text-[11px] text-muted-fg">
        Changes apply globally to this session.
      </p>
      <div className="ml-auto flex items-center gap-space-sm">
        {slots.copyButton ? renderSlot(slots.copyButton, slotProps.copyButton) : defaultCopyBtn}
        {slots.doneButton ? renderSlot(slots.doneButton, slotProps.doneButton) : defaultDoneBtn}
      </div>
    </div>
  )
}

export const ThemeEditorFooter = createInterfaceComponent<
  ThemeEditorFooterProps,
  ThemeEditorFooterSlots
>(
  {
    name: 'ThemeEditorFooter',
    category: 'layout',
    description: 'Footer action bar for CSS export and dismiss, with a quiet session hint.',
    version: '1.0.0',
    slots: {
      copyButton: undefined,
      doneButton: undefined,
    },
  },
  ThemeEditorFooterPrimitive
)

/* ==========================================================================
   ThemeEditor Root Composite & Slots
   ========================================================================== */

export interface ThemeEditorSlots {
  /** Header region slot. */
  header?: React.ComponentType<ThemeEditorHeaderProps>
  /** Studio section navigator slot. */
  nav?: React.ComponentType<ThemeEditorNavProps>
  /** Appearance mode switcher slot. */
  modeToggle?: React.ComponentType<ThemeEditorModeToggleProps>
  /** Theme presets grid slot. */
  presets?: React.ComponentType<ThemeEditorPresetsProps>
  /** Optical scale knobs slot. */
  knobs?: React.ComponentType<ThemeEditorKnobsProps>
  /** Semantic token color customizer slot. */
  colors?: React.ComponentType<ThemeEditorColorsProps>
  /** Typography family selector slot. */
  typography?: React.ComponentType<ThemeEditorTypographyProps>
  /** Live interactive component sandbox slot. */
  preview?: React.ComponentType<ThemeEditorPreviewProps>
  /** Footer actions bar slot. */
  footer?: React.ComponentType<ThemeEditorFooterProps>
}

export interface ThemeEditorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional custom title override. */
  title?: string
  /** Optional custom subtitle description override. */
  description?: string
  /** Callback fired when the editor is closed. */
  onClose?: () => void
  /** Injected slot component overrides. */
  slots?: SlotComponents<ThemeEditorSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ThemeEditorSlots>
  /** Optional compound children to render custom layout */
  children?: React.ReactNode
}

function useContainerNarrow(breakpoint = 768) {
  const ref = useRef<HTMLDivElement>(null)
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = (width: number) => setNarrow(width < breakpoint)
    apply(el.clientWidth)
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (typeof width === 'number') apply(width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [breakpoint])

  return [ref, narrow] as const
}

const ThemeEditorPrimitive = ({
  title,
  description,
  onClose,
  className,
  slots = {},
  slotProps = {},
  children,
  ...props
}: ThemeEditorProps) => {
  const theme = useTheme()
  const [rootRef, compact] = useContainerNarrow(768)
  const [activeTab, setActiveTab] = useState<ThemeEditorSection>('presets')
  const [localOverrides, setLocalOverrides] = useState<Record<string, string>>({})
  const [activeTokenKey, setActiveTokenKey] = useState<string>('primary')
  const { copied: isCopied, copy } = useClipboard()

  const handleCopyCSS = useCallback(() => {
    const palette = theme.resolvedMode === 'dark' ? theme.activePreset.dark : theme.activePreset.light
    const allTokens: Record<string, string> = { ...palette }
    Object.entries(theme.tokens).forEach(([k, v]) => {
      allTokens[k] = String(v)
    })

    const cssTokens = Object.entries(allTokens)
      .map(([k, v]) => `  --${k}: ${v};`)
      .join('\n')

    const fullCSS = `:root {\n${cssTokens}\n  --radius: ${theme.radius};\n  --density-factor: ${theme.density};\n  --border-width: ${theme.stroke};\n  --font-size-base: ${resolveFontSize(theme.fontSize)};\n  --font-sans: '${theme.fontFamily}', sans-serif;\n  --font-mono: '${theme.fontFamilyMono}', monospace;\n}`

    void copy(fullCSS)
  }, [theme, copy])

  const setLocalOverride = useCallback((key: string, value: string) => {
    setLocalOverrides((prev) => ({ ...prev, [key]: value }))
  }, [])

  const contextValue: ThemeEditorContextValue = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      isCompact: compact,
      localOverrides,
      setLocalOverride,
      activeTokenKey,
      setActiveTokenKey,
      onCopyCSS: handleCopyCSS,
      isCopied,
      onClose,
    }),
    [activeTab, compact, localOverrides, setLocalOverride, activeTokenKey, handleCopyCSS, isCopied, onClose]
  )

  const modeToggleNode = renderSlot(
    slots.modeToggle,
    {
      mode: theme.mode,
      onModeChange: theme.setMode,
      ...slotProps.modeToggle,
    },
    { defaultComponent: ThemeEditorModeToggle }
  )

  const workspace =
    activeTab === 'knobs'
      ? renderSlot(
          slots.knobs,
          {
            radius: theme.radius,
            onRadiusChange: theme.setRadius,
            density: theme.density,
            onDensityChange: theme.setDensity,
            shadow: theme.shadow,
            onShadowChange: theme.setShadow,
            stroke: theme.stroke,
            onStrokeChange: theme.setStroke,
            fontSize: theme.fontSize,
            onFontSizeChange: theme.setFontSize,
            ...slotProps.knobs,
          },
          { defaultComponent: ThemeEditorKnobs }
        )
      : activeTab === 'colors'
        ? renderSlot(
            slots.colors,
            {
              ...slotProps.colors,
              customTokens: Object.fromEntries(
                Object.entries(theme.tokens).map(([k, v]) => [k, String(v)])
              ),
              palette: theme.resolvedMode === 'dark' ? theme.activePreset.dark : theme.activePreset.light,
              onSetCustomToken: (k: string, v: string) => theme.setToken(k, v),
              onClearCustomTokens: theme.resetTokens,
            },
            { defaultComponent: ThemeEditorColors }
          )
        : activeTab === 'typography'
          ? renderSlot(
              slots.typography,
              {
                fontFamily: theme.fontFamily,
                onFontFamilyChange: theme.setFontFamily,
                fontFamilyMono: theme.fontFamilyMono,
                onFontFamilyMonoChange: theme.setFontFamilyMono,
                fontSize: theme.fontSize,
                onFontSizeChange: theme.setFontSize,
                ...slotProps.typography,
              },
              { defaultComponent: ThemeEditorTypography }
            )
          : activeTab === 'preview'
            ? renderSlot(
                slots.preview,
                { ...slotProps.preview },
                { defaultComponent: ThemeEditorPreview }
              )
            : renderSlot(
                slots.presets,
                {
                  presets: theme.presets,
                  activePresetId: theme.presetId,
                  resolvedTheme: theme.resolvedMode,
                  onSelectPreset: theme.setPresetId,
                  ...slotProps.presets,
                },
                { defaultComponent: ThemeEditorPresets }
              )

  return (
    <ThemeEditorContext.Provider value={contextValue}>
      <div
        ref={rootRef}
        className="@container h-full min-h-[22rem] w-full min-w-0 max-w-5xl"
      >
        <Card
          variant="default"
          padding="none"
          data-slot="theme-editor"
          className={cn(
            'flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden',
            'rounded-macro border border-border/80 bg-bg text-fg shadow-2xl select-none',
            '[&_button]:cursor-pointer [&_[role=tab]]:cursor-pointer [&_[role=button]]:cursor-pointer [&_label]:cursor-pointer',
            className
          )}
          {...props}
        >
          {children != null ? (
            children
          ) : (
            <>
              {renderSlot(
                slots.header,
                {
                  title,
                  description,
                  status: theme.activePreset.label,
                  onReset: theme.resetTheme,
                  onClose,
                  ...slotProps.header,
                },
                { defaultComponent: ThemeEditorHeader }
              )}

              <div className="flex min-h-0 flex-1 flex-col @md:flex-row overflow-hidden">
                <aside className="flex shrink-0 flex-col gap-space-sm border-b border-border/70 px-space-md py-space-sm @md:w-48 @md:border-b-0 @md:border-r @md:py-space-md @md:gap-space-md">
                  {renderSlot(
                    slots.nav,
                    {
                      selectedKey: activeTab,
                      onSelectionChange: (k) => setActiveTab(k as ThemeEditorSection),
                      showPreview: false,
                      orientation: compact ? 'horizontal' : 'vertical',
                      ...slotProps.nav,
                    },
                    { defaultComponent: ThemeEditorNav }
                  )}
                  <div className="@md:mt-auto @md:border-t @md:border-border/50 @md:pt-space-sm">
                    {modeToggleNode}
                  </div>
                </aside>

                <ScrollArea className="h-full min-h-0 flex-1 w-full" orientation="vertical">
                  <div className="p-space-md @sm:p-space-lg flex flex-col gap-space-lg">
                    {workspace}
                  </div>
                </ScrollArea>
              </div>

              {renderSlot(
                slots.footer,
                {
                  onCopyCSS: handleCopyCSS,
                  isCopied,
                  onDone: onClose,
                  ...slotProps.footer,
                },
                { defaultComponent: ThemeEditorFooter }
              )}
            </>
          )}
        </Card>
      </div>
    </ThemeEditorContext.Provider>
  )
}

export const ThemeEditor = createInterfaceComponent<ThemeEditorProps, ThemeEditorSlots>(
  {
    name: 'ThemeEditor',
    category: 'layout',
    description:
      'Design-studio theme customizer for palettes, optical knobs, semantic color, typography, and a persistent live canvas.',
    version: '1.1.0',
    slots: {
      header: ThemeEditorHeader,
      nav: ThemeEditorNav,
      modeToggle: ThemeEditorModeToggle,
      presets: ThemeEditorPresets,
      knobs: ThemeEditorKnobs,
      colors: ThemeEditorColors,
      typography: ThemeEditorTypography,
      preview: ThemeEditorPreview,
      footer: ThemeEditorFooter,
    },
  },
  ThemeEditorPrimitive
)

/* ==========================================================================
   ThemeEditor Modal Compound Component & Slots
   ========================================================================== */

export interface ThemeEditorModalSlots {
  /** Internal ThemeEditor component slot */
  editor?: React.ComponentType<ThemeEditorProps>
}

export interface ThemeEditorModalProps extends Omit<ModalProps, 'children' | 'slots' | 'slotProps'> {
  /** Whether the modal is open. */
  isOpen: boolean
  /** Callback fired on modal close. */
  onClose: () => void
  /** Slot overrides for internal ThemeEditor. */
  slots?: SlotComponents<ThemeEditorModalSlots>
  /** Slot props for internal ThemeEditor. */
  slotProps?: SlotPropsMap<ThemeEditorModalSlots>
}

const ThemeEditorModalPrimitive = ({
  isOpen,
  onClose,
  slots,
  slotProps,
  ...props
}: ThemeEditorModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose?.()
      }}
      isDismissable
      showCloseButton={false}
      size="xl"
      contentClassName="p-0 bg-transparent border-0 shadow-none max-w-5xl w-full mx-auto h-[85vh] max-h-[85vh]"
      {...props}
    >
      {renderSlot(
        slots?.editor,
        { onClose, className: 'h-full', ...slotProps?.editor },
        { defaultComponent: ThemeEditor }
      ) ?? (
        <ThemeEditor onClose={onClose} className="h-full" />
      )}
    </Modal>
  )
}

export const ThemeEditorModal = createInterfaceComponent<ThemeEditorModalProps, ThemeEditorModalSlots>(
  {
    name: 'ThemeEditorModal',
    category: 'layout',
    description: 'Overlay modal wrapper hosting the full interactive ThemeEditor design studio.',
    version: '1.0.0',
    slots: {
      editor: ThemeEditor,
    },
  },
  ThemeEditorModalPrimitive
)

/* ==========================================================================
   Compound Family Namespace Attachments
   ========================================================================== */

ThemeEditor.Header = ThemeEditorHeader
ThemeEditor.Nav = ThemeEditorNav
ThemeEditor.ModeToggle = ThemeEditorModeToggle
ThemeEditor.Presets = ThemeEditorPresets
ThemeEditor.Knobs = ThemeEditorKnobs
ThemeEditor.Colors = ThemeEditorColors
ThemeEditor.Typography = ThemeEditorTypography
ThemeEditor.Preview = ThemeEditorPreview
ThemeEditor.Footer = ThemeEditorFooter
ThemeEditor.Modal = ThemeEditorModal
