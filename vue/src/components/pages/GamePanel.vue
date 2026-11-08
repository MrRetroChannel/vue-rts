<template>
  <nav class="game-panel" aria-label="Панель навигации">
    <section>
      <h2>Строительство</h2>
      <div class="buttons">
        <button
            v-for="size in buildingSizes"
            :key="size"
            type="button"
            :class="{ active: buildSize === size }"
            @click="emit('build', size)"
        >
          Здание {{ size }}×{{ size }}
        </button>
        <button v-if="buildSize" type="button" @click="emit('cancel-build')">Отмена</button>
      </div>
      <p v-if="buildSize">ЛКМ по карте — поставить здание, ПКМ — отмена.</p>
    </section>
  </nav>
</template>

<script setup lang="ts">
defineProps<{ buildSize: number | null }>()
const emit = defineEmits<{ build: [size: number]; 'cancel-build': [] }>()

const buildingSizes = [1, 2, 3, 4]
</script>

<style scoped lang="scss">
.game-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin: 16px 0;
  padding: 12px 16px;
  border: 1px solid #66805b;
  background: #2c3d29;
  color: #f0f4e7;

  h2 {
    margin: 0 0 8px;
    font-size: 16px;
  }

  p {
    margin: 8px 0 0;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  button {
    padding: 4px 12px;
    border: 1px solid #b9cba5;
    background: #354c2e;
    color: inherit;
    cursor: pointer;

    &.active {
      border-color: #ffe08a;
      color: #ffe08a;
    }
  }
}
</style>
