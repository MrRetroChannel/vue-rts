import { worldWidth, worldHeight, worldToScreen, screenToWorld } from './map'
import { UNIT_RADIUS, type MapObject } from './occupancy'
import { getTerrain, type Terrain } from './terrain'

type Point = { x: number; y: number }

// Try a direct line first, then the eight points around each building.
export const findPath = (start: Point, target: Point, objects: MapObject[], terrain: Terrain): Point[] | null => {
  const buildings = objects.map(object => ({ ...worldToScreen(object.x, object.y), radius: object.radius + UNIT_RADIUS }))
  const valid = (point: Point) => {
    const world = screenToWorld(point.x, point.y)
    return Math.abs(world.x) <= worldWidth / 2 && Math.abs(world.y) <= worldHeight / 2
      && getTerrain(world.x, world.y) === terrain
      && buildings.every(building => Math.hypot(point.x - building.x, point.y - building.y) >= building.radius + 1)
  }
  const clear = (from: Point, to: Point) => {
    if (!valid(from) || !valid(to)) return false
    const dx = to.x - from.x
    const dy = to.y - from.y
    const length = Math.hypot(dx, dy)
    for (let i = 1; i < Math.ceil(length / 8); i++) {
      const world = screenToWorld(from.x + dx * i * 8 / length, from.y + dy * i * 8 / length)
      if (getTerrain(world.x, world.y) !== terrain) return false
    }
    return buildings.every(building => {
      const part = Math.max(0, Math.min(1,
        ((building.x - from.x) * dx + (building.y - from.y) * dy) / (length * length || 1)))
      return Math.hypot(from.x + dx * part - building.x, from.y + dy * part - building.y) >= building.radius + 1
    })
  }

  const first = worldToScreen(start.x, start.y)
  const last = worldToScreen(target.x, target.y)
  if (clear(first, last)) return [target]

  const points: Point[] = [first, last]
  buildings.forEach(building => {
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4
      const radius = (building.radius + 5) * 1.1
      const point = { x: building.x + Math.cos(angle) * radius, y: building.y + Math.sin(angle) * radius }
      if (valid(point)) points.push(point)
    }
  })

  // Dijkstra on these few points chooses the shorter side of the obstacle.
  const distances = points.map((_, index) => index === 0 ? 0 : Infinity)
  const previous = points.map(() => -1)
  const visited = points.map(() => false)
  for (let count = 0; count < points.length; count++) {
    let current = -1
    for (let i = 0; i < points.length; i++) {
      if (!visited[i] && (current === -1 || distances[i] < distances[current])) current = i
    }
    if (current === -1 || distances[current] === Infinity || current === 1) break
    visited[current] = true
    for (let next = 1; next < points.length; next++) {
      if (visited[next] || !clear(points[current], points[next])) continue
      const distance = distances[current] + Math.hypot(points[next].x - points[current].x, points[next].y - points[current].y)
      if (distance < distances[next]) {
        distances[next] = distance
        previous[next] = current
      }
    }
  }
  if (previous[1] === -1) return null
  const path: Point[] = []
  for (let index = 1; index !== 0; index = previous[index]) {
    path.unshift(index === 1 ? target : screenToWorld(points[index].x, points[index].y))
  }
  return path
}
