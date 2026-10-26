import { createContext } from 'react'
import type { NavigationEngine } from '../engine/navigation-engine'

export const NavigationContext = createContext<NavigationEngine<any> | null>(null)
