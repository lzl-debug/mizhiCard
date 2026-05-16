<template>
  <div class="collection-card" :class="[`rarity-${card.rarity.toLowerCase()}`, { 'is-new': isNew }]">
    <div class="card-image-wrapper">
      <img
        v-if="card.imageUrl"
        :src="card.imageUrl"
        :alt="card.name"
        class="card-image"
        loading="lazy"
      />
      <div v-else class="card-placeholder">
        <span>?</span>
      </div>
      <div class="card-shine" />
    </div>
    <div class="card-info">
      <span class="card-name">{{ card.name }}</span>
      <RarityBadge :rarity="card.rarity" size="sm" />
    </div>
    <div v-if="count > 1" class="card-count-badge">
      x{{ count }}
    </div>
    <div v-if="isNew" class="new-badge">NEW</div>
    <div class="card-glow" />
  </div>
</template>

<script setup lang="ts">
import type { Card } from '../../composables/useCardApi'
import RarityBadge from '../shared/RarityBadge.vue'

defineProps<{
  card: Card
  count?: number
  isNew?: boolean
}>()
</script>

<style scoped>
.collection-card {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-card);
  border: 1.5px solid var(--border-subtle);
  transition: all 0.3s var(--ease-out);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.collection-card:active {
  transform: scale(0.96);
}

.card-image-wrapper {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.collection-card:hover .card-image {
  transform: scale(1.05);
}

.card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  font-size: 24px;
  color: var(--text-muted);
  font-family: var(--font-display);
}

.card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05),
    transparent
  );
  transition: left 0.5s ease;
}

.collection-card:hover .card-shine {
  left: 100%;
}

.card-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  gap: 6px;
}

.card-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  font-family: var(--font-display);
}

.card-count-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  z-index: 2;
}

.new-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: var(--accent-primary);
  color: white;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  z-index: 2;
  animation: pulse 1.5s ease infinite;
}

/* Rarity borders */
.rarity-ssr {
  border-color: color-mix(in srgb, var(--rarity-ssr) 50%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--rarity-ssr-glow) 30%, transparent);
}

.rarity-sr {
  border-color: color-mix(in srgb, var(--rarity-sr) 40%, transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--rarity-sr-glow) 25%, transparent);
}

.rarity-r {
  border-color: color-mix(in srgb, var(--rarity-r) 30%, transparent);
  box-shadow: 0 0 8px color-mix(in srgb, var(--rarity-r-glow) 20%, transparent);
}

.rarity-n {
  box-shadow: 0 0 4px color-mix(in srgb, var(--rarity-n-glow) 15%, transparent);
}

/* New card animation */
.is-new {
  animation: scaleInSpring 0.5s var(--ease-spring);
}
</style>
