import React, { useState } from 'react'
import {
  Pagination,
  PaginationList,
  PaginationPages,
  PaginationPrevious,
  PaginationNext,
  PaginationStart,
  PaginationEnd,
  PaginationSpacer,
  PaginationLabel,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const TOTAL_PAGES = 100

const PaginationPlayground = (props: any) => {
  const [currentPage, setCurrentPage] = useState(42)

  return (
    <div className="w-full max-w-3xl p-4 sm:p-8 flex justify-center">
      <Pagination>
        <PaginationPrevious
          href="#"
          onClick={(event) => {
            event.preventDefault()
            setCurrentPage((p) => Math.max(1, p - 1))
          }}
          {...props}
        />
        <PaginationStart
          href="#"
          page={1}
          isCurrent={currentPage === 1}
          onClick={(event) => {
            event.preventDefault()
            setCurrentPage(1)
          }}
          {...props}
        />
        <PaginationList>
          <PaginationPages
            page={currentPage}
            pageCount={TOTAL_PAGES}
            onPageChange={setCurrentPage}
            {...props}
          />
        </PaginationList>
        <PaginationEnd
          href="#"
          page={TOTAL_PAGES}
          isCurrent={currentPage === TOTAL_PAGES}
          onClick={(event) => {
            event.preventDefault()
            setCurrentPage(TOTAL_PAGES)
          }}
          {...props}
        />
        <PaginationNext
          href="#"
          onClick={(event) => {
            event.preventDefault()
            setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1))
          }}
          {...props}
        />
      </Pagination>
    </div>
  )
}

const PaginationExample = () => {
  const [page, setPage] = useState(42)
  const pageSize = 10
  const totalItems = TOTAL_PAGES * pageSize
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div className="w-full max-w-3xl p-4">
      <Pagination>
        <PaginationLabel>
          Showing <strong>{from}</strong> to <strong>{to}</strong> of <strong>{totalItems}</strong> records
        </PaginationLabel>
        <PaginationSpacer />
        <PaginationPrevious
          href="#"
          onClick={(event) => {
            event.preventDefault()
            setPage((p) => Math.max(1, p - 1))
          }}
        />
        <PaginationStart
          href="#"
          page={1}
          isCurrent={page === 1}
          onClick={(event) => {
            event.preventDefault()
            setPage(1)
          }}
        />
        <PaginationList>
          <PaginationPages
            page={page}
            pageCount={TOTAL_PAGES}
            onPageChange={setPage}
          />
        </PaginationList>
        <PaginationEnd
          href="#"
          page={TOTAL_PAGES}
          isCurrent={page === TOTAL_PAGES}
          onClick={(event) => {
            event.preventDefault()
            setPage(TOTAL_PAGES)
          }}
        />
        <PaginationNext
          href="#"
          onClick={(event) => {
            event.preventDefault()
            setPage((p) => Math.min(TOTAL_PAGES, p + 1))
          }}
        />
      </Pagination>
    </div>
  )
}

export const paginationDoc: ComponentDocSpec = {
  id: 'pagination',
  name: 'Pagination',
  component: Pagination,
  summary: 'Accessible page navigation system with first/last jumps, adjacent steppers, and page number matrices.',
  subcomponents: [
    'PaginationList',
    'PaginationItem',
    'PaginationPages',
    'PaginationStart',
    'PaginationEnd',
    'PaginationFirst',
    'PaginationPrevious',
    'PaginationNext',
    'PaginationLast',
    'PaginationGap',
    'PaginationSpacer',
    'PaginationLabel',
  ],
  playground: {
    defaultProps: {
      isCircle: false,
      size: 'md',
    },
    controls: [
      { name: 'isCircle', type: 'boolean' },
      { name: 'size', type: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    ],
    render: (props: any) => <PaginationPlayground {...props} />,
  },
  examples: [
    {
      title: '100 pages with range summary',
      description: 'First and last page stay pinned outside the scroller and disable when that end is on screen.',
      render: () => <PaginationExample />,
    },
  ],
}
