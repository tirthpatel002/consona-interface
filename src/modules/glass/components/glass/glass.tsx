import * as React from 'react'
import {
  createInterfaceComponent,
  type SlotComponents,
  type SlotPropsMap,
  type SlotDefinition,
} from '../../../../core'
import { renderSlot } from '../../../../core/slot-resolver'
import {
  type SurfaceFunctionName,
  type GlassMode,
} from '../../engine/presets'
import {
  buildSvgFilterXml,
  createGlassWebGLRenderer,
  hexToRgbString,
} from '../../engine/refraction-pipeline'

export interface GlassFallbackSlotProps {
  /** Error message describing why WebGL or SVG filters are unsupported. */
  errorMessage?: string | null
}

export interface GlassSlots {
  /** Fallback element rendered when shader or filter acceleration is unavailable. */
  fallback?: SlotDefinition<GlassFallbackSlotProps>
}

export interface GlassProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onError'> {
  /** Rendering engine mode: 'svg' (SVG feDisplacementMap filter) or 'webgl' (GLSL ray refraction shader). */
  mode?: GlassMode
  /** Border radius curvature in pixels (default: 48). */
  borderRadius?: number
  /** Physical glass thickness (10 - 200, default: 80). Controls refractive light deflection magnitude. */
  thickness?: number
  /** Bezel border slope width in pixels (2 - 60, default: 60). */
  bezelWidth?: number
  /** Index of Refraction / IOR (1.0 - 3.0, default: 3.0). Standard glass is ~1.5, liquid diamond up to 3.0. */
  refractiveIndex?: number
  /** Refraction displacement scale ratio multiplier (0.0 - 2.0, default: 1.0). */
  scaleRatio?: number
  /** Backdrop blur radius in pixels (0.0 - 12.0, default: 0.3). */
  blur?: number
  /** Specular highlight opacity (0.0 - 1.0, default: 0.5). */
  specularOpacity?: number
  /** Specular highlight saturation multiplier (0 - 12, default: 4). */
  specularSaturation?: number
  /** Inner specular / rim shadow color (hex or rgba, default: '#ffffff'). */
  shadowColor?: string
  /** Inner shadow blur radius in pixels (0 - 40, default: 20). */
  shadowBlur?: number
  /** Inner shadow spread distance in pixels (-15 - 10, default: -5). */
  shadowSpread?: number
  /** Glass tint color (hex or rgb, default: '#ffffff'). */
  tintColor?: string
  /** Glass tint opacity (0.0 - 0.4, default: 0.06). */
  tintOpacity?: number
  /** Outer drop shadow blur in pixels (0 - 50, default: 24). */
  outerShadowBlur?: number
  /** Outer drop shadow opacity multiplier (0.0 - 1.0, default: 0.18). */
  outerShadowOpacity?: number
  /** Mathematical profile curve for the glass rim ('convex_squircle' | 'convex_circle' | 'concave' | 'lip', default: 'convex_squircle'). */
  surfaceFunction?: SurfaceFunctionName
  /** Background wallpaper image URL for WebGL refraction sampling. */
  backgroundUrl?: string
  /** Callback fired when WebGL / SVG filter rendering is initialized. */
  onReady?: () => void
  /** Callback fired when rendering encounters an error. */
  onError?: (error: Error) => void
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<GlassSlots>
  /** Slot prop overrides for downstream customization. */
  slotProps?: SlotPropsMap<GlassSlots>
}

