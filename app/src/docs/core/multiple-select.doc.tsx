import React, { useState } from 'react'
import {
  MultipleSelect,
  MultipleSelectContent,
  MultipleSelectItem,
  Field,
  Badge,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const SKILLS = [
  { id: 'ts', name: 'TypeScript' },
  { id: 'react', name: 'React' },
  { id: 'tailwind', name: 'Tailwind CSS' },
  { id: 'node', name: 'Node.js' },
  { id: 'graphql', name: 'GraphQL' },
  { id: 'rust', name: 'Rust' },
  { id: 'python', name: 'Python' },
  { id: 'docker', name: 'Docker' },
]

export const multipleSelectDoc: ComponentDocSpec = {
  id: 'multiple-select',
  name: 'MultipleSelect',
  component: MultipleSelect,
  summary: 'Multi-selection input with removable pill chips, tag wrapping, search filter, and dropdown listbox.',
  subcomponents: ['MultipleSelectContent', 'MultipleSelectItem'],
  playground: {
    defaultProps: {
      placeholder: 'Select tech stack skills...',
    },
    controls: [],
    render: (props: any) => (
      <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto w-full">
        <Field className="w-full">
          <Field.Label>Engineering Skills</Field.Label>
          <MultipleSelect
            items={SKILLS}
            defaultSelectedKeys={['ts', 'react']}
            {...props}
          />
          <Field.Description>Click to add or remove skills with interactive pill badges.</Field.Description>
        </Field>
      </div>
    ),
  },
  examples: [
    {
      title: 'Tag Picker & Removable Chips',
      description: 'Dynamic tag selection with search filtering in popover dropdown.',
      render: () => {
        const [selected, setSelected] = useState<any>(new Set(['ts', 'tailwind', 'rust']))
        return (
          <div className="flex flex-col gap-4 p-4 max-w-md">
            <Field>
              <Field.Label>Assigned Technologies</Field.Label>
              <MultipleSelect
                items={SKILLS}
                selectedKeys={selected}
                onSelectionChange={setSelected}
                placeholder="Assign technologies..."
              />
            </Field>
          </div>
        )
      },
    },
  ],
}
