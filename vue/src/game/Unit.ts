import type { Terrain } from './terrain'

export type MoveEvent = {
    unitId: number
    x: number
    y: number
    waypoints?: { x: number; y: number }[]
}

export class Unit {
    id: number
    x: number
    y: number
    speed: number
    terrain: Terrain
    selected = false

    constructor(id: number, x: number, y: number, speed: number, terrain: Terrain = 'land') {
        this.id = id
        this.x = x
        this.y = y
        this.speed = speed
        this.terrain = terrain
    }

    update(delta: number, targetX: number, targetY: number, canMove: (x: number, y: number) => boolean) {
        const dx = targetX - this.x
        const dy = targetY - this.y
        const distance = Math.hypot(dx, dy)
        const step = this.speed * delta

        const nextX = distance <= step ? targetX : this.x + dx / distance * step
        const nextY = distance <= step ? targetY : this.y + dy / distance * step

        if (canMove(nextX, nextY)) {
            this.x = nextX
            this.y = nextY
        }
        return this.x === targetX && this.y === targetY
    }

    maxHealth = 100
    health = 100
    power = 12
    attackSpeed = 1
}
