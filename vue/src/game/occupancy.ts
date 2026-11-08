import type { Unit } from './Unit'
import { worldWidth, worldHeight, worldToScreen, screenToWorld } from './map'

// Includes the 1px outline around the character's SVG circle.
export const UNIT_RADIUS = 11

export type MapObject = {
  id: number
  x: number
  y: number
  radius: number
}

type Place = {
  x: number
  y: number
  radius: number
}

export const canOccupy = (
  x: number,
  y: number,
  radius: number,
  units: Unit[],
  objects: MapObject[],
  ignoredUnitIds: number[] = [],
  reserved: Place[] = [],
) => {
  const point = worldToScreen(x, y)
  const overlaps = (other: Place) => {
    const otherPoint = worldToScreen(other.x, other.y)
    return Math.hypot(point.x - otherPoint.x, point.y - otherPoint.y) < radius + other.radius - 0.01
  }

  return !units.some(unit => !ignoredUnitIds.includes(unit.id)
      && overlaps({ x: unit.x, y: unit.y, radius: UNIT_RADIUS }))
    && !objects.some(overlaps)
    && !reserved.some(overlaps)
}

export const findFreePosition = (
  x: number,
  y: number,
  units: Unit[],
  objects: MapObject[],
  ignoredUnitIds: number[],
  reserved: Place[],
  allowed: (x: number, y: number) => boolean = () => true,
) => {
  const center = worldToScreen(x, y)
  const step = UNIT_RADIUS * 2

  for (let ring = 0; ring <= 8; ring++) {
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue

        const point = screenToWorld(center.x + dx * step, center.y + dy * step)
        if (Math.abs(point.x) > worldWidth / 2 || Math.abs(point.y) > worldHeight / 2) continue
        if (!allowed(point.x, point.y)) continue
        if (canOccupy(point.x, point.y, UNIT_RADIUS, units, objects, ignoredUnitIds, reserved)) {
          return point
        }
      }
    }
  }

  return null
}
