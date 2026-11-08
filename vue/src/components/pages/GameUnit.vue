<template>
  <ellipse
      v-if="moveEvent"
      :cx="targetScreen.x"
      :cy="targetScreen.y"
      rx="7"
      ry="4"
      fill="none"
      stroke="#ffe08a"
      stroke-width="2"
      pointer-events="none"
  />
  <g
      class="unit"
      :transform="`translate(${unitScreen.x} ${unitScreen.y})`"
      role="button"
      aria-label="Персонаж"
      :aria-pressed="unit.selected"
      tabindex="0"
      @click.stop="emit('select', $event.shiftKey)"
      @keydown.enter.stop.prevent="emit('select', $event.shiftKey)"
      @keydown.space.stop.prevent="emit('select', $event.shiftKey)"
  >
    <ellipse v-if="unit.selected" rx="18" ry="9" fill="none" stroke="#ffe08a" stroke-width="2" />
    <circle cy="-10" :r="UNIT_RADIUS - 1" :fill="unit.terrain === 'water' ? '#8dd7ef' : '#ffd376'" stroke="#493618" stroke-width="2" />
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Unit, MoveEvent } from '@/game/Unit'
import { UNIT_RADIUS } from '@/game/occupancy'
import { worldToScreen } from '@/game/map'

const props = defineProps<{ unit: Unit; moveEvent?: MoveEvent }>()
const emit = defineEmits<{ select: [additive: boolean] }>()

const unitScreen = computed(() => worldToScreen(props.unit.x, props.unit.y))
const targetScreen = computed(() => worldToScreen(
  props.moveEvent?.x ?? props.unit.x,
  props.moveEvent?.y ?? props.unit.y,
))
</script>

<style scoped lang="scss">
.unit {
  cursor: pointer;

  &:focus:not(:focus-visible) {
    outline: none;
  }
}
</style>
