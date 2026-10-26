import React, { useState } from 'react'
import {
  FileTrigger,
  Button,
} from '@consona/interface'
import { Upload, Camera, FolderOpen } from 'lucide-react'
import type { ComponentDocSpec } from '../types'

export const fileTriggerDoc: ComponentDocSpec = {
  id: 'file-trigger',
  name: 'FileTrigger',
  component: FileTrigger,
  summary: 'Accessible file picker trigger that binds native file dialogues to arbitrary child elements with multi-file and directory support.',
  subcomponents: [],
  playground: {
    defaultProps: {
      allowsMultiple: false,
      acceptDirectory: false,
      iconVariant: 'upload',
      intent: 'outline',
      size: 'sm',
    },
    controls: [
      { name: 'allowsMultiple', type: 'boolean' },
      { name: 'acceptDirectory', type: 'boolean' },
      { name: 'iconVariant', type: 'select', options: ['upload', 'paperclip', 'camera', 'folder', 'document', 'image', 'video', 'none'] },
      { name: 'intent', type: 'select', options: ['outline', 'primary', 'secondary', 'subtle', 'danger'] },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'] },
    ],
    render: (props: any) => (
      <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto w-full">
        <FileTrigger {...props} />
      </div>
    ),
  },
  examples: [
    {
      title: 'File, Multiple Images, and Directory Pickers with Built-in Icon Variants',
      description: 'Triggering various file formats and native picker scopes using preset icon variants.',
      render: () => {
        const [files, setFiles] = useState<string[]>([])
        return (
          <div className="flex flex-col gap-3 items-start">
            <div className="flex flex-wrap items-center gap-3">
              <FileTrigger
                iconVariant="upload"
                intent="outline"
                size="sm"
                onSelect={(e) => {
                  if (e) setFiles(Array.from(e).map((f) => f.name))
                }}
              >
                Select Files
              </FileTrigger>

              <FileTrigger
                allowsMultiple
                iconVariant="camera"
                intent="secondary"
                size="sm"
                acceptedFileTypes={['image/png', 'image/jpeg']}
                onSelect={(e) => {
                  if (e) setFiles(Array.from(e).map((f) => f.name))
                }}
              >
                Select Images (Multiple)
              </FileTrigger>

              <FileTrigger
                acceptDirectory
                iconVariant="folder"
                intent="subtle"
                size="sm"
                onSelect={(e) => {
                  if (e) setFiles(Array.from(e).map((f) => f.name))
                }}
              >
                Select Directory
              </FileTrigger>
            </div>

            {files.length > 0 && (
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3 w-full max-w-sm">
                <p className="text-xs font-medium text-fg">Selected items ({files.length}):</p>
                <ul className="mt-1 text-xs text-muted-fg list-disc list-inside">
                  {files.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      },
    },
  ],
}
