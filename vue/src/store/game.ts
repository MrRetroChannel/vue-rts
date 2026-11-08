import { Unit, type AttackEvent, type AttackTarget, type MoveEvent } from '@/game/Unit'
import {
  UNIT_RADIUS,
  canOccupy,
  canPlaceObject,
  distanceToObject,
  findFreePosition,
  objectHalf,
  type MapObject,
} from '@/game/occupancy'
import { worldToScreen, screenToWorld } from '@/game/map'
import { getTerrain } from '@/game/terrain'
import { findPath } from '@/game/pathfinding'

type GameState = {
  units: Unit[]
  objects: MapObject[]
  events: MoveEvent[]
  attacks: AttackEvent[]
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
  return accepted
}

const ATTACK_RANGE = 24

const findTarget = (state: GameState, target: AttackTarget) => target.kind === 'unit'
  ? state.units.find(unit => unit.id === target.id)
  : state.objects.find(object => object.id === target.id)

const nearestPoint = (x: number, y: number, target: AttackTarget, place: { x: number; y: number }) => {
  if (target.kind === 'unit') return { x: place.x, y: place.y }
  const half = objectHalf(place as MapObject)
  return {
    x: Math.max(place.x - half, Math.min(place.x + half, x)),
    y: Math.max(place.y - half, Math.min(place.y + half, y)),
  }
}

const gapTo = (unit: Unit, target: AttackTarget, place: Unit | MapObject) => {
  const point = worldToScreen(unit.x, unit.y)
  if (target.kind === 'object') return distanceToObject(point, point, place as MapObject) - UNIT_RADIUS
  const other = worldToScreen(place.x, place.y)
  return Math.hypot(point.x - other.x, point.y - other.y) - UNIT_RADIUS * 2
}

const approachPoint = (unit: Unit, target: AttackTarget, place: Unit | MapObject) => {
  const from = worldToScreen(unit.x, unit.y)
  const near = nearestPoint(unit.x, unit.y, target, place)
  const to = worldToScreen(near.x, near.y)
  const length = Math.hypot(from.x - to.x, from.y - to.y) || 1
  const reach = (target.kind === 'unit' ? UNIT_RADIUS * 2 : UNIT_RADIUS) + 4
  return screenToWorld(to.x + (from.x - to.x) / length * reach, to.y + (from.y - to.y) / length * reach)
}

const removeDead = (state: GameState) => {
  const deadUnits = state.units.filter(unit => unit.health <= 0).map(unit => unit.id)
  if (deadUnits.length) {
    state.units = state.units.filter(unit => !deadUnits.includes(unit.id))
    state.events = state.events.filter(event => !deadUnits.includes(event.unitId))
    state.attacks = state.attacks.filter(attack => !deadUnits.includes(attack.unitId))
  }
  if (state.objects.some(object => object.health <= 0)) {
    state.objects = state.objects.filter(object => object.health > 0)
    if (!state.objects.some(object => object.id === state.selectedObjectId)) state.selectedObjectId = null
  }
}

const updateAttacks = (state: GameState, delta: number) => {
  state.attacks = state.attacks.filter(attack => {
    const unit = state.units.find(unit => unit.id === attack.unitId)
    const place = findTarget(state, attack.target)
    const move = state.events.find(event => event.unitId === attack.unitId)
    if (!unit || !place || place.health <= 0) {
      if (move) state.events = state.events.filter(event => event !== move)
      return false
    }

    if (gapTo(unit, attack.target, place) <= ATTACK_RANGE) {
      if (move) state.events = state.events.filter(event => event !== move)
      attack.cooldown -= delta
      if (attack.cooldown <= 0) {
        place.health = Math.max(0, place.health - unit.power)
        attack.cooldown += 1 / unit.attackSpeed
      }
      return true
    }

    attack.cooldown = 0
    const near = nearestPoint(move?.x ?? unit.x, move?.y ?? unit.y, attack.target, place)
    const end = worldToScreen(move?.x ?? 0, move?.y ?? 0)
    const nearScreen = worldToScreen(near.x, near.y)
    const reach = (attack.target.kind === 'unit' ? UNIT_RADIUS * 2 : UNIT_RADIUS) + ATTACK_RANGE
    if (move && Math.hypot(end.x - nearScreen.x, end.y - nearScreen.y) <= reach) return true

    const point = approachPoint(unit, attack.target, place)
    const [planned] = planMoves(state, [{ unitId: unit.id, ...point }])
    if (!planned) return false
    const start = worldToScreen(unit.x, unit.y)
    const finish = worldToScreen(planned.x, planned.y)
    return Math.hypot(start.x - finish.x, start.y - finish.y) > 1
  })
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
    attacks: [],
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
    destroyUnits: (state: GameState, ids: number[]) => {
      state.units = state.units.filter(unit => !ids.includes(unit.id))
      state.events = state.events.filter(event => !ids.includes(event.unitId))
      state.attacks = state.attacks.filter(attack => !ids.includes(attack.unitId))
    },
    attack: (state: GameState, { unitIds, target }: { unitIds: number[]; target: AttackTarget }) => {
      const attackers = target.kind === 'unit' ? unitIds.filter(id => id !== target.id) : unitIds
      state.attacks = state.attacks.filter(attack => !unitIds.includes(attack.unitId))
      state.events = state.events.filter(event => !unitIds.includes(event.unitId))
      state.attacks.push(...attackers.map(unitId => ({ unitId, target, cooldown: 0 })))
    },
    stopAttacks: (state: GameState, ids: number[]) => {
      state.attacks = state.attacks.filter(attack => !ids.includes(attack.unitId))
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
      updateAttacks(state, delta)
      removeDead(state)
    },
  },
}
