import React, { useState } from 'react'
import {
  DropZone,
} from '@consona/interface'
import { UploadCloud, FileText } from 'lucide-react'
import type { ComponentDocSpec } from '../types'

export const dropZoneDoc: ComponentDocSpec = {
  id: 'drop-zone',
  name: 'DropZone',
  component: DropZone,
  summary: 'Drag-and-drop file upload target zone with active hover states, visual drop indicators, and accessible keyboard fallback.',
  subcomponents: [],
  playground: {
    defaultProps: {
      heading: 'Drag and drop files here',
      description: 'Supports PNG, JPG, PDF up to 25MB',
      isDisabled: false,
    },
    controls: [
      { name: 'heading', type: 'text' },
      { name: 'description', type: 'text' },
      { name: 'isDisabled', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto w-full">
        <DropZone {...props} className="w-full" />
      </div>
    ),
  },
  examples: [
    {
      title: 'Interactive Drop Handling',
      description: 'Listening to drop events and displaying file names dynamically.',
      render: () => {
        const [dropped, setDropped] = useState<string[]>([])
        return (
          <div className="w-full max-w-md space-y-3">
            <DropZone
              onDrop={async (e) => {
                const names = e.items
                  .filter((item) => item.kind === 'file')
                  .map((item) => item.name)
                if (names.length > 0) setDropped(names)
              }}
              heading="Upload project assets"
              description="Drop files here or click to browse"
            />
            {dropped.length > 0 && (
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                <p className="text-xs font-medium text-fg">Dropped files ({dropped.length}):</p>
                <ul className="mt-1 text-xs text-muted-fg list-disc list-inside">
                  {dropped.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: 'Custom Icon & State',
      description: 'DropZone with customized iconography and disabled state.',
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          <DropZone
            icon={<FileText className="size-5" />}
            heading="Upload Documents"
            description="PDF, DOCX, XLSX spreadsheets"
          />
          <DropZone
            isDisabled
            heading="Uploads Disabled"
            description="Maintenance window in progress"
          />
        </div>
      ),
    },
  ],
}
