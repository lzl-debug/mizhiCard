<template>
  <div class="stats-bar">
    <div class="stat-item">
      <span class="stat-value">{{ total }}</span>
      <span class="stat-label">收集</span>
    </div>
    <div class="stat-divider" />
    <div class="stat-item" v-for="r in rarities" :key="r.key" :style="{ '--rarity-color': r.color }">
      <span class="stat-value stat-rarity">{{ counts[r.key] }}</span>
      <span class="stat-label">{{ r.key }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RARITY_CONFIG, RARITY_ORDER } from '../../utils/rarity'

const props = defineProps<{
  ssr: number
  sr: number
  r: number
  n: number
}>()

const total = computed(() => props.ssr + props.sr + props.r + props.n)
const counts = computed(() => ({
  SSR: props.ssr,
  SR: props.sr,
  R: props.r,
  N: props.n,
}))

const rarities = computed(() =>
  RARITY_ORDER.map((k) => ({
    key: k,
    color: RARITY_CONFIG[k].color,
  }))
)
</script>

<style scoped>
.stats-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow-x: auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 36px;
  flex-shrink: 0;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.stat-rarity {
  color: var(--rarity-color);
  text-shadow: 0 0 8px color-mix(in srgb, var(--rarity-color) 40%, transparent);
}

.stat-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.06);
}
</style>