function GlassPrimitive(props: GlassProps, ref?: React.Ref<HTMLDivElement>) {
  const {
    mode = 'svg',
    borderRadius = 48,
    thickness = 80,
    bezelWidth = 60,
    refractiveIndex = 3.0,
    scaleRatio = 1.0,
    blur = 0.3,
    specularOpacity = 0.5,
    specularSaturation = 4,
    shadowColor = '#ffffff',
    shadowBlur = 20,
    shadowSpread = -5,
    tintColor = '#ffffff',
    tintOpacity = 0.06,
    outerShadowBlur = 24,
    outerShadowOpacity = 0.18,
    surfaceFunction = 'convex_squircle',
    backgroundUrl = 'https://images.unsplash.com/photo-1789660817213-260c3815de6f?q=80&w=2274&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    onReady,
    onError,
    slots,
    slotProps,
    className = '',
    style: userStyle,
    children,
    ...rest
  } = props

  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const rawId = React.useId()
  const filterId = React.useMemo(() => rawId.replace(/:/g, '_') + '_glass_refract', [rawId])

  // Pure Vector SVG Filter calculation (100% resolution independent, no canvas, no dataURLs)
  const { filterXml } = React.useMemo(() => {
    return buildSvgFilterXml({
      filterId,
      thickness,
      bezelWidth,
      refractiveIndex,
      scaleRatio,
      blur,
      specularOpacity,
      specularSaturation,
      surfaceFunction,
    })
  }, [
    filterId,
    thickness,
    bezelWidth,
    refractiveIndex,
    scaleRatio,
    blur,
    specularOpacity,
    specularSaturation,
    surfaceFunction,
  ])

  React.useEffect(() => {
    if (mode === 'svg') {
      onReady?.()
    }
  }, [mode, onReady])

  // WebGL Shader Pipeline
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
  ])

  React.useEffect(() => {
    if (mode !== 'webgl' || typeof window === 'undefined') return
    const canvas = canvasRef.current
    if (!canvas) return

    const cleanup = createGlassWebGLRenderer({
      canvas,
      getParams: () => currentParamsRef.current,
      onReady,
      onError: (err) => {
        setErrorMessage(err.message)
        onError?.(err)
      },
    })

    return () => cleanup()
  }, [mode, onReady, onError])

  const rgbTint = hexToRgbString(tintColor)

  const containerStyles: React.CSSProperties = {
    borderRadius: `${borderRadius}px`,
    border: `1px solid rgba(255, 255, 255, ${Math.min(0.5, specularOpacity * 0.4)})`,
    boxShadow: `0px 6px ${outerShadowBlur}px rgba(0, 0, 0, ${outerShadowOpacity})`,
    ...userStyle,
  }

  // Refraction dispersion scale for pure SVG mode
  const dispScale = Math.max(0.5, (refractiveIndex - 1.0) * (thickness / 6) * scaleRatio)
  const turbFreq = Math.max(0.003, 0.02 / Math.max(1, bezelWidth / 20))
  const satVal = Math.max(1.0, 1.0 + specularSaturation * 0.25)
  const blurVal = Math.max(0.1, blur)
  const surfaceScale = Math.max(1.0, (thickness / 15) * Math.max(0.2, specularOpacity))

  return (
    <div
      ref={(node) => {
        containerRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }}
      className={`relative isolate overflow-hidden ${className}`}
      style={containerStyles}
      {...rest}
    >
      {/* Hidden Pure Vector SVG Filter for mode="svg" */}
      {mode === 'svg' && (
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
                baseFrequency={turbFreq.toFixed(4)}
                numOctaves="2"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={dispScale.toFixed(2)}
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />
              <feGaussianBlur
                in="displaced"
                stdDeviation={blurVal.toFixed(2)}
                result="blurred"
              />
              <feColorMatrix
                in="blurred"
                type="saturate"
                values={satVal.toFixed(2)}
                result="saturated"
              />
              <feGaussianBlur
                in="SourceAlpha"
                stdDeviation={Math.max(1, bezelWidth * 0.08).toFixed(1)}
                result="alpha_blur"
              />
              <feSpecularLighting
                in="alpha_blur"
                surfaceScale={surfaceScale.toFixed(2)}
                specularConstant={(specularOpacity * 2.2).toFixed(2)}
                specularExponent="18"
                lightingColor="#ffffff"
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

      {/* WebGL Surface Canvas */}
      {mode === 'webgl' && (
        <canvas
          ref={canvasRef}
          aria-label="Liquid Glass WebGL Surface"
          className="absolute inset-0 w-full h-full pointer-events-none rounded-[inherit] -z-10"
        />
      )}

      {/* SVG Backdrop Filter Surface */}
      {mode === 'svg' && (
        <>
          {/* Liquid Refraction Backdrop Layer */}
          <div
            className="absolute inset-0 -z-10 pointer-events-none rounded-[inherit]"
            style={{
              backdropFilter: `url(#${filterId}) blur(${blurVal}px) saturate(${100 + specularSaturation * 20}%)`,
              WebkitBackdropFilter: `url(#${filterId}) blur(${blurVal}px) saturate(${100 + specularSaturation * 20}%)`,
            }}
          />
          {/* Specular Bevel Slope Rim Overlay */}
          <div
            className="absolute inset-0 z-0 pointer-events-none rounded-[inherit]"
            style={{
              background: `linear-gradient(135deg, rgba(255, 255, 255, ${specularOpacity * 0.35}) 0%, rgba(255, 255, 255, ${specularOpacity * 0.08}) ${bezelWidth * 0.6}px, transparent ${bezelWidth * 1.2}px, transparent calc(100% - ${bezelWidth * 1.2}px), rgba(255, 255, 255, ${specularOpacity * 0.15}) 100%)`,
            }}
          />
          {/* Inner Rim Highlight, Bevel Shadow & Glass Tint */}
          <div
            className="absolute inset-0 z-0 pointer-events-none rounded-[inherit]"
            style={{
              boxShadow: [
                `inset 0 1px 1.5px 0 rgba(255, 255, 255, ${Math.min(1, specularOpacity * 0.9)})`,
                `inset 0 0 ${shadowBlur}px ${shadowSpread}px ${shadowColor}`,
                `inset 0 -1px 2px 0 rgba(0, 0, 0, 0.12)`,
              ].join(', '),
              backgroundColor: `rgba(${rgbTint}, ${tintOpacity})`,
            }}
          />
        </>
      )}

      {/* Surface Content Layer */}
      <div className="relative z-10 w-full h-full pointer-events-auto">
        {children}
      </div>

      {/* Fallback Slot when error occurs */}
      {errorMessage &&
        (slots?.fallback ? (
          renderSlot(slots.fallback, {
            errorMessage,
            ...(slotProps?.fallback as any),
          })
        ) : (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-space-4 text-center text-xs text-muted-fg bg-bg/80 backdrop-blur-md rounded-[inherit]">
            <span className="font-semibold text-fg">Refraction Unavailable</span>
            <span className="text-[11px] opacity-80 mt-1">{errorMessage}</span>
          </div>
        ))}
    </div>
  )
}

/**
 * Consona Interface — Liquid Glass
 *
 * Real-time physics-based liquid glass surface with procedural Snell's law refraction profiles,
 * squircle bezel geometry, specular highlights, and dual SVG / WebGL rendering engines.
 */
export const Glass = createInterfaceComponent<GlassProps, GlassSlots>(
  {
    name: 'Glass',
    category: 'media',
    description:
      "Real-time physics-based liquid glass surface with procedural Snell's law refraction profiles, squircle bezel geometry, specular highlights, and dual SVG / WebGL rendering engines.",
    version: '1.0.0',
    props: {
      mode: 'svg',
      borderRadius: 48,
      thickness: 80,
      bezelWidth: 60,
      refractiveIndex: 3.0,
      scaleRatio: 1.0,
      blur: 0.3,
      specularOpacity: 0.5,
      specularSaturation: 4,
      shadowColor: '#ffffff',
      shadowBlur: 20,
      shadowSpread: -5,
      tintColor: '#ffffff',
      tintOpacity: 0.06,
      outerShadowBlur: 24,
      outerShadowOpacity: 0.18,
      surfaceFunction: 'convex_squircle',
    },
    slots: {
      fallback: undefined,
    },
  },
  GlassPrimitive
)

export default Glass
