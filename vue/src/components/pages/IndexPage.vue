<template>
  <main>
    <h1>Игровое поле</h1>
    <p>Карта {{ worldWidth }} × {{ worldHeight }} · шаг сетки {{ gridSize }}</p>
    <p>Камера: WASD или стрелки, масштаб: колесо мыши.</p>
    <p>ЛКМ по персонажу — выбрать, рамка мышью — выбрать группу, ПКМ — идти к точке, Shift+ПКМ — добавить команду в очередь.</p>

    <GameMap
        @tick="nextFrame"
        @background-click="clearSelection"
        @select-area="selectArea"
        @command="onCommand"
    >
      <GameObject v-for="object in objects" :key="object.id" :object="object" />
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
import GameObject from '@/components/pages/GameObject.vue'
import GameUnit from '@/components/pages/GameUnit.vue'
import type { Unit, MoveEvent } from '@/game/Unit'
import { UNIT_RADIUS, type MapObject } from '@/game/occupancy'
import { worldWidth, worldHeight, gridSize, worldToScreen, screenToWorld } from '@/game/map'

const store = useStore()
const units = computed(() => store.state.game.units as Unit[])
const objects = computed(() => store.state.game.objects as MapObject[])
const events = computed(() => store.state.game.events as MoveEvent[])

const nextFrame = (delta: number) => {
  const activeBefore = events.value.map(event => event.unitId)
  store.commit('game/nextFrame', delta)
  const activeAfter = new Set(events.value.map(event => event.unitId))
  activeBefore.forEach(id => {
    if (activeAfter.has(id)) return
    const next = (store.state.commandQueue.byUnit[id] as MoveEvent[] | undefined)?.[0]
    if (!next) return
    store.commit('commandQueue/shift', id)
    store.commit('game/setMoveEvents', [next])
  })
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

const onCommand = (x: number, y: number, queue: boolean) => {
  const selected = units.value.filter(unit => unit.selected)
  if (!selected.length) return

  const destination = worldToScreen(x, y)
  const spacing = UNIT_RADIUS * 2
  const columns = Math.ceil(Math.sqrt(selected.length))
  const rows = Math.ceil(selected.length / columns)

  const slots = selected.map((_, index) => {
    const row = Math.floor(index / columns)
    const countInRow = Math.min(columns, selected.length - row * columns)
    const column = index % columns
    return {
      x: destination.x + (column - (countInRow - 1) / 2) * spacing,
      y: destination.y + (row - (rows - 1) / 2) * spacing,
    }
  }).sort((a, b) => a.x - b.x)
  selected.sort((a, b) => worldToScreen(a.x, a.y).x - worldToScreen(b.x, b.y).x)

  const moves = selected.map((unit, index) => {
    const target = screenToWorld(slots[index].x, slots[index].y)
    return {
      unitId: unit.id,
      x: Math.max(-worldWidth / 2, Math.min(worldWidth / 2, target.x)),
      y: Math.max(-worldHeight / 2, Math.min(worldHeight / 2, target.y)),
    }
  })
  if (queue) {
    moves.forEach(move => {
      if (events.value.some(event => event.unitId === move.unitId)) {
        store.commit('commandQueue/add', move)
      } else {
        store.commit('game/setMoveEvents', [move])
      }
    })
  } else {
    store.commit('commandQueue/clear', moves.map(move => move.unitId))
    store.commit('game/setMoveEvents', moves)
  }
}
</script>
