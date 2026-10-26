import { useEngineState } from '../../../core/hooks'
import { useOrbEngine } from '../context'

export function useOrbPhysics() {
  const engine = useOrbEngine()
  const state = useEngineState(engine)

  return {
    ...state,
    start: () => engine.start(),
    stop: () => engine.stop(),
    impulse: (vx: number, vy: number) => engine.impulse(vx, vy),
    tick: (dt: number) => engine.tick(dt),
    setEnergy: (energy: number) => engine.setEnergy(energy),
    engine,
  }
}
