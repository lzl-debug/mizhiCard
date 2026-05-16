<template>
  <div class="admin-card-list">
    <div class="list-header">
      <h3 class="list-title">已上传卡牌（{{ cards.length }}）</h3>
    </div>

    <div v-if="cards.length === 0" class="list-empty">
      <p>暂无卡牌，请上传</p>
    </div>

    <div v-else class="list-grid">
      <div
        v-for="card in cards"
        :key="card.id"
        class="list-card"
        :class="`rarity-${card.rarity.toLowerCase()}`"
      >
        <div class="list-card-image">
          <img :src="card.imageUrl" :alt="card.name" />
        </div>
        <div class="list-card-info">
          <span class="list-card-name">{{ card.name }}</span>
          <RarityBadge :rarity="card.rarity" size="sm" />
        </div>
        <button
          class="delete-btn"
          :disabled="deleting === card.id"
          @click="handleDelete(card.id)"
        >
          <span v-if="deleting === card.id" class="delete-spinner" />
          <span v-else>✕</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Card } from '../../composables/useCardApi'
import RarityBadge from '../shared/RarityBadge.vue'

defineProps<{
  cards: Card[]
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()

const deleting = ref<string | null>(null)

async function handleDelete(id: string) {
  deleting.value = id
  emit('delete', id)
  // Parent handles the actual deletion
  setTimeout(() => {
    deleting.value = null
  }, 1000)
}
</script>

<style scoped>
.admin-card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.list-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.list-empty {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 13px;
}

.list-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.list-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  transition: all 0.3s ease;
}

.list-card.rarity-ssr {
  border-color: color-mix(in srgb, var(--rarity-ssr) 40%, transparent);
}

.list-card.rarity-sr {
  border-color: color-mix(in srgb, var(--rarity-sr) 30%, transparent);
}

.list-card.rarity-r {
  border-color: color-mix(in srgb, var(--rarity-r) 20%, transparent);
}

.list-card-image {
  width: 40px;
  height: 53px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.list-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.list-card-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-display);
}

.delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-danger);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.delete-btn:active:not(:disabled) {
  background: var(--accent-danger);
  color: white;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-top-color: var(--accent-danger);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (min-width: 420px) {
  .list-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
