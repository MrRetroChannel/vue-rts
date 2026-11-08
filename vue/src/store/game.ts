import { Unit, type MoveEvent } from '@/game/Unit'
import { UNIT_RADIUS, canOccupy, canPlaceObject, findFreePosition, type MapObject } from '@/game/occupancy'
import { getTerrain } from '@/game/terrain'
import { findPath } from '@/game/pathfinding'

type GameState = {
  units: Unit[]
  objects: MapObject[]
  events: MoveEvent[]
  selectedObjectId: number | null
  nextObjectId: number
  nextUnitId: number
}

const planMoves = (state: GameState, moves: MoveEvent[]) => {
  const ids = moves.map(move => move.unitId)
  const reserved: { x: number; y: number; radius: number }[] = []
  const accepted: MoveEvent[] = []

  moves.forEach(move => {
    const unit = state.units.find(unit => unit.id === move.unitId)
    if (!unit) return
    const allowed = (x: number, y: number) => getTerrain(x, y) === unit.terrain
    const point = findFreePosition(move.x, move.y, state.units, state.objects, ids, reserved, allowed)
    if (!point) return
    const path = findPath({ x: unit.x, y: unit.y }, point, state.objects, unit.terrain)
    if (!path) return
    accepted.push({ unitId: move.unitId, x: point.x, y: point.y, waypoints: path })
    reserved.push({ x: point.x, y: point.y, radius: UNIT_RADIUS })
  })

  state.events = state.events.filter(event => !ids.includes(event.unitId))
  state.events.push(...accepted)
}

export default {
  namespaced: true,
  state: (): GameState => ({
    units: [
      new Unit(1, 80, 80, 150),
      new Unit(2, -240, -120, 110),
      new Unit(3, 260, -100, 190),
      new Unit(4, -200, 280, 130, 'water'),
    ],
    objects: [
      { id: 1, x: 160, y: 80, size: 2, maxHealth: 250, health: 250 },
    ],
    events: [],
    selectedObjectId: null,
    nextObjectId: 2,
    nextUnitId: 5,
  }),
  mutations: {
    selectUnits: (state: GameState, ids: number[]) => {
      state.units.forEach(unit => unit.selected = ids.includes(unit.id))
      state.selectedObjectId = null
    },
    selectObject: (state: GameState, id: number) => {
      state.units.forEach(unit => unit.selected = false)
      state.selectedObjectId = id
    },
    spawnUnit: (state: GameState, objectId: number) => {
      const object = state.objects.find(object => object.id === objectId)
      if (!object) return
      const reserved = state.events.map(event => ({ x: event.x, y: event.y, radius: UNIT_RADIUS }))
      const point = findFreePosition(object.x, object.y, state.units, state.objects, [], reserved,
        (x, y) => getTerrain(x, y) === 'land')
      if (!point) return
      state.units.push(new Unit(state.nextUnitId++, point.x, point.y, 140))
    },
    setMoveEvents: (state: GameState, moves: MoveEvent[]) => {
      planMoves(state, moves)
    },
    placeBuilding: (state: GameState, building: { x: number; y: number; size: number }) => {
      if (!canPlaceObject(building, state.units, state.objects)) return
      const health = 150 * building.size
      state.objects.push({ id: state.nextObjectId++, ...building, maxHealth: health, health })
      planMoves(state, state.events.map(({ unitId, x, y }) => ({ unitId, x, y })))
    },
    nextFrame: (state: GameState, delta: number) => {
      if (!state.events.length) return
      state.events = state.events.filter(event => {
        const unit = state.units.find(unit => unit.id === event.unitId)
        if (!unit) return false
        const target = event.waypoints?.[0] ?? event
        const arrived = unit.update(delta, target.x, target.y, (x, y) =>
          getTerrain(x, y) === unit.terrain
          && canOccupy(x, y, UNIT_RADIUS, state.units, state.objects, [unit.id]))
        if (arrived && event.waypoints) event.waypoints.shift()
        return !arrived || !!event.waypoints?.length
      })
    },
  },
}
