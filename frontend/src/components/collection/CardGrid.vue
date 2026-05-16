<template>
  <div v-if="cards.length > 0" class="card-grid">
    <CardItem
      v-for="item in cards"
      :key="item.card.id"
      :card="item.card"
      :count="item.count"
      :is-new="isNewItem(item)"
    />
  </div>
  <div v-else class="grid-empty">
    <slot name="empty">
      <div class="empty-icon">📭</div>
      <p class="empty-text">暂无卡牌</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import type { CollectedCard } from '../../composables/useCollection'
import CardItem from './CardItem.vue'

defineProps<{
  cards: CollectedCard[]
}>()

function isNewItem(item: CollectedCard): boolean {
  const now = Date.now()
  // Show "NEW" badge if obtained within last 10 seconds
  return now - item.obtainedAt < 10000
}
</script>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
  padding: 4px 0;
}

.grid-empty {
  text-align: center;
  padding: 40px 0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

@media (min-width: 420px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
}
</style>
