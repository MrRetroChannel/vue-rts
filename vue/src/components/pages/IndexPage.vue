<template>
  <main>
    <h1>Игровое поле</h1>
    <p>Карта {{ worldWidth }} × {{ worldHeight }} · шаг сетки {{ gridSize }}</p>
    <p>Камера: WASD или стрелки, масштаб: колесо мыши.</p>
    <p>Здания строятся из панели навигации под картой. ЛКМ по зданию — выбрать и создавать персонажей, ЛКМ по персонажу — выбрать, рамка мышью — выбрать группу, ПКМ — идти к точке, Shift+ПКМ — добавить команду в очередь.</p>

    <GameMap
        @tick="nextFrame"
        @background-click="onBackgroundClick"
        @pointer-move="onPointerMove"
        @select-area="selectArea"
        @command="onCommand"
    >
      <GameObject
          v-for="object in objects"
          :key="object.id"
          :object="object"
          :selected="object.id === selectedObject?.id"
          @select="selectObject(object.id)"
      />
      <GameUnit
          v-for="unit in units"
          :key="unit.id"
          :unit="unit"
          :move-event="events.find(event => event.unitId === unit.id)"
          @select="selectUnit(unit.id)"
      />
      <polygon
          v-if="ghost"
          :points="ghostPoints"
          :fill="ghostValid ? 'rgba(141, 220, 120, 0.35)' : 'rgba(230, 90, 80, 0.35)'"
          :stroke="ghostValid ? '#8ddc78' : '#e65a50'"
          stroke-width="2"
          pointer-events="none"
      />
    </GameMap>

    <GamePanel
        :build-size="buildSize"
        :building="selectedObject"
        @build="size => buildSize = size"
        @cancel-build="buildSize = null"
        @spawn="spawnUnit"
    />

    <RouterLink :to="{ name: $routes.EXAMPLE }">Пример Vuex</RouterLink>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import GameMap from '@/components/pages/GameMap.vue'
import GameObject from '@/components/pages/GameObject.vue'
import GameUnit from '@/components/pages/GameUnit.vue'
import GamePanel from '@/components/pages/GamePanel.vue'
import type { Unit, MoveEvent } from '@/game/Unit'
import { UNIT_RADIUS, canPlaceObject, objectCorners, snapObject, type MapObject } from '@/game/occupancy'
import { worldWidth, worldHeight, gridSize, worldToScreen, screenToWorld } from '@/game/map'

const store = useStore()
const units = computed(() => store.state.game.units as Unit[])
const objects = computed(() => store.state.game.objects as MapObject[])
const events = computed(() => store.state.game.events as MoveEvent[])
const selectedObject = computed(() => objects.value.find(object => object.id === store.state.game.selectedObjectId))

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

const buildSize = ref<number | null>(null)
const pointer = ref<{ x: number; y: number } | null>(null)
const ghost = computed(() => buildSize.value && pointer.value
  ? { ...snapObject(pointer.value.x, pointer.value.y, buildSize.value), size: buildSize.value }
  : null)
const ghostPoints = computed(() => ghost.value
  ? objectCorners(ghost.value).map(point => `${point.x},${point.y}`).join(' ')
  : '')
const ghostValid = computed(() => !!ghost.value && canPlaceObject(ghost.value, units.value, objects.value))

const onPointerMove = (x: number, y: number) => {
  pointer.value = { x, y }
}

const onBackgroundClick = (x: number, y: number) => {
  if (buildSize.value) {
    store.commit('game/placeBuilding', { ...snapObject(x, y, buildSize.value), size: buildSize.value })
    return
  }
  store.commit('game/selectUnits', [])
}

const selectUnit = (id: number) => {
  store.commit('game/selectUnits', [id])
}

const selectObject = (id: number) => {
  store.commit('game/selectObject', id)
}

const spawnUnit = () => {
  if (selectedObject.value) store.commit('game/spawnUnit', selectedObject.value.id)
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
  if (buildSize.value) {
    buildSize.value = null
    return
  }
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
