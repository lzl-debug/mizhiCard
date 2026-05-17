<template>
  <div class="draw-page">
    <ParticleBackground :excitement="particleExcitement" :accent-color="accentColor" />

    <div class="page-content">
      <!-- Header -->
      <header class="page-header">
        <h1 class="app-title">秘之卡</h1>
        <p class="app-subtitle">揭开命运之卡</p>
      </header>

      <!-- Draw Area -->
      <div class="draw-area">
        <!-- Loading -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner" />
          <p>正在连接卡池...</p>
        </div>

        <!-- Empty Pool -->
        <div v-else-if="pool.length === 0" class="empty-state">
          <div class="empty-icon">🃏</div>
          <p class="empty-title">卡池为空</p>
          <p class="empty-desc">请联系管理员添加卡牌</p>
        </div>

        <!-- Card Display -->
        <div v-else class="draw-display">
          <GlassCard depth="2" glow glow-color="rgba(99, 102, 241, 0.15)">
            <div class="draw-card-slot">
              <div v-if="!showResults && !draw.isDrawing" class="slot-empty">
                <span class="slot-hint">点击下方按钮抽卡</span>
              </div>
              <div v-else-if="draw.isDrawing" class="slot-drawing">
                <div class="drawing-animation">
                  <div class="drawing-ring" />
                  <div class="drawing-ring drawing-ring--inner" />
                  <span class="drawing-text">抽卡中...</span>
                </div>
              </div>
              <div v-else class="slot-results-preview">
                <div
                  v-for="(card, i) in draw.lastResults.slice(0, 5)"
                  :key="i"
                  class="preview-card"
                  :class="`rarity-${card.rarity.toLowerCase()}`"
                  :style="{ animationDelay: `${i * 60}ms` }"
                >
                  <img :src="card.imageUrl" :alt="card.name" />
                  <RarityBadge :rarity="card.rarity" size="sm" />
                </div>
                <div v-if="draw.lastResults.length > 5" class="preview-more">
                  +{{ draw.lastResults.length - 5 }}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <!-- Draw Count -->
        <div v-if="draw.drawCount > 0" class="draw-count">
          累计抽卡 <strong>{{ draw.drawCount }}</strong> 次
        </div>

        <!-- Draw Buttons -->
        <DrawButton
          :disabled="draw.isDrawing || pool.length === 0 || isLoading"
          @draw="handleDraw"
        />
      </div>

      <!-- Recent History -->
      <div v-if="draw.drawHistory.length > 0" class="recent-history">
        <h3 class="section-title">最近抽卡</h3>
        <div class="history-list">
          <div
            v-for="(entry, i) in draw.drawHistory.slice(0, 10)"
            :key="i"
            class="history-item"
          >
            <div class="history-cards">
              <img
                v-for="(card, j) in entry.cards.slice(0, 3)"
                :key="j"
                :src="card.imageUrl"
                :alt="card.name"
                class="history-thumb"
              />
              <span v-if="entry.cards.length > 3" class="history-more">
                +{{ entry.cards.length - 3 }}
              </span>
            </div>
            <span class="history-type">{{ entry.type === 'single' ? '单抽' : '十连' }}</span>
            <span class="history-time">{{ formatTime(entry.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Result Modal -->
    <DrawResultModal
      :visible="showResults"
      :cards="draw.lastResults"
      @close="closeResults"
    />

    <!-- Bottom Nav -->
    <BottomNav
      current-path="/pages/index/index"
      @navigate="handleNavigate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCardApi } from '../../composables/useCardApi'
import { useDraw } from '../../composables/useDraw'
import { useCollection } from '../../composables/useCollection'
import { RARITY_CONFIG } from '../../utils/rarity'
import type { Rarity } from '../../utils/rarity'
import ParticleBackground from '../../components/shared/ParticleBackground.vue'
import GlassCard from '../../components/shared/GlassCard.vue'
import RarityBadge from '../../components/shared/RarityBadge.vue'
import BottomNav from '../../components/shared/BottomNav.vue'
import DrawButton from '../../components/draw/DrawButton.vue'
import DrawResultModal from '../../components/draw/DrawResultModal.vue'

const { cardPool: pool, isLoading, fetchCards } = useCardApi()
const draw = useDraw()
const { addCards } = useCollection()

const showResults = ref(false)
const particleExcitement = ref(0)
const accentColor = ref('#6366F1')

function handleDraw(type: 'single' | 'ten') {
  const cards = draw.performDraw(type, pool.value)
  if (cards.length === 0) return

  particleExcitement.value = 1
  setTimeout(() => { particleExcitement.value = 0 }, 2000)

  const rarest = cards.reduce((prev, curr) => {
    const order = ['SSR', 'SR', 'R', 'N']
    return order.indexOf(prev.rarity) < order.indexOf(curr.rarity) ? prev : curr
  })
  accentColor.value = RARITY_CONFIG[rarest.rarity as Rarity]?.color || '#6366F1'

  setTimeout(() => {
    showResults.value = true
  }, 400)

  addCards(cards)
}

function closeResults() {
  showResults.value = false
  draw.finishDraw()
  accentColor.value = '#6366F1'
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function handleNavigate(path: string) {
  uni.navigateTo({ url: path })
}

onMounted(() => {
  fetchCards()
})
</script>

<style scoped>
.draw-page {
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
}

/* Header */
.page-header {
  text-align: center;
  padding: 32px 0 20px;
}

.app-title {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.15em;
  background: linear-gradient(135deg, #1a1a2e, #6b6b80);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin: 4px 0 0;
  letter-spacing: 0.1em;
}

/* Draw Area */
.draw-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 320px;
}

.draw-display {
  width: 100%;
  max-width: 320px;
}

.draw-card-slot {
  padding: 24px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slot-empty {
  text-align: center;
}

.slot-hint {
  font-size: 14px;
  color: var(--text-muted);
}

.slot-drawing {
  text-align: center;
}

.drawing-animation {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto;
}

.drawing-ring {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(99, 102, 241, 0.2);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.drawing-ring--inner {
  inset: 12px;
  animation-direction: reverse;
  animation-duration: 0.7s;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.drawing-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 700;
}

.slot-results-preview {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.preview-card {
  width: 48px;
  height: 64px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  animation: scaleInSpring 0.4s var(--ease-spring) backwards;
  border: 1.5px solid var(--border-medium);
}

.preview-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-card .rarity-badge {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  scale: 0.7;
}

.preview-more {
  width: 48px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: var(--bg-glass);
  border: 1px solid var(--border-medium);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
  animation: scaleInSpring 0.4s var(--ease-spring) backwards;
}

.draw-count {
  font-size: 12px;
  color: var(--text-muted);
}

.draw-count strong {
  color: var(--text-primary);
  font-weight: 700;
}

/* Loading State */
.loading-state {
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

/* Empty State */
.empty-state {
  text-align: center;
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

/* Recent History */
.recent-history {
  padding: 20px 0;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
  margin: 0 0 12px;
  letter-spacing: 0.05em;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.history-cards {
  display: flex;
  gap: 4px;
  align-items: center;
  flex: 1;
}

.history-thumb {
  width: 28px;
  height: 37px;
  border-radius: 3px;
  object-fit: cover;
}

.history-more {
  font-size: 11px;
  color: var(--text-muted);
}

.history-type {
  font-size: 11px;
  color: var(--accent-primary);
  font-weight: 700;
  min-width: 28px;
  text-align: center;
}

.history-time {
  font-size: 11px;
  color: var(--text-muted);
  min-width: 32px;
  text-align: right;
}
</style>
