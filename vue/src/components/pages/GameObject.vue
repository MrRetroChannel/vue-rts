<template>
  <g pointer-events="none">
    <polygon :points="points" fill="#8c9588" stroke="#303b31" stroke-width="2" />
    <text :x="top.x" :y="top.y - 8" text-anchor="middle" fill="#fff" font-size="11">
      {{ object.health }}/{{ object.maxHealth }} HP
    </text>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { objectCorners, type MapObject } from '@/game/occupancy'

const props = defineProps<{ object: MapObject }>()
const corners = computed(() => objectCorners(props.object))
const points = computed(() => corners.value.map(point => `${point.x},${point.y}`).join(' '))
const top = computed(() => corners.value[0])
</script>
