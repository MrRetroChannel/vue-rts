<template>
  <g :transform="`translate(${screen.x} ${screen.y})`" pointer-events="none">
    <circle cy="-10" :r="object.radius - 1" fill="#8c9588" stroke="#303b31" stroke-width="2" />
    <text y="-30" text-anchor="middle" fill="#fff" font-size="11">
      {{ object.health }}/{{ object.maxHealth }} HP
    </text>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MapObject } from '@/game/occupancy'
import { worldToScreen } from '@/game/map'

const props = defineProps<{ object: MapObject }>()
const screen = computed(() => worldToScreen(props.object.x, props.object.y))
</script>
