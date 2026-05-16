<template>
  <div class="collection-page">
    <ParticleBackground :particle-count="40" />

    <div class="page-content">
      <header class="page-header">
        <h1 class="page-title">收藏</h1>
        <p class="page-subtitle">已收集 {{ totalCards }} 种卡牌</p>
      </header>

      <!-- Stats -->
      <StatsBar
        :ssr="ssrCount"
        :sr="srCount"
        :r="rCount"
        :n="nCount"
      />

      <!-- Filters -->
      <div class="filter-bar">
        <button
          v-for="filter in filters"
          :key="filter.key"
          class="filter-btn"
          :class="{ active: activeFilter === filter.key }"
          :style="filter.key !== 'ALL' ? { '--filter-color': filter.color } : {}"
          @click="activeFilter = filter.key"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- Card Grid -->
      <CardGrid :cards="filteredCards">
        <template #empty>
          <div class="empty-state">
            <div class="empty-icon">🃏</div>
            <p class="empty-title">
              {{ activeFilter === 'ALL' ? '还没有收集任何卡牌' : '该稀有度暂无卡牌' }}
            </p>
            <p class="empty-desc">
              {{ activeFilter === 'ALL' ? '快去抽卡吧！' : '尝试其他稀有度筛选' }}
            </p>
          </div>
        </template>
      </CardGrid>
    </div>

    <BottomNav
      current-path="/pages/collection/collection"
      @navigate="handleNavigate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCollection } from '../../composables/useCollection'
import { RARITY_CONFIG, RARITY_ORDER } from '../../utils/rarity'
import type { Rarity } from '../../utils/rarity'
import ParticleBackground from '../../components/shared/ParticleBackground.vue'
import BottomNav from '../../components/shared/BottomNav.vue'
import StatsBar from '../../components/collection/StatsBar.vue'
import CardGrid from '../../components/collection/CardGrid.vue'

const {
  collection,
  getCardsByRarity,
  totalCards,
  ssrCount,
  srCount,
  rCount,
  nCount,
} = useCollection()

const activeFilter = ref<Rarity | 'ALL'>('ALL')

const filters = computed(() => [
  { key: 'ALL' as const, label: '全部', color: '' },
  ...RARITY_ORDER.map((k) => ({
    key: k,
    label: RARITY_CONFIG[k].name,
    color: RARITY_CONFIG[k].color,
  })),
])

const filteredCards = computed(() => getCardsByRarity(activeFilter.value))

function handleNavigate(path: string) {
  uni.navigateTo({ url: path })
}
</script>

<style scoped>
.collection-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
}

.page-content {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow-y: auto;
  padding: 0 20px 80px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  text-align: center;
  padding: 32px 0 4px;
}

.page-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.1em;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0 0;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
}

.filter-btn {
  flex-shrink: 0;
  padding: 6px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-medium);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s var(--ease-out);
  -webkit-tap-highlight-color: transparent;
  font-family: var(--font-body);
}

.filter-btn.active {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border-color: color-mix(in srgb, var(--filter-color, #6366F1) 50%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--filter-color, #6366F1) 20%, transparent);
}

.filter-btn:active {
  transform: scale(0.95);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 32px 0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.empty-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}
</style>
