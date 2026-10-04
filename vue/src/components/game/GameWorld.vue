<template>
  <main class="game">
    <div class="topbar">
      <span>Координаты: {{ pointer.x }}, {{ pointer.y }}</span>
    </div>
    <div ref="viewport" class="viewport" @mousemove="updatePointer">
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
import { screenToWorld, world } from '@/game/world'

const viewport = ref<HTMLElement | null>(null)
const pointer = ref({ x: 0, y: 0 })
const worldStyle = computed(() => ({ width: `${world.width}px`, height: `${world.height}px` }))

const updatePointer = (event: MouseEvent) => {
  const bounds = viewport.value!.getBoundingClientRect()
  pointer.value = screenToWorld(event.clientX - bounds.left, event.clientY - bounds.top)
}
</script>
