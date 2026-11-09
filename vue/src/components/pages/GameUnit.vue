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
      @contextmenu.stop.prevent="emit('target', $event.shiftKey)"
      @keydown.enter.stop.prevent="emit('select', $event.shiftKey)"
      @keydown.space.stop.prevent="emit('select', $event.shiftKey)"
  >
    <ellipse v-if="unit.selected" rx="18" ry="9" fill="none" stroke="#ffe08a" stroke-width="2" />
    <circle
        cy="-10"
        :r="UNIT_RADIUS - 1"
        :fill="groupColor(unit.group)"
        :stroke="unit.terrain === 'water' ? '#d8f4ff' : '#493618'"
        :stroke-dasharray="unit.terrain === 'water' ? '4 2' : undefined"
        stroke-width="2"
    />
    <g v-if="unit.health < unit.maxHealth" pointer-events="none">
      <rect x="-12" y="-29" width="24" height="4" fill="#303b31" />
      <rect x="-12" y="-29" :width="24 * unit.health / unit.maxHealth" height="4" fill="#e65a50" />
    </g>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Unit, MoveEvent } from '@/game/Unit'
import { UNIT_RADIUS } from '@/game/occupancy'
import { worldToScreen } from '@/game/map'
import { groupColor } from '@/game/groups'

const props = defineProps<{ unit: Unit; moveEvent?: MoveEvent }>()
const emit = defineEmits<{ select: [additive: boolean]; target: [queue: boolean] }>()

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
