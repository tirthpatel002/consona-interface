'use client'

import * as React from 'react'
import {
  createInterfaceComponent,
  type SlotComponents,
  type SlotPropsMap,
  type SlotDefinition,
} from '@consona/interface-core'
import { renderSlot } from '@consona/interface-core'
import { type SurfaceFunctionName, type GlassMode } from '../../engine/presets'
import { GLASS_DEFAULTS } from '../../engine/defaults'
import {
  computeSvgFilterParams,
  createGlassWebGLRenderer,
  hexToRgbString,
} from '../../engine/refraction-pipeline'
import { useOptionalGlassEngineState } from '../../context'

export interface GlassFallbackSlotProps {
  /** Error message describing why WebGL or SVG filters are unavailable. */
  errorMessage?: string | null
}

export interface GlassSlots {
  /** Fallback element rendered when shader or filter acceleration is unavailable. */
  fallback?: SlotDefinition<GlassFallbackSlotProps>
}

export interface GlassProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onError'> {
  mode?: GlassMode
  borderRadius?: number
  thickness?: number
  bezelWidth?: number
  refractiveIndex?: number
  scaleRatio?: number
  blur?: number
  specularOpacity?: number
  specularSaturation?: number
  shadowColor?: string
  shadowBlur?: number
  shadowSpread?: number
  tintColor?: string
  tintOpacity?: number
  outerShadowBlur?: number
  outerShadowOpacity?: number
  surfaceFunction?: SurfaceFunctionName
  /** Background image URL for WebGL refraction sampling. Empty = procedural backdrop. */
  backgroundUrl?: string
  onReady?: () => void
  onError?: (error: Error) => void
  slots?: SlotComponents<GlassSlots>
  slotProps?: SlotPropsMap<GlassSlots>
}

