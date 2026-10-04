import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import { world, type Point } from '@/game/world'

const speed = 500
const edgeSize = 24

export const useCamera = (viewport: Ref<HTMLElement | null>) => {
  const camera = ref({ x: 0, y: 0 })
  const keys = new Set<string>()
  let pointer: Point | null = null
  let frame = 0
  let previousTime = 0

  const clamp = () => {
    camera.value.x = Math.max(0, Math.min(camera.value.x, world.width - viewport.value!.clientWidth))
    camera.value.y = Math.max(0, Math.min(camera.value.y, world.height - viewport.value!.clientHeight))
  }

  const center = () => {
    camera.value.x = (world.width - viewport.value!.clientWidth) / 2
    camera.value.y = (world.height - viewport.value!.clientHeight) / 2
    clamp()
  }

  const update = (time: number) => {
    const seconds = Math.min((time - previousTime) / 1000, 0.05)
    previousTime = time
    let horizontal = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'))
    let vertical = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'))

    if (pointer) {
      horizontal += Number(pointer.x > viewport.value!.clientWidth - edgeSize) - Number(pointer.x < edgeSize)
      vertical += Number(pointer.y > viewport.value!.clientHeight - edgeSize) - Number(pointer.y < edgeSize)
    }

    camera.value.x += horizontal * speed * seconds
    camera.value.y += vertical * speed * seconds
    clamp()
    frame = requestAnimationFrame(update)
  }

  const setPointer = (x: number, y: number) => { pointer = { x, y } }
  const clearPointer = () => { pointer = null }
  const keyDown = (event: KeyboardEvent) => keys.add(event.key.toLowerCase())
  const keyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase())

  onMounted(() => {
    center()
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('resize', clamp)
    frame = requestAnimationFrame(update)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', keyDown)
    window.removeEventListener('keyup', keyUp)
    window.removeEventListener('resize', clamp)
    cancelAnimationFrame(frame)
  })

  return { camera, setPointer, clearPointer }
}
