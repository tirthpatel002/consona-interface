import { BaseEngine } from '../../../core/engine'

export interface OrbPhysicsState {
  x: number
  y: number
  vx: number
  vy: number
  energy: number
  running: boolean
}

export interface OrbPhysicsEngineOptions {
  energy?: number
}

export class OrbPhysicsEngine extends BaseEngine<OrbPhysicsState> {
  constructor(options: OrbPhysicsEngineOptions = {}) {
    super({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      energy: options.energy ?? 0.5,
      running: false,
    })
  }

  public start() {
    this.setState({ running: true })
    this.emit('orb:start')
  }

  public stop() {
    this.setState({ running: false, vx: 0, vy: 0 })
    this.emit('orb:stop')
  }

  public impulse(vx: number, vy: number) {
    this.setState({ vx, vy, running: true })
    this.emit('orb:impulse', { vx, vy })
  }

  public tick(dt: number) {
    if (!this.state.running) return
    const damp = Math.max(0, 1 - dt * 0.4)
    const x = this.state.x + this.state.vx * dt
    const y = this.state.y + this.state.vy * dt
    this.setState({
      x,
      y,
      vx: this.state.vx * damp,
      vy: this.state.vy * damp,
    })
  }

  public setEnergy(energy: number) {
    const next = Math.min(1, Math.max(0, energy))
    this.setState({ energy: next })
    this.emit('orb:energy', { energy: next })
  }
}
