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
} from '../../overlay/engine/geometry'

export {
  generateCutoutMaskPath,
  generateMultiCutoutMaskPath,
  generateSubCutoutPath,
  parseCutoutRadius,
} from '../../overlay/engine/mask'

export {
  calculateFloatingPosition as calculateCardPosition,
  calculateFloatingPosition,
} from '../../overlay/engine/positioning'

export {
  scrollTargetIntoView,
  TargetTracker,
} from '../../overlay/engine/tracker'
