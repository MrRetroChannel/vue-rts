<template>
  <main>
    <h1>Игровое поле</h1>
    <p>Карта {{ worldWidth }} × {{ worldHeight }} · шаг сетки {{ gridSize }}</p>
    <p>Камера: WASD или стрелки, масштаб: колесо мыши.</p>
    <p>ЛКМ по персонажу — выбрать, рамка мышью — выбрать группу, ПКМ — идти к точке.</p>

    <GameMap
        @tick="nextFrame"
        @background-click="clearSelection"
        @select-area="selectArea"
        @command="onCommand"
    >
      <GameUnit
          v-for="unit in units"
          :key="unit.id"
          :unit="unit"
          :move-event="events.find(event => event.unitId === unit.id)"
          @select="selectUnit(unit.id)"
      />
    </GameMap>

    <RouterLink :to="{ name: $routes.EXAMPLE }">Пример Vuex</RouterLink>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'
import GameMap from '@/components/pages/GameMap.vue'
import GameUnit from '@/components/pages/GameUnit.vue'
import type { Unit, MoveEvent } from '@/game/Unit'
import { worldWidth, worldHeight, gridSize, worldToScreen, screenToWorld } from '@/game/map'

const store = useStore()
const units = computed(() => store.state.game.units as Unit[])
const events = computed(() => store.state.game.events as MoveEvent[])

const nextFrame = (delta: number) => {
  store.commit('game/nextFrame', delta)
}

const clearSelection = () => {
  store.commit('game/selectUnits', [])
}

const selectUnit = (id: number) => {
  store.commit('game/selectUnits', [id])
}

const selectArea = (left: number, top: number, right: number, bottom: number) => {
  const ids = units.value.filter(unit => {
    const point = worldToScreen(unit.x, unit.y)
    return point.x >= left && point.x <= right
      && point.y - 10 >= top && point.y - 10 <= bottom
  }).map(unit => unit.id)
  store.commit('game/selectUnits', ids)
}

const onCommand = (x: number, y: number) => {
  const selected = units.value.filter(unit => unit.selected)
  if (!selected.length) return

  const destination = worldToScreen(x, y)
  const spacing = 20
  const columns = Math.ceil(Math.sqrt(selected.length))
  const rows = Math.ceil(selected.length / columns)

  const moves = selected.map((unit, index) => {
    const row = Math.floor(index / columns)
    const countInRow = Math.min(columns, selected.length - row * columns)
    const column = index % columns
    const target = screenToWorld(
      destination.x + (column - (countInRow - 1) / 2) * spacing,
      destination.y + (row - (rows - 1) / 2) * spacing,
    )
    return {
      unitId: unit.id,
      x: Math.max(-worldWidth / 2, Math.min(worldWidth / 2, target.x)),
      y: Math.max(-worldHeight / 2, Math.min(worldHeight / 2, target.y)),
    }
  })
  store.commit('game/setMoveEvents', moves)
}
</script>
