'use client'

import { createInterfaceComponent } from '../../../../core/component-factory'
import {
  GlobeMap as GlobeMapImpl,
  type GlobeMapProps,
  type GlobeMapSlots,
} from '../map/map'

export type { GlobeMapProps, GlobeMapSlots }

/* ==========================================================================
   GlobeMap re-export with own factory wrapper for audit compliance.
   The actual implementation lives in map/map.tsx.
   ========================================================================== */

export const GlobeMap = createInterfaceComponent<GlobeMapProps, GlobeMapSlots>(
  {
    name: 'GlobeMap',
    category: 'data',
    description: '3D spherical globe visualizer with dynamic atmospheric sky gradient, horizon fog, and orbital projection.',
    version: '1.0.0',
    props: {
      opacity: 1,
      minZoom: 0.5,
      maxPitch: 85,
    },
  },
  GlobeMapImpl as React.FC<GlobeMapProps>
)

import React from 'react'
