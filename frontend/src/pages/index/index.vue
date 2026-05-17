<template>
  <div class="draw-page">
    <ParticleBackground :particle-count="40" />

    <div class="page-content">
      <header class="page-header">
        <h1 class="app-title">秘之卡</h1>
        <p class="app-subtitle">揭开命运之卡</p>
      </header>

      <div class="draw-area">
        <!-- Loading -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner" />
          <p>正在连接卡池...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="pool.length === 0" class="empty-state">
          <div class="empty-icon">🃏</div>
          <p class="empty-title">卡池为空</p>
          <p class="empty-desc">请联系管理员添加卡牌</p>
        </div>

        <!-- Card Display -->
        <div v-else class="card-stage">
          <div class="card-container" :class="{ 'is-flipped': showCard }">
            <div class="card-face card-back">
              <div class="card-back-inner">
                <div class="card-back-pattern">
                  <div class="back-lines" />
                  <div class="back-diamond" />
                </div>
              </div>
            </div>
            <div class="card-face card-front">
              <img v-if="currentCard" :src="currentCard.imageUrl" class="card-img" />
            </div>
          </div>

          <p v-if="currentCard" class="card-label">{{ currentCard.name }}</p>

          <div v-if="drawCount > 0" class="draw-counter">
            已抽卡 <strong>{{ drawCount }}</strong> 次
          </div>
        </div>

        <!-- Draw Button -->
        <button
          class="draw-btn"
          :disabled="isDrawing || pool.length === 0 || isLoading"
          @click="handleDraw"
        >
          <span v-if="isDrawing" class="btn-spinner" />
          <span v-else>抽一张</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCardApi, type Card } from '../../composables/useCardApi'
import ParticleBackground from '../../components/shared/ParticleBackground.vue'

const { cardPool: pool, isLoading, fetchCards } = useCardApi()

const currentCard = ref<Card | null>(null)
const showCard = ref(false)
const isDrawing = ref(false)
const drawCount = ref(0)

function handleDraw() {
  if (isDrawing.value || pool.value.length === 0) return

  isDrawing.value = true
  showCard.value = false

  const card = pool.value[Math.floor(Math.random() * pool.value.length)]

  setTimeout(() => {
    currentCard.value = card
    showCard.value = true
    drawCount.value++
    isDrawing.value = false
  }, 400)
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
  padding: 0 20px;
  display: flex;
  flex-direction: column;
}

/* Header */
.page-header {
  text-align: center;
  padding: 40px 0 8px;
}

.app-title {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.15em;
}

.app-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin: 4px 0 0;
}

/* Draw Area */
.draw-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

/* Card Stage */
.card-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.card-container {
  perspective: 800px;
  width: 240px;
  height: 320px;
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-back {
  transform: rotateY(0deg);
}

.card-back-inner {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e, #2d2d44);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-back-pattern {
  position: relative;
  width: 80%;
  height: 80%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-lines {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 6px,
    rgba(255, 255, 255, 0.03) 6px,
    rgba(255, 255, 255, 0.03) 12px
  );
}

.back-diamond {
  width: 40px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  transform: rotate(45deg);
}

.card-front {
  transform: rotateY(180deg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.is-flipped .card-back {
  transform: rotateY(180deg);
}

.is-flipped .card-front {
  transform: rotateY(360deg);
}

.card-label {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.draw-counter {
  font-size: 12px;
  color: var(--text-muted);
}

.draw-counter strong {
  color: var(--text-primary);
  font-weight: 700;
}

/* Draw Button */
.draw-btn {
  padding: 16px 48px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: white;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s var(--ease-out);
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.3);
  font-family: var(--font-body);
  -webkit-tap-highlight-color: transparent;
}

.draw-btn:active:not(:disabled) {
  transform: scale(0.95);
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.2);
}

.draw-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* States */
.loading-state, .empty-state {
  text-align: center;
  color: var(--text-muted);
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

.empty-icon { font-size: 48px; margin-bottom: 8px; }
.empty-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
.empty-desc { font-size: 13px; color: var(--text-muted); margin: 0; }
</style>
