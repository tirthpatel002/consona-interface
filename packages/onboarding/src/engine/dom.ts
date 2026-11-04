/**
 * Onboarding DOM & Geometry Helpers.
 * Delegates to the unified Consona OverlayEngine.
 */

export {
  resolveTarget,
  resolveTargets,
  getTargetRect,
  getTargetGeometry,
  getCompoundTargetRect,
  dprRound,
  getViewportDimensions,
} from '@consona/interface-overlay'

export {
  generateCutoutMaskPath,
  generateMultiCutoutMaskPath,
  generateSubCutoutPath,
  parseCutoutRadius,
} from '@consona/interface-overlay'

export {
  calculateFloatingPosition as calculateCardPosition,
  calculateFloatingPosition,
} from '@consona/interface-overlay'

export {
  scrollTargetIntoView,
  TargetTracker,
} from '@consona/interface-overlay'
