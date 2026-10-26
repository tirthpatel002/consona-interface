import React, { useState } from 'react'
import {
  MediaImage,
  MediaPreview,
  ThumbnailButton,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const mediaImageDoc: ComponentDocSpec = {
  id: 'media-image',
  name: 'Media Image',
  component: MediaImage,
  summary: 'Image and video presentation surfaces with aspect ratio presets, hover zoom overlays, modal lightboxes, and video trigger cards.',
  subcomponents: [
    'MediaImage',
    'MediaPreview',
    'ThumbnailButton',
  ],
  playground: {
    defaultProps: {
      aspectRatio: 'video',
      zoomable: true,
      fit: 'cover',
      caption: 'Sample landscape photography with optical framing',
    },
    controls: [
      {
        name: 'aspectRatio',
        type: 'select',
        options: ['video', 'square', '4/3', '3/4', 'auto'],
      },
      {
        name: 'zoomable',
        type: 'boolean',
      },
      {
        name: 'fit',
        type: 'select',
        options: ['cover', 'contain'],
      },
      {
        name: 'caption',
        type: 'text',
      },
    ],
    render: (props) => (
      <div className="w-full max-w-md">
        <MediaImage
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop"
          alt="Yosemite Valley"
          aspectRatio={props.aspectRatio}
          zoomable={props.zoomable}
          fit={props.fit}
          caption={props.caption}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Video Thumbnail Button with Dialog Lightbox',
      description: 'Compact card preview button that opens a high-definition video modal.',
      render: () => (
        <div className="flex flex-col gap-4">
          <ThumbnailButton
            thumbnailSrc="https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&auto=format&fit=crop"
            label="Watch Documentary Preview"
            mediaProps={{
              media: {
                type: 'video',
                src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                title: 'Documentary Preview',
              },
            }}
          />
        </div>
      ),
    },
  ],
}
