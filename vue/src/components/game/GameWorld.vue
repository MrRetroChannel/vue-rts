<template>
  <main class="game">
    <div class="topbar">
      <span>Координаты: {{ pointer.x }}, {{ pointer.y }}</span>
      <span>Камера: WASD, стрелки или края экрана</span>
    </div>
    <div ref="viewport" class="viewport" @mousemove="updatePointer" @mouseleave="clearPointer">
      <div class="world" :style="worldStyle">
        <div class="axis horizontal"></div>
        <div class="axis vertical"></div>
        <div class="origin">0, 0</div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCamera } from '@/composables/useCamera'
import { screenToWorld, world } from '@/game/world'

const viewport = ref<HTMLElement | null>(null)
const pointer = ref({ x: 0, y: 0 })
const { camera, clearPointer, setPointer } = useCamera(viewport)
const worldStyle = computed(() => ({
  width: `${world.width}px`,
  height: `${world.height}px`,
  transform: `translate(${-camera.value.x}px, ${-camera.value.y}px)`,
}))

const updatePointer = (event: MouseEvent) => {
  const bounds = viewport.value!.getBoundingClientRect()
  const x = event.clientX - bounds.left
  const y = event.clientY - bounds.top
  setPointer(x, y)
  pointer.value = screenToWorld(x, y, camera.value)
}
</script>
