import React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselHandler,
  CarouselButton,
  CarouselDots,
  CarouselProgress,
  CarouselCounter,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const slideImages = [
  { id: 1, title: 'Mountain Vista', color: 'from-blue-600 to-indigo-900' },
  { id: 2, title: 'Desert Sunset', color: 'from-amber-500 to-rose-700' },
  { id: 3, title: 'Nordic Forest', color: 'from-emerald-600 to-teal-900' },
  { id: 4, title: 'Urban Skyline', color: 'from-purple-600 to-violet-950' },
]

export const carouselDoc: ComponentDocSpec = {
  id: 'carousel',
  name: 'Carousel',
  component: Carousel,
  summary: 'Touch and mouse draggable slide carousel powered by Embla engine with indicators, thumbnail strip, and slide progression.',
  subcomponents: [
    'CarouselContent',
    'CarouselItem',
    'CarouselHandler',
    'CarouselButton',
    'CarouselDots',
    'CarouselThumb',
    'CarouselThumbnails',
    'CarouselThumbs',
    'CarouselProgress',
    'CarouselCounter',
  ],
  playground: {
    defaultProps: {
      orientation: 'horizontal',
    },
    controls: [
      { name: 'orientation', type: 'select', options: ['horizontal', 'vertical'] },
    ],
    render: (props: any) => (
      <div className="w-full max-w-lg p-4">
        <Carousel {...props} className="w-full">
          <CarouselContent>
            {slideImages.map((slide) => (
              <CarouselItem key={slide.id} className="basis-full">
                <div
                  className={`h-52 rounded-macro bg-gradient-to-br ${slide.color} flex flex-col items-center justify-center text-white p-6 shadow-xs select-none`}
                >
                  <span className="text-xl font-bold">{slide.title}</span>
                  <span className="text-xs text-white/70 mt-1 font-mono">Slide {slide.id} of {slideImages.length}</span>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="flex items-center justify-between mt-3 px-1">
            <CarouselDots count={slideImages.length} />
            <CarouselCounter count={slideImages.length} />
            <CarouselHandler className="mt-0">
              <CarouselButton segment="previous" />
              <CarouselButton segment="next" />
            </CarouselHandler>
          </div>
        </Carousel>
      </div>
    ),
  },
  examples: [
    {
      title: 'Progress Meter Strip',
      description: 'Carousel with a continuous progress bar indicating current position across slides.',
      render: () => (
        <div className="w-full max-w-md p-4 bg-muted/20 rounded-macro border border-border">
          <Carousel>
            <CarouselContent>
              {[1, 2, 3].map((num) => (
                <CarouselItem key={num} className="basis-full">
                  <div className="h-36 rounded-base bg-secondary/50 flex items-center justify-center font-bold text-fg">
                    Showcase Feature #{num}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-3 space-y-2">
              <CarouselProgress count={3} />
              <div className="flex justify-end gap-1.5">
                <CarouselButton segment="previous" size="sq-xs" />
                <CarouselButton segment="next" size="sq-xs" />
              </div>
            </div>
          </Carousel>
        </div>
      ),
    },
  ],
}
