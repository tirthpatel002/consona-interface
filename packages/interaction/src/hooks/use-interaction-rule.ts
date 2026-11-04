import { useEffect, useRef } from 'react'
import { useInteraction } from '../context'
import type { InteractionRule } from '../engine/types'

/**
 * Registers a declarative interaction rule with the active InteractionEngine.
 * Automatically adds the rule on mount and cleans it up on unmount.
 */
export function useInteractionRule<TPayload = any>(
  rule: InteractionRule<TPayload>,
  deps: React.DependencyList = []
): void {
  const { addRule } = useInteraction()
  const ruleRef = useRef(rule)
  ruleRef.current = rule

  useEffect(() => {
    const unregister = addRule({
      ...ruleRef.current,
      handler: (ctx) => ruleRef.current.handler(ctx),
    })

    return () => {
      unregister()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addRule, ...deps])
}
