import { Unit, type MoveEvent } from '@/game/Unit'
import type { MapObject } from '@/game/occupancy'

type GameState = {
  units: Unit[]
  objects: MapObject[]
  events: MoveEvent[]
}

export default {
  namespaced: true,
  state: (): GameState => ({
    units: [
      new Unit(1, 80, 80, 150),
      new Unit(2, -240, -120, 110),
      new Unit(3, 260, -100, 190),
    ],
    objects: [
      { id: 1, x: 160, y: 80, radius: 17 },
    ],
    events: [],
  }),
  mutations: {
    selectUnits: (state: GameState, ids: number[]) => {
      state.units.forEach(unit => unit.selected = ids.includes(unit.id))
    },
    setMoveEvents: (state: GameState, moves: MoveEvent[]) => {
      const ids = moves.map(move => move.unitId)
      state.events = state.events.filter(event => !ids.includes(event.unitId))
      state.events.push(...moves)
    },
    nextFrame: (state: GameState, delta: number) => {
      if (!state.events.length) return
      state.events = state.events.filter(event => {
        const unit = state.units.find(unit => unit.id === event.unitId)
        return unit ? !unit.update(delta, event.x, event.y) : false
      })
    },
  },
}
