import React, { createContext, useContext, type ReactNode } from 'react'

/** Optical size tokens that cascade from composite parents to inner atoms. */
export type OpticalSize = 'xs' | 'sm' | 'md' | 'lg' | (string & {})

const SizeContext = createContext<OpticalSize | undefined>(undefined)

export interface SizeProviderProps {
  /** Size token to publish to descendants. Omit to inherit the parent size. */
  size?: OpticalSize
  children: ReactNode
}

export function SizeProvider({ size, children }: SizeProviderProps) {
  const inherited = useContext(SizeContext)
  const value = size ?? inherited
  if (value === undefined) return <>{children}</>
  return <SizeContext.Provider value={value}>{children}</SizeContext.Provider>
}

export function useOpticalSize(override?: OpticalSize): OpticalSize | undefined {
  const inherited = useContext(SizeContext)
  return override ?? inherited
}
