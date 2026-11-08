import { Unit } from '@/game/Unit'

type UnitMove = {
  unitId: number
  x: number
  y: number
}

type GameState = {
  units: Unit[]
}

export default {
  namespaced: true,
  state: (): GameState => ({
    units: [
      new Unit(1, 80, 80, 150),
      new Unit(2, -240, -120, 110),
      new Unit(3, 260, -100, 190),
    ],
  }),
  mutations: {
    selectUnits: (state: GameState, ids: number[]) => {
      state.units.forEach(unit => unit.selected = ids.includes(unit.id))
    },
    moveUnits: (state: GameState, moves: UnitMove[]) => {
      moves.forEach(move => {
        const unit = state.units.find(unit => unit.id === move.unitId)
        unit?.moveTo(move.x, move.y)
      })
    },
    nextFrame: (state: GameState, delta: number) => {
      state.units.forEach(unit => unit.update(delta))
    },
  },
}
