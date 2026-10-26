import React, { useState } from 'react'
import {
  DataSelectionBar,
  Badge,
  Button,
  type FieldDefinition,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  PlusIcon,
  ArrowDownTrayIcon,
  TagIcon,
} from '@heroicons/react/20/solid'

interface ProductRecord {
  id: string
  name: string
  category: string
  price: number
  inStock: boolean
  rating: number
}

const sampleProducts: ProductRecord[] = [
  { id: '1', name: 'Ultra-Wide Curved Monitor 34"', category: 'Electronics', price: 799, inStock: true, rating: 4.8 },
  { id: '2', name: 'Mechanical Ergonomic Keyboard', category: 'Accessories', price: 189, inStock: true, rating: 4.9 },
  { id: '3', name: 'Noise-Cancelling Studio Headphones', category: 'Audio', price: 349, inStock: false, rating: 4.7 },
  { id: '4', name: 'USB-C Thunderbolt Dock 12-in-1', category: 'Accessories', price: 229, inStock: true, rating: 4.5 },
  { id: '5', name: 'High-Fidelity Studio Microphone', category: 'Audio', price: 149, inStock: true, rating: 4.6 },
  { id: '6', name: 'Smart Desk Light Bar', category: 'Lighting', price: 89, inStock: false, rating: 4.3 },
]

const productFields: FieldDefinition<ProductRecord>[] = [
  { key: 'name', label: 'Product Name', type: 'string', filterable: true, sortable: true },
  {
    key: 'category',
    label: 'Category',
    type: 'enum',
    category: true,
    filterable: true,
    sortable: true,
    enumValues: ['Electronics', 'Accessories', 'Audio', 'Lighting'],
  },
  { key: 'price', label: 'Price ($)', type: 'number', filterable: true, sortable: true },
  { key: 'inStock', label: 'In Stock', type: 'boolean', filterable: true, sortable: true },
]

export const dataSelectionBarDoc: ComponentDocSpec = {
  id: 'data-selection-bar',
  name: 'DataSelectionBar',
  component: DataSelectionBar,
  badge: 'Enterprise Composite',
  summary: 'Unified filtering and query command bar with multi-operator rule builders, debounced search, category quick-filters, sorting popovers, and active token chips.',
  subcomponents: [
    'DataSelectionBar',
    'DataSelectionBar.Search',
    'DataSelectionBar.CategorySelect',
    'DataSelectionBar.FilterBuilder',
    'DataSelectionBar.SortMenu',
    'DataSelectionBar.FilterStrip',
    'DataSelectionBar.FilterBadge',
    'DataSelectionBar.Actions',
  ],
  playground: {
    defaultProps: {
      showSearch: true,
      showFilters: true,
      showCategory: true,
      showSort: true,
    },
    controls: [
      { name: 'showSearch', type: 'boolean' },
      { name: 'showFilters', type: 'boolean' },
      { name: 'showCategory', type: 'boolean' },
      { name: 'showSort', type: 'boolean' },
    ],
    render: (props: any) => {
      const [filtered, setFiltered] = useState<ProductRecord[]>(sampleProducts)

      return (
        <div className="flex flex-col gap-4 w-full">
          <DataSelectionBar
            data={sampleProducts}
            fields={productFields}
            onDataChange={setFiltered}
            showSearch={props.showSearch}
            showFilters={props.showFilters}
            showCategory={props.showCategory}
            showSort={props.showSort}
            searchPlaceholder="Filter product catalog..."
            extraActions={
              <Button size="sm" intent="primary">
                <PlusIcon className="size-4" />
                Add Item
              </Button>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="p-4 rounded-base border border-border bg-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Badge intent="outline" className="text-xs font-mono">{product.category}</Badge>
                    <span className="text-xs font-semibold text-primary">★ {product.rating}</span>
                  </div>
                  <h4 className="font-semibold text-fg text-sm mt-2">{product.name}</h4>
                </div>
                <div className="flex items-center justify-between mt-4 pt-2 border-t border-border">
                  <span className="font-mono font-bold text-fg">${product.price}</span>
                  <Badge intent={product.inStock ? 'success' : 'secondary'} className="text-xs">
                    {product.inStock ? 'In Stock' : 'Backorder'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-fg border border-dashed border-border rounded-base">
              No products match the selected criteria.
            </div>
          )}
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Active Filter Tokens and Dynamic Querying',
      description: 'Filter rules automatically construct removable badge tokens with clear all functionality.',
      render: () => {
        const [results, setResults] = useState<ProductRecord[]>(sampleProducts)

        return (
          <div className="w-full">
            <DataSelectionBar
              data={sampleProducts}
              fields={productFields}
              onDataChange={setResults}
              initialFilters={[
                { field: 'category', operator: 'equals', value: 'Accessories' },
              ]}
            />
            <div className="mt-3 text-xs text-muted-fg">
              Matching Records: <strong className="text-fg">{results.length}</strong>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Custom Layout with Compound Components',
      description: 'Deconstruct the toolbar using DataSelectionBar subcomponents with custom positioning.',
      render: () => {
        const [results, setResults] = useState<ProductRecord[]>(sampleProducts)

        return (
          <div className="w-full">
            <DataSelectionBar
              data={sampleProducts}
              fields={productFields}
              onDataChange={setResults}
            >
              {({ state }) => (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <DataSelectionBar.Search placeholder="Custom quick finder..." />
                    <DataSelectionBar.CategorySelect />
                    <DataSelectionBar.FilterBuilder triggerLabel="Custom Filter" />
                    <DataSelectionBar.SortMenu />
                    <DataSelectionBar.Actions>
                      <Button size="sm" intent="outline">
                        Export ({state.filteredData.length})
                      </Button>
                    </DataSelectionBar.Actions>
                  </div>
                  <DataSelectionBar.FilterStrip />
                </div>
              )}
            </DataSelectionBar>
          </div>
        )
      },
    },
  ],
  recipes: [
    {
      title: 'Data Toolbar Preset via DataSelectionBar.extend()',
      description: 'Configure standard catalog search parameters across application views.',
      code: `export const CatalogToolbar = DataSelectionBar.extend({\n  name: 'CatalogToolbar',\n  props: {\n    searchDebounceMs: 300,\n    showSort: true,\n  },\n})`,
    },
  ],
  a11yNotes: [
    'Filter rules builder uses accessible popovers with focus trapping.',
    'Filter token badges are interactive with keyboard dismiss actions (Enter/Space on close button).',
    'Category selector integrates accessible native select semantics.',
  ],
}
