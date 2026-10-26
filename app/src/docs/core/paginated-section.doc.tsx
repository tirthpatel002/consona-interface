import React, { useState } from 'react'
import {
  PaginatedSection,
  PaginatedSectionPagination,
  Badge,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  DocumentTextIcon,
  TagIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/20/solid'

interface ArticleItem {
  id: string
  title: string
  category: string
  author: string
  readTime: string
  snippet: string
}

const mockArticles: ArticleItem[] = [
  { id: '1', title: 'Architecting Scalable React 19 Design Systems', category: 'Frontend', author: 'Elena Rostova', readTime: '5 min', snippet: 'A deep dive into compound components, headless hooks, and token architecture.' },
  { id: '2', title: 'Edge Computing Strategies in Modern Cloud Architectures', category: 'DevOps', author: 'Marcus Vance', readTime: '8 min', snippet: 'Deploying serverless compute closer to global users with sub-millisecond latencies.' },
  { id: '3', title: 'Accessible Web Components: WAI-ARIA and Beyond', category: 'Accessibility', author: 'Sophia Chen', readTime: '4 min', snippet: 'Building inclusive interfaces that work seamlessly with assistive technologies.' },
  { id: '4', title: 'Optimizing Tailwind CSS 4 Engine Performance', category: 'Tooling', author: 'Alex Rivera', readTime: '6 min', snippet: 'How the new Rust-powered compiler speeds up incremental build times.' },
  { id: '5', title: 'Micro-Frontend Microservices Orchestration', category: 'Architecture', author: 'Devon Bell', readTime: '10 min', snippet: 'Independent deployment lifecycles and runtime federation patterns.' },
  { id: '6', title: 'Zero-Trust Security Policies for Modern APIs', category: 'Security', author: 'Elena Rostova', readTime: '7 min', snippet: 'Mutual TLS, JWT attestation, and least-privilege access across distributed clusters.' },
  { id: '7', title: 'Real-time WebSocket Data Synchronization', category: 'Backend', author: 'Marcus Vance', readTime: '5 min', snippet: 'Managing state conflicts and reconnections in high-throughput collaborative apps.' },
  { id: '8', title: 'Designing Token-Based Color Systems', category: 'Design', author: 'Sophia Chen', readTime: '3 min', snippet: 'Harmonious light, dark, and high-contrast color palette generation.' },
  { id: '9', title: 'State Machines for Complex Multi-Step Wizards', category: 'Frontend', author: 'Devon Bell', readTime: '6 min', snippet: 'Eliminating impossible states with deterministic finite-state transition graphs.' },
  { id: '10', title: 'Automated Visual Regression Testing in CI/CD', category: 'DevOps', author: 'Alex Rivera', readTime: '4 min', snippet: 'Pixel-diff pipelines protecting design system component contracts.' },
  { id: '11', title: 'Container Query Driven Responsive Layouts', category: 'Design', author: 'Sophia Chen', readTime: '5 min', snippet: 'Modular widgets adapting to parent width without viewport media query constraints.' },
  { id: '12', title: 'Next-Gen Build Tools & AST Registries', category: 'Tooling', author: 'Elena Rostova', readTime: '9 min', snippet: 'Static analysis and headless component metadata synthesis.' },
]

interface ProductCardItem {
  id: string
  name: string
  price: number
  category: string
  rating: number
  inStock: boolean
}

const mockProducts: ProductCardItem[] = [
  { id: 'p1', name: 'Ultra-Wide 5K Display 34"', price: 1299, category: 'Hardware', rating: 4.9, inStock: true },
  { id: 'p2', name: 'Ergonomic Split Mechanical Keyboard', price: 249, category: 'Peripherals', rating: 4.8, inStock: true },
  { id: 'p3', name: 'Noise-Cancelling Studio Headphones', price: 349, category: 'Audio', rating: 4.7, inStock: false },
  { id: 'p4', name: 'Thunderbolt 4 Docking Station 16-in-1', price: 289, category: 'Peripherals', rating: 4.6, inStock: true },
  { id: 'p5', name: 'High-Precision 8K Laser Mouse', price: 119, category: 'Peripherals', rating: 4.9, inStock: true },
  { id: 'p6', name: 'Adjustable Dual Monitor Arm Desk Mount', price: 179, category: 'Accessories', rating: 4.5, inStock: true },
  { id: 'p7', name: 'Acoustic Studio Desk Light Bar', price: 99, category: 'Lighting', rating: 4.4, inStock: false },
  { id: 'p8', name: 'Wireless Charging Desk Mat (Felt)', price: 79, category: 'Accessories', rating: 4.8, inStock: true },
  { id: 'p9', name: 'USB-C External NVMe Enclosure 40Gbps', price: 149, category: 'Hardware', rating: 4.9, inStock: true },
]

export const paginatedSectionDoc: ComponentDocSpec = {
  id: 'paginated-section',
  name: 'PaginatedSection',
  component: PaginatedSection,
  badge: 'Enterprise Composite',
  summary: 'Intelligent paginated container supporting fixed items-per-page or dynamic viewport height measurement with responsive controls.',
  subcomponents: ['PaginatedSection'],
  playground: {
    defaultProps: {
      mode: 'fixed',
      itemsPerPage: 3,
      showControls: true,
      loading: false,
    },
    controls: [
      { name: 'mode', type: 'select', options: ['fixed', 'auto'] },
      { name: 'itemsPerPage', type: 'number', min: 1, max: 6, step: 1 },
      { name: 'showControls', type: 'boolean' },
      { name: 'loading', type: 'boolean' },
    ],
    render: (props: any) => {
      const [page, setPage] = useState(1)

      return (
        <div className="w-full max-w-xl">
          <PaginatedSection
            items={mockArticles}
            mode={props.mode}
            itemsPerPage={props.itemsPerPage}
            showControls={props.showControls}
            loading={props.loading}
            page={page}
            onPageChange={setPage}
            renderItem={(article) => (
              <div
                key={article.id}
                className="p-4 mb-3 rounded-base border border-border bg-card flex flex-col gap-1.5 transition-colors hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <Badge intent="outline" className="text-xs font-mono">{article.category}</Badge>
                  <span className="text-xs text-muted-fg">{article.readTime}</span>
                </div>
                <h4 className="font-semibold text-fg text-sm mt-1">{article.title}</h4>
                <p className="text-xs text-muted-fg line-clamp-2">{article.snippet}</p>
                <div className="text-[11px] text-muted-fg/80 mt-1 font-medium">By {article.author}</div>
              </div>
            )}
          />
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Dynamic Viewport Measurement Mode',
      description: 'Automatically measures parent container height and dynamically calculates how many cards fit cleanly per page without vertical clipping.',
      render: () => {
        return (
          <div className="w-full max-w-xl">
            <div className="text-xs text-muted-fg mb-2">
              Container fixed at 380px max height — dynamic card viewport calculation:
            </div>
            <PaginatedSection
              items={mockArticles}
              mode="auto"
              maxHeight={380}
              pagination={{
                calculateByViewport: true,
                maxHeight: 380,
                reservedControlHeight: 64,
              }}
              renderItem={(item) => (
                <div key={item.id} className="p-3 mb-2 rounded-base border border-border bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-fg">{item.title}</span>
                    <Badge intent="primary" className="text-[10px]">{item.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-fg mt-1 line-clamp-1">{item.snippet}</p>
                </div>
              )}
            />
          </div>
        )
      },
    },
    {
      title: 'E-Commerce Product Catalog (3-Column Grid)',
      description: 'Paginated grid showing product cards with stock statuses, star ratings, and price readouts.',
      render: () => {
        return (
          <div className="w-full max-w-3xl">
            <PaginatedSection
              items={mockProducts}
              itemsPerPage={3}
              contentClassName="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4"
              renderItem={(product) => (
                <div
                  key={product.id}
                  className="p-4 rounded-base border border-border bg-card flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge intent="outline" className="text-[10px] font-mono">{product.category}</Badge>
                      <span className="text-xs font-bold text-primary">★ {product.rating}</span>
                    </div>
                    <h5 className="font-semibold text-fg text-sm">{product.name}</h5>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-2 border-t border-border/60">
                    <span className="font-mono font-bold text-fg">${product.price}</span>
                    <Badge intent={product.inStock ? 'success' : 'secondary'} className="text-[10px]">
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </div>
                </div>
              )}
            />
          </div>
        )
      },
    },
    {
      title: 'Compact Navigation List with Custom Counter',
      description: 'Dense list format for sidebar widgets, notifications, or activity audits.',
      render: () => {
        return (
          <div className="w-full max-w-md p-4 rounded-base border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="size-4 text-primary" />
                <h4 className="font-semibold text-fg text-sm">Knowledge Base</h4>
              </div>
              <Badge intent="outline" className="font-mono text-xs">{mockArticles.length} total</Badge>
            </div>
            <PaginatedSection
              items={mockArticles}
              itemsPerPage={4}
              renderItem={(item) => (
                <div key={item.id} className="py-2 border-b border-border/40 text-xs flex justify-between items-center">
                  <span className="font-medium text-fg truncate pr-2">{item.title}</span>
                  <span className="text-muted-fg font-mono shrink-0">{item.readTime}</span>
                </div>
              )}
            />
          </div>
        )
      },
    },
    {
      title: 'Dedicated PaginatedSectionPagination Controller',
      description: 'The separate PaginatedSectionPagination control provides accessible first/prev/next/last jumps and gap markers independently.',
      render: () => {
        const [page, setPage] = useState(3)
        const total = 12
        return (
          <div className="w-full max-w-md p-4 rounded-base border border-border bg-card flex flex-col gap-3">
            <div className="text-xs font-semibold text-fg">Standalone Section Pagination</div>
            <PaginatedSectionPagination
              currentPage={page}
              totalPages={total}
              totalItems={60}
              onPageChange={setPage}
              onPrevious={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(total, p + 1))}
              canGoPrevious={page > 1}
              canGoNext={page < total}
              className="bg-transparent border border-border rounded-atom"
            />
          </div>
        )
      },
    },
  ],
  recipes: [
    {
      title: 'Feed Section Preset via PaginatedSection.extend()',
      description: 'Configure standard page chunking and reserved control height.',
      code: `export const ArticleFeedSection = PaginatedSection.extend({\n  name: 'ArticleFeedSection',\n  props: {\n    itemsPerPage: 6,\n    showControls: true,\n  },\n})`,
    },
  ],
  a11yNotes: [
    'Pagination controls announce current page and total pages to screen readers.',
    'Arrow navigation moves between previous and next pages smoothly with focused state preservation.',
  ],
}
