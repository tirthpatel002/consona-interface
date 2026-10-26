import React, { useState } from 'react'
import {
  SearchField,
  SearchInput,
  Field,
  Badge,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const searchFieldDoc: ComponentDocSpec = {
  id: 'search-field',
  name: 'SearchField',
  component: SearchField,
  summary: 'Accessible search input with leading search icon, clear button, loading state slot, and shortcut badge.',
  subcomponents: ['SearchInput'],
  playground: {
    defaultProps: {
      placeholder: 'Search documentation...',
      isLoading: false,
      isDisabled: false,
    },
    controls: [
      { name: 'placeholder', type: 'text' },
      { name: 'isLoading', type: 'boolean' },
      { name: 'isDisabled', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="flex flex-col items-center justify-center p-8 max-w-sm mx-auto w-full">
        <SearchField {...props}>
          <SearchInput placeholder={props.placeholder} shortcut="⌘K" isLoading={props.isLoading} />
        </SearchField>
      </div>
    ),
  },
  examples: [
    {
      title: 'Global Search with Shortcut Badge',
      description: 'Search box equipped with keyboard accelerator badge and clear trigger.',
      render: () => {
        const [query, setQuery] = useState('')
        return (
          <div className="flex flex-col gap-4 p-4 max-w-md">
            <SearchField value={query} onChange={setQuery}>
              <SearchInput placeholder="Search components, guides, tokens..." shortcut="⌘K" />
            </SearchField>
            {query && (
              <span className="text-xs text-muted-fg font-mono">
                Query: <span className="text-fg font-semibold">{query}</span>
              </span>
            )}
          </div>
        )
      },
    },
    {
      title: 'Live Async Loading State',
      description: 'Dynamic search input presenting interactive loader slot during active requests.',
      render: () => (
        <div className="flex flex-col gap-4 p-4 max-w-md">
          <SearchField defaultValue="Tailwind Variants">
            <SearchInput isLoading placeholder="Filtering results..." />
          </SearchField>
        </div>
      ),
    },
  ],
}
