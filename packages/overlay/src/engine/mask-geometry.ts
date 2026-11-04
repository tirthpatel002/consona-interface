export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface SpotlightCutout extends Rect {
  padding: number
  radius: number
}

export function inflateRect(rect: Rect, padding: number): Rect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
}

export function toCutout(rect: Rect, padding = 8, radius = 8): SpotlightCutout {
  return { ...inflateRect(rect, padding), padding, radius }
}
