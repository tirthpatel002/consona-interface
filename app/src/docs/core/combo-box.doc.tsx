import React, { useState } from 'react'
import {
  ComboBox,
  ComboBoxInput,
  ComboBoxContent,
  ComboBoxItem,
  Field,
  Badge,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const FRAMEWORKS = [
  { id: 'react', name: 'React' },
  { id: 'vue', name: 'Vue.js' },
  { id: 'svelte', name: 'Svelte' },
  { id: 'angular', name: 'Angular' },
  { id: 'solid', name: 'SolidJS' },
  { id: 'next', name: 'Next.js' },
  { id: 'remix', name: 'Remix' },
  { id: 'astro', name: 'Astro' },
]

export const comboBoxDoc: ComponentDocSpec = {
  id: 'combo-box',
  name: 'ComboBox',
  component: ComboBox,
  summary: 'Filterable auto-complete dropdown select input with keyboard navigation and listbox selection.',
  subcomponents: ['ComboBoxInput', 'ComboBoxContent', 'ComboBoxItem'],
  playground: {
    defaultProps: {
      defaultSelectedKey: 'react',
      isDisabled: false,
    },
    controls: [
      { name: 'isDisabled', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="flex flex-col items-center justify-center p-8 max-w-sm mx-auto w-full">
        <Field className="w-full">
          <Field.Label>Frontend Framework</Field.Label>
          <ComboBox defaultItems={FRAMEWORKS} {...props}>
            <ComboBoxInput placeholder="Select or type to filter..." />
            <ComboBoxContent>
              {(item: any) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
            </ComboBoxContent>
          </ComboBox>
          <Field.Description>Type to filter frameworks dynamically.</Field.Description>
        </Field>
      </div>
    ),
  },
  examples: [
    {
      title: 'Auto-Complete Framework Selector',
      description: 'Filterable options with keyboard navigation and clear selection indicators.',
      render: () => {
        const [selected, setSelected] = useState<any>('react')
        return (
          <div className="flex flex-col gap-4 p-4 max-w-sm">
            <Field>
              <Field.Label>Technology Stack</Field.Label>
              <ComboBox
                selectedKey={selected}
                onSelectionChange={setSelected}
                defaultItems={FRAMEWORKS}
              >
                <ComboBoxInput placeholder="Search technologies..." />
                <ComboBoxContent>
                  {(item: any) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
                </ComboBoxContent>
              </ComboBox>
            </Field>
            <span className="text-xs font-mono text-muted-fg">
              Active Key: <span className="text-primary font-semibold">{String(selected)}</span>
            </span>
          </div>
        )
      },
    },
    {
      title: 'Autocomplete Search with Items',
      description: 'Dynamic search completion showing real-time filtering as you type.',
      render: () => {
        const [value, setValue] = useState<any>(null)
        return (
          <div className="flex flex-col gap-4 p-4 max-w-sm">
            <Field>
              <Field.Label>Quick Lookup</Field.Label>
              <ComboBox
                selectedKey={value}
                onSelectionChange={setValue}
                defaultItems={FRAMEWORKS}
              >
                <ComboBox.Input placeholder="Type to autocomplete (e.g. Next, React)..." />
                <ComboBox.Content>
                  {(item: any) => (
                    <ComboBox.Item id={item.id} textValue={item.name}>
                      {item.name}
                    </ComboBox.Item>
                  )}
                </ComboBox.Content>
              </ComboBox>
            </Field>
          </div>
        )
      },
    },
  ],
}
