import { cn as baseCn } from 'cn'

export function cn(...inputs: any[]) {
  return baseCn(...inputs)
}

export const cx = cn

export function mergeProps<T extends Record<string, any>, U extends Record<string, any>>(
  base: T,
  overrides?: U
): T & U {
  if (!overrides) return { ...base } as T & U
  const result: any = { ...base }

  for (const key of Object.keys(overrides)) {
    const baseVal = result[key]
    const overrideVal = overrides[key]

    if (key === 'className') {
      if (typeof baseVal === 'function' || typeof overrideVal === 'function') {
        result[key] = (values: any) => {
          const b = typeof baseVal === 'function' ? baseVal(values) : baseVal
          const o = typeof overrideVal === 'function' ? overrideVal(values) : overrideVal
          return cn(b, o)
        }
      } else {
        result[key] = cn(baseVal, overrideVal)
      }
    } else if (
      baseVal &&
      overrideVal &&
      typeof baseVal === 'object' &&
      typeof overrideVal === 'object' &&
      !Array.isArray(baseVal) &&
      !Array.isArray(overrideVal)
    ) {
      result[key] = mergeProps(baseVal, overrideVal)
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal
    }
  }

  return result
}