function GlassPrimitive(props: GlassProps, ref?: React.Ref<HTMLDivElement>) {
  const engineState = useOptionalGlassEngineState()
  const d = { ...GLASS_DEFAULTS, ...(engineState ?? {}) }

  const {
    mode = d.mode,
    borderRadius = d.borderRadius,
    thickness = d.thickness,
    bezelWidth = d.bezelWidth,
    refractiveIndex = d.refractiveIndex,
    scaleRatio = d.scaleRatio,
    blur = d.blur,
    specularOpacity = d.specularOpacity,
    specularSaturation = d.specularSaturation,
    shadowColor = d.shadowColor,
    shadowBlur = d.shadowBlur,
    shadowSpread = d.shadowSpread,
    tintColor = d.tintColor,
    tintOpacity = d.tintOpacity,
    outerShadowBlur = d.outerShadowBlur,
    outerShadowOpacity = d.outerShadowOpacity,
    surfaceFunction = d.surfaceFunction,
    backgroundUrl = d.backgroundUrl,
    onReady,
    onError,
    slots,
    slotProps,
    className = '',
    style: userStyle,
    children,
    ...rest
  } = props

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const onReadyRef = React.useRef(onReady)
  const onErrorRef = React.useRef(onError)
  onReadyRef.current = onReady
  onErrorRef.current = onError

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [svgUnsupported, setSvgUnsupported] = React.useState(false)

  const rawId = React.useId()
  const filterId = React.useMemo(() => rawId.replace(/:/g, '_') + '_glass_refract', [rawId])

  const filterParams = React.useMemo(
    () =>
      computeSvgFilterParams({
        thickness,
        bezelWidth,
        refractiveIndex,
        scaleRatio,
        blur,
        specularOpacity,
        specularSaturation,
        surfaceFunction,
      }),
    [
      thickness,
      bezelWidth,
      refractiveIndex,
      scaleRatio,
      blur,
      specularOpacity,
      specularSaturation,
      surfaceFunction,
    ]
  )

  React.useEffect(() => {
    if (mode !== 'svg' || typeof window === 'undefined') return
    const probe = CSS.supports?.('backdrop-filter', `url(#${filterId})`)
    if (probe === false) {
      setSvgUnsupported(true)
      setErrorMessage('Backdrop SVG filters are not supported in this browser.')
      onErrorRef.current?.(new Error('Backdrop SVG filters are not supported in this browser.'))
      return
    }
    setSvgUnsupported(false)
    onReadyRef.current?.()
  }, [mode, filterId])

  const currentParamsRef = React.useRef({
    radius: borderRadius,
    bezel: bezelWidth,
    thickness,
    ior: refractiveIndex,
    blur,
    specular: specularOpacity,
    tint: tintOpacity,
    tintColor,
    backgroundUrl,
    surfaceFunction,
    scaleRatio,
    specularSaturation,
    shadowBlur,
    shadowSpread,
  })

  React.useEffect(() => {
    currentParamsRef.current = {
      radius: borderRadius,
      bezel: bezelWidth,
      thickness,
      ior: refractiveIndex,
      blur,
      specular: specularOpacity,
      tint: tintOpacity,
      tintColor,
      backgroundUrl,
      surfaceFunction,
      scaleRatio,
      specularSaturation,
      shadowBlur,
      shadowSpread,
    }
  }, [
    borderRadius,
    bezelWidth,
    thickness,
    refractiveIndex,
    blur,
    specularOpacity,
    tintOpacity,
    tintColor,
    backgroundUrl,
    surfaceFunction,
    scaleRatio,
    specularSaturation,
    shadowBlur,
    shadowSpread,
  ])

  React.useEffect(() => {
    if (mode !== 'webgl' || typeof window === 'undefined') return
    const canvas = canvasRef.current
    if (!canvas) return

    setErrorMessage(null)
    return createGlassWebGLRenderer({
      canvas,
      getParams: () => currentParamsRef.current,
      onReady: () => onReadyRef.current?.(),
      onError: (err) => {
        setErrorMessage(err.message)
        onErrorRef.current?.(err)
      },
    })
  }, [mode])

  const rgbTint = hexToRgbString(tintColor)
  const showFallback = Boolean(errorMessage) || svgUnsupported

  const containerStyles: React.CSSProperties = {
    borderRadius: `${borderRadius}px`,
    border: `1px solid color-mix(in srgb, CanvasText ${Math.min(50, specularOpacity * 40)}%, transparent)`,
    boxShadow: `0px 6px ${outerShadowBlur}px color-mix(in srgb, CanvasText ${outerShadowOpacity * 100}%, transparent)`,
    ...userStyle,
  }

  return (
    <div
      ref={ref}
      className={`relative isolate overflow-hidden ${className}`}
      style={containerStyles}
      {...rest}
    >
      {mode === 'svg' && !svgUnsupported && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="0"
          height="0"
          className="absolute pointer-events-none"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
          colorInterpolationFilters="sRGB"
          aria-hidden="true"
        >
          <defs>
            <filter
              id={filterId}
              x="-5%"
              y="-5%"
              width="110%"
              height="110%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency={filterParams.turbFreq.toFixed(4)}
                numOctaves={String(filterParams.octaveBias)}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={filterParams.dispScale.toFixed(2)}
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />
              <feGaussianBlur
                in="displaced"
                stdDeviation={filterParams.blurVal.toFixed(2)}
                result="blurred"
              />
              <feColorMatrix
                in="blurred"
                type="saturate"
                values={filterParams.satVal.toFixed(2)}
                result="saturated"
              />
              <feGaussianBlur
                in="SourceAlpha"
                stdDeviation={filterParams.alphaBlur.toFixed(1)}
                result="alpha_blur"
              />
              <feSpecularLighting
                in="alpha_blur"
                surfaceScale={filterParams.surfaceScale.toFixed(2)}
                specularConstant={filterParams.specularConstant.toFixed(2)}
                specularExponent="18"
                lightingColor="white"
                result="spec"
              >
                <feDistantLight azimuth="225" elevation="45" />
              </feSpecularLighting>
              <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec_masked" />
              <feBlend in="spec_masked" in2="saturated" mode="screen" result="final" />
            </filter>
          </defs>
        </svg>
      )}

      {mode === 'webgl' && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none rounded-[inherit] -z-10"
        />
      )}

      {mode === 'svg' && !svgUnsupported && (
        <>
          <div
            className="absolute inset-0 -z-10 pointer-events-none rounded-[inherit]"
            style={{
              backdropFilter: `url(#${filterId}) blur(${filterParams.blurVal}px) saturate(${100 + specularSaturation * 20}%)`,
              WebkitBackdropFilter: `url(#${filterId}) blur(${filterParams.blurVal}px) saturate(${100 + specularSaturation * 20}%)`,
            }}
          />
          <div
            className="absolute inset-0 z-0 pointer-events-none rounded-[inherit]"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, Canvas ${specularOpacity * 35}%, transparent) 0%, color-mix(in srgb, Canvas ${specularOpacity * 8}%, transparent) ${bezelWidth * 0.6}px, transparent ${bezelWidth * 1.2}px, transparent calc(100% - ${bezelWidth * 1.2}px), color-mix(in srgb, Canvas ${specularOpacity * 15}%, transparent) 100%)`,
            }}
          />
          <div
            className="absolute inset-0 z-0 pointer-events-none rounded-[inherit]"
            style={{
              boxShadow: [
                `inset 0 1px 1.5px 0 color-mix(in srgb, Canvas ${Math.min(100, specularOpacity * 90)}%, transparent)`,
                `inset 0 0 ${shadowBlur}px ${shadowSpread}px ${shadowColor}`,
                `inset 0 -1px 2px 0 color-mix(in srgb, CanvasText 12%, transparent)`,
              ].join(', '),
              backgroundColor: `rgba(${rgbTint}, ${tintOpacity})`,
            }}
          />
        </>
      )}

      <div className="relative z-10 w-full h-full pointer-events-auto">{children}</div>

      {showFallback &&
        (slots?.fallback ? (
          renderSlot(slots.fallback, {
            errorMessage,
            ...(slotProps?.fallback as Record<string, unknown>),
          })
        ) : (
          <div
            role="alert"
            aria-live="polite"
            className="absolute inset-0 z-30 flex flex-col items-center justify-center p-space-4 text-center text-xs text-muted-fg bg-bg/80 backdrop-blur-md rounded-[inherit]"
          >
            <span className="font-semibold text-fg">Refraction unavailable</span>
            <span className="text-[11px] opacity-80 mt-1">{errorMessage}</span>
          </div>
        ))}
    </div>
  )
}

/**
 * Consona Interface — Glass
 *
 * Refractive glass surface with squircle bezel geometry, specular highlights,
 * and dual SVG / WebGL rendering engines.
 */
export const Glass = createInterfaceComponent<GlassProps, GlassSlots>(
  {
    name: 'Glass',
    category: 'media',
    description:
      'Refractive glass surface with squircle bezel geometry, specular highlights, and dual SVG / WebGL rendering engines.',
    version: '1.0.0',
    props: { ...GLASS_DEFAULTS },
    slots: {
      fallback: undefined,
    },
  },
  GlassPrimitive
)

export default Glass
