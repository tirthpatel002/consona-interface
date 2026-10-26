'use client'

import React, { useState, type HTMLAttributes, type ImgHTMLAttributes, type ButtonHTMLAttributes } from 'react'
import {
  MagnifyingGlassPlusIcon,
  PlayIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

// ─── MediaImage ───────────────────────────────────────────────────────────────

export interface MediaImageSlots {
  /** Zoom hover icon */
  zoomIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface MediaImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Aspect ratio preset */
  aspectRatio?: 'video' | 'square' | '4/3' | '3/4' | 'auto'
  /** Show a zoom-to-preview hover overlay */
  zoomable?: boolean
  /** Caption text rendered below the image */
  caption?: string
  /** Object-fit: cover or contain */
  fit?: 'cover' | 'contain'
  /** Slot overrides map */
  slotProps?: SlotPropsMap<MediaImageSlots>
  /** Custom slot components */
  slots?: SlotComponents<MediaImageSlots>
}

function MediaImagePrimitive({
  src,
  alt = '',
  aspectRatio = 'auto',
  zoomable = false,
  caption,
  fit = 'cover',
  className,
  onClick,
  slots,
  slotProps,
  ...props
}: MediaImageProps) {
  const ratioClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '3/4': 'aspect-[3/4]',
    auto: '',
  }[aspectRatio]

  return (
    <figure className="w-full">
      <div
        className={cn(
          'group/img relative overflow-hidden rounded-base bg-muted',
          ratioClass,
          zoomable && 'cursor-zoom-in',
          className
        )}
        onClick={onClick}
      >
        <img
          src={src}
          alt={alt}
          className={cn(
            'size-full transition-transform duration-300 group-hover/img:scale-[1.02]',
            fit === 'cover' ? 'object-cover' : 'object-contain'
          )}
          {...props}
        />
        {zoomable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover/img:bg-black/20 group-hover/img:opacity-100">
            <div className="rounded-full bg-black/40 p-2 backdrop-blur-sm">
              {renderSlot(
                slots?.zoomIcon,
                { className: 'size-5 text-white', ...slotProps?.zoomIcon },
                { defaultComponent: MagnifyingGlassPlusIcon }
              )}
            </div>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-muted-fg">{caption}</figcaption>
      )}
    </figure>
  )
}

export const MediaImage = createInterfaceComponent<MediaImageProps, MediaImageSlots>(
  {
    name: 'MediaImage',
    category: 'media',
    description: 'Responsive media image with aspect-ratio handling, zoom hover overlays and captions.',
    version: '1.0.0',
    slots: {
      zoomIcon: MagnifyingGlassPlusIcon,
    },
  },
  MediaImagePrimitive
)

// ─── MediaPreview (lightbox modal) ───────────────────────────────────────────

export type MediaPreviewType = 'image' | 'video' | 'youtube'

export interface MediaPreviewSource {
  type: MediaPreviewType
  src: string
  /** For youtube: video ID */
  youtubeId?: string
  alt?: string
  title?: string
  poster?: string
}

