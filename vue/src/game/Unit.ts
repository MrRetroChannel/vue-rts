export type MoveEvent = {
    unitId: number
    x: number
    y: number
}

export class Unit {
    id: number
    x: number
    y: number
    speed: number
    selected = false

    constructor(id: number, x: number, y: number, speed: number) {
        this.id = id
        this.x = x
        this.y = y
        this.speed = speed
    }

    update(delta: number, targetX: number, targetY: number) {
        const dx = targetX - this.x
        const dy = targetY - this.y
        const distance = Math.hypot(dx, dy)
        const step = this.speed * delta

        if (distance <= step) {
            this.x = targetX
            this.y = targetY
            return true
        } else {
            this.x += dx / distance * step
            this.y += dy / distance * step
            return false
        }
    }
}
