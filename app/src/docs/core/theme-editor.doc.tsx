import React, { useState } from 'react'
import {
  ThemeEditor,
  ThemeEditorHeader,
  ThemeEditorModeToggle,
  ThemeEditorPresets,
  ThemeEditorKnobs,
  ThemeEditorColors,
  ThemeEditorTypography,
  ThemeEditorPreview,
  ThemeEditorFooter,
  ThemeEditorModal,
  Button,
  Badge,
} from '@consona/interface'
import { Palette, Sparkles, Sliders } from 'lucide-react'
import type { ComponentDocSpec } from '../types'

export const themeEditorDoc: ComponentDocSpec = {
  id: 'theme-editor',
  name: 'ThemeEditor',
  component: ThemeEditor,
  summary: 'Comprehensive design system & theme customizer capable of dynamically editing palettes, optical curvature, density, elevation, stroke, and typography across the entire app.',
  subcomponents: [
    'ThemeEditorHeader',
    'ThemeEditorNav',
    'ThemeEditorModeToggle',
    'ThemeEditorPresets',
    'ThemeEditorKnobs',
    'ThemeEditorColors',
    'ThemeEditorTypography',
    'ThemeEditorPreview',
    'ThemeEditorFooter',
    'ThemeEditorModal',
  ],
  playground: {
    defaultProps: {
      title: 'Consona Design Studio',
      description: 'Live interactive system-wide theme and design token customizer.',
    },
    controls: [
      { name: 'title', type: 'text' },
      { name: 'description', type: 'text' },
    ],
    render: (props: any) => (
      <div className="@container w-full min-w-0 h-[min(38rem,100%)] min-h-[20rem]">
        <ThemeEditor {...props} />
      </div>
    ),
  },
  examples: [
    {
      title: 'ThemeEditor in Modal Dialog',
      description: 'Trigger the full theme editor modal as an interactive overlay for user settings or design system controls.',
      render: () => {
        const [isOpen, setIsOpen] = useState(false)
        return (
          <div className="flex flex-col items-start gap-4 p-4 rounded-macro bg-secondary/30 border border-border/70 max-w-lg">
            <div>
              <h4 className="text-sm font-bold text-fg">Design System Overlay Modal</h4>
              <p className="text-xs text-muted-fg">Open the ThemeEditor modal overlay to customize all application styles.</p>
            </div>
            <Button
              intent="primary"
              size="sm"
              onPress={() => setIsOpen(true)}
              className="gap-2"
            >
              <Palette className="size-4" />
              Open Theme Editor Modal
            </Button>
            <ThemeEditorModal
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
            />
          </div>
        )
      },
    },
    {
      title: 'Standalone Optical Knobs Panel',
      description: 'Embed the optical scale panel (Curvature, Density, Base Font Size, Elevation, Stroke) inside custom settings or admin views.',
      render: () => {
        const [radius, setRadius] = useState<any>('md')
        const [density, setDensity] = useState<any>('normal')
        const [shadow, setShadow] = useState<any>('subtle')
        const [stroke, setStroke] = useState<any>('standard')
        const [fontSize, setFontSize] = useState<any>('md')

        return (
          <div className="w-full max-w-2xl p-4 rounded-macro bg-bg border border-border/80 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="size-4 text-primary" />
                <span className="text-sm font-bold text-fg">Standalone Optical Knobs</span>
              </div>
              <Badge intent="primary" size="sm">Independent Sub-Component</Badge>
            </div>

            <ThemeEditorKnobs
              radius={radius}
              onRadiusChange={setRadius}
              density={density}
              onDensityChange={setDensity}
              shadow={shadow}
              onShadowChange={setShadow}
              stroke={stroke}
              onStrokeChange={setStroke}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
            />
          </div>
        )
      },
    },
    {
      title: 'Standalone Typography Studio',
      description: 'Independent typography customizer with live specimen scale, font size variants, and Google Font catalog.',
      render: () => {
        const [fontFamily, setFontFamily] = useState('Inter')
        const [fontFamilyMono, setFontFamilyMono] = useState('Geist Mono')
        const [fontSize, setFontSize] = useState<any>('md')

        return (
          <div className="w-full max-w-2xl p-4 rounded-macro bg-bg border border-border/80 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="size-4 text-primary" />
                <span className="text-sm font-bold text-fg">Standalone Typography Studio</span>
              </div>
              <Badge intent="secondary" size="sm">Typography Surface</Badge>
            </div>

            <ThemeEditorTypography
              fontFamily={fontFamily}
              onFontFamilyChange={setFontFamily}
              fontFamilyMono={fontFamilyMono}
              onFontFamilyMonoChange={setFontFamilyMono}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
            />
          </div>
        )
      },
    },
  ],
}