export interface MediaPreviewSlots {
  /** Close icon */
  closeIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface MediaPreviewProps {
  /** Visibility flag */
  open: boolean
  /** Dismiss callback */
  onClose: () => void
  /** Media source payload */
  media: MediaPreviewSource
  /** Slot overrides map */
  slotProps?: SlotPropsMap<MediaPreviewSlots>
  /** Custom slot components */
  slots?: SlotComponents<MediaPreviewSlots>
}

function MediaPreviewPrimitive({
  open,
  onClose,
  media,
  slots,
  slotProps,
}: MediaPreviewProps) {
  if (!open) return null

  const embedSrc = media.youtubeId
    ? `https://www.youtube.com/embed/${media.youtubeId}?autoplay=1&rel=0`
    : media.src

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={media.title ?? 'Media preview'}
      data-slot="media-preview"
      className="fixed inset-0 z-50 flex items-center justify-center p-space-4 sm:p-space-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" aria-hidden />

      {/* Content */}
      <div
        className={cn(
          'animate-in fade-in zoom-in-95 relative z-10 w-full duration-200',
          media.type === 'image' ? 'max-w-5xl' : 'max-w-4xl aspect-video'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute -right-3 -top-3 z-20 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {renderSlot(
            slots?.closeIcon,
            { className: 'size-4', ...slotProps?.closeIcon },
            { defaultComponent: XMarkIcon }
          )}
        </button>

        {/* Media surface */}
        <div className="overflow-hidden rounded-macro border border-white/10 bg-black shadow-2xl">
          {media.type === 'image' && (
            <img
              src={media.src}
              alt={media.alt ?? ''}
              className="max-h-[80vh] w-full object-contain"
            />
          )}

          {media.type === 'video' && (
            <video
              src={media.src}
              poster={media.poster}
              controls
              autoPlay
              playsInline
              className="aspect-video w-full"
            />
          )}

          {media.type === 'youtube' && (
            <iframe
              src={embedSrc}
              className="aspect-video w-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={media.title ?? 'YouTube video'}
            />
          )}
        </div>

        {/* Title */}
        {media.title && (
          <p className="mt-3 text-center text-sm font-medium text-white/70">{media.title}</p>
        )}
      </div>
    </div>
  )
}

export const MediaPreview = createInterfaceComponent<MediaPreviewProps, MediaPreviewSlots>(
  {
    name: 'MediaPreview',
    category: 'media',
    description: 'Lightbox preview modal supporting images, MP4 videos and YouTube embeds.',
    version: '1.0.0',
    slots: {
      closeIcon: XMarkIcon,
    },
  },
  MediaPreviewPrimitive
)

// ─── ThumbnailButton ──────────────────────────────────────────────────────────

export interface ThumbnailButtonSlots {
  /** Play overlay icon */
  playIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface ThumbnailButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Thumbnail image source URL */
  thumbnailSrc: string
  /** Image alt text */
  thumbnailAlt?: string
  /** Title or label beside thumbnail */
  label?: string
  /** Show YouTube red badge indicator */
  isYouTube?: boolean
  /** Media preview config */
  mediaProps?: Omit<MediaPreviewProps, 'open' | 'onClose'>
  /** Slot overrides map */
  slotProps?: SlotPropsMap<ThumbnailButtonSlots>
  /** Custom slot components */
  slots?: SlotComponents<ThumbnailButtonSlots>
}

function ThumbnailButtonPrimitive({
  thumbnailSrc,
  thumbnailAlt = 'Thumbnail',
  label = 'Play Video',
  isYouTube = false,
  mediaProps,
  className,
  onClick,
  slots,
  slotProps,
  ...props
}: ThumbnailButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && mediaProps) {
      setIsOpen(true)
    }
  }

  return (
    <>
      <button
        type="button"
        data-slot="thumbnail-button"
        onClick={handleClick}
        className={cn(
          'group/thumb relative inline-flex w-max cursor-pointer items-center gap-space-3 rounded-macro border border-border bg-card p-2',
          'shadow-sm transition-all duration-200 hover:shadow-md hover:border-border/80',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'active:scale-[0.98]',
          className
        )}
        {...props}
      >
        {/* Thumbnail */}
        <div className="relative h-[42px] w-[70px] shrink-0 overflow-hidden rounded-base bg-muted">
          <img
            src={thumbnailSrc}
            alt={thumbnailAlt}
            className="size-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
          />

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full border border-white/30 bg-black/50 p-1 backdrop-blur-sm">
              {renderSlot(
                slots?.playIcon,
                { className: 'size-3 text-white translate-x-px', ...slotProps?.playIcon },
                { defaultComponent: PlayIcon }
              )}
            </div>
          </div>

          {/* YouTube badge */}
          {isYouTube && (
            <div className="absolute bottom-0.5 right-0.5 rounded-micro bg-red-600 px-1 py-px text-[8px] font-bold leading-none text-white">
              YT
            </div>
          )}
        </div>

        {/* Label */}
        <span className="pr-2 text-sm font-medium text-fg">{label}</span>
      </button>

      {/* Modal */}
      {mediaProps && (
        <MediaPreview
          open={isOpen}
          onClose={() => setIsOpen(false)}
          media={mediaProps.media}
        />
      )}
    </>
  )
}

export const ThumbnailButton = createInterfaceComponent<
  ThumbnailButtonProps,
  ThumbnailButtonSlots
>(
  {
    name: 'ThumbnailButton',
    category: 'media',
    description: 'Compact interactive thumbnail card button triggering full media lightboxes.',
    version: '1.0.0',
    slots: {
      playIcon: PlayIcon,
    },
  },
  ThumbnailButtonPrimitive
)

// ─── Compound Attachments ───────────────────────────────────────────────────

MediaImage.Preview = MediaPreview
MediaImage.ThumbnailButton = ThumbnailButton

export const { Context: MediaImageContext, useCompoundContext: useMediaImageContext } =
  createCompoundContext<any>('MediaImage')
