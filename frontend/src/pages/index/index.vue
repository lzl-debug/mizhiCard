<template>
  <div class="draw-page">
    <!-- Particle background -->
    <ParticleBackground :particle-count="50" accent-color="#e8a0b8" />

    <!-- Soft gradient orbs -->
    <div class="atmosphere">
      <div class="orb orb--1" />
      <div class="orb orb--2" />
      <div class="orb orb--3" />
    </div>

    <div class="page-content">
      <header class="page-header">
        <div class="sigil-line">
          <span class="sigil-dot" />
          <span class="sigil-dash" />
          <span class="sigil-dot" />
        </div>
        <h1 class="app-title">密之语</h1>
        <p class="app-subtitle">揭开命运之卡</p>
      </header>

      <div class="draw-area">
        <!-- Card Display -->
        <div class="card-stage">
          <div class="card-shadow" :class="{ 'is-active': showCard }" />
          <div class="card-container" :class="{ 'is-flipped': showCard }">
            <div class="card-face card-back">
              <div class="card-back-inner">
                <div class="card-back-frame" />
                <svg viewBox="0 0 60 60" class="card-back-sigil">
                  <circle cx="30" cy="30" r="22" fill="none" stroke="currentColor" stroke-width="0.5" />
                  <circle cx="30" cy="30" r="15" fill="none" stroke="currentColor" stroke-width="0.3" />
                  <rect x="20" y="20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="0.4" transform="rotate(45 30 30)" />
                </svg>
              </div>
            </div>
            <div class="card-face card-front" @click="openPreview">
              <img v-if="currentCard" :src="currentCard.imageUrl" class="card-img" />
              <div v-else class="card-loading">
                <div class="loading-spinner" />
              </div>
            </div>
          </div>
        </div>

        <!-- Draw Button -->
        <button
          class="draw-btn"
          :disabled="isDrawing || pool.length === 0"
          @click="handleDraw"
        >
          <span v-if="isDrawing" class="btn-spinner" />
          <span v-else>抽一张</span>
        </button>
      </div>
    </div>

    <!-- Image Preview Overlay -->
    <div v-if="previewVisible && currentCard" class="preview-overlay" @click="closePreview">
      <img :src="currentCard.imageUrl" class="preview-img" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCardApi, type Card } from '../../composables/useCardApi'
import ParticleBackground from '../../components/shared/ParticleBackground.vue'

const { cardPool: pool, fetchCards } = useCardApi()

const currentCard = ref<Card | null>(null)
const showCard = ref(false)
const isDrawing = ref(false)
const previewVisible = ref(false)

function randomCard(): Card | null {
  if (pool.value.length === 0) return null
  return pool.value[Math.floor(Math.random() * pool.value.length)]
}

function handleDraw() {
  if (isDrawing.value || pool.value.length === 0) return
  isDrawing.value = true
  showCard.value = false

  setTimeout(() => {
    const card = randomCard()
    if (card) currentCard.value = card
    showCard.value = true
    isDrawing.value = false
  }, 700)
}

function openPreview() {
  if (currentCard.value && showCard.value) previewVisible.value = true
}

function closePreview() {
  previewVisible.value = false
}

onMounted(async () => {
  await fetchCards()
  const card = randomCard()
  if (card) {
    currentCard.value = card
    setTimeout(() => { showCard.value = true }, 100)
  }
})
</script>

<style scoped>
.draw-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #fdf5f7;
}

/* Atmosphere - soft gradient orbs */
.atmosphere {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  animation: orb-drift 18s ease-in-out infinite;
}

.orb--1 {
  width: 260px;
  height: 260px;
  top: -60px;
  right: -40px;
  background: radial-gradient(circle, rgba(240, 160, 180, 0.4) 0%, transparent 70%);
}

.orb--2 {
  width: 320px;
  height: 320px;
  bottom: -80px;
  left: -60px;
  background: radial-gradient(circle, rgba(200, 160, 220, 0.3) 0%, transparent 70%);
  animation-delay: -6s;
}

.orb--3 {
  width: 200px;
  height: 200px;
  top: 40%;
  left: 50%;
  background: radial-gradient(circle, rgba(255, 190, 200, 0.25) 0%, transparent 70%);
  animation-delay: -12s;
}

@keyframes orb-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(12px, -8px) scale(1.03); }
  66% { transform: translate(-8px, 6px) scale(0.97); }
}

/* Content */
.page-content {
  position: relative;
  z-index: 1;
  height: 100%;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
}

/* Header */
.page-header {
  text-align: center;
  padding: 48px 0 0;
  animation: fade-in 0.8s ease-out both;
}

.sigil-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 12px;
}

.sigil-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(210, 130, 150, 0.5);
}

.sigil-dash {
  width: 24px;
  height: 1px;
  background: rgba(210, 130, 150, 0.35);
}

.app-title {
  font-family: 'Noto Serif SC', 'STSong', serif;
  font-size: 30px;
  font-weight: 700;
  color: #3d2832;
  margin: 0;
  letter-spacing: 0.2em;
}

.app-subtitle {
  font-family: 'Noto Serif SC', serif;
  font-size: 12px;
  color: rgba(180, 100, 120, 0.6);
  margin: 6px 0 0;
  letter-spacing: 0.25em;
  font-weight: 400;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Draw Area */
.draw-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
}

/* Card Stage */
.card-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-shadow {
  position: absolute;
  width: 280px;
  height: 30px;
  bottom: -20px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(200, 120, 140, 0.1) 0%, transparent 70%);
  opacity: 0.5;
  transition: opacity 0.8s ease;
}

.card-shadow.is-active {
  opacity: 1;
}

.card-container {
  perspective: 1000px;
  width: 320px;
  height: 240px;
  animation: gentle-float 5s ease-in-out infinite;
}

@keyframes gentle-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 14px;
  overflow: hidden;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 12px 40px rgba(180, 100, 120, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-back {
  transform: rotateY(0deg);
}

.card-back-inner {
  width: 100%;
  height: 100%;
  background: linear-gradient(155deg, #fce8ed 0%, #f5dce2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.card-back-frame {
  position: absolute;
  inset: 12px;
  border: 1px solid rgba(210, 130, 150, 0.25);
  border-radius: 8px;
}

.card-back-sigil {
  width: 50px;
  height: 50px;
  color: rgba(210, 130, 150, 0.4);
  animation: sigil-breathe 4s ease-in-out infinite;
}

@keyframes sigil-breathe {
  0%, 100% { opacity: 0.4; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.6; transform: scale(1.02) rotate(2deg); }
}

.card-front {
  transform: rotateY(180deg);
  cursor: pointer;
  border: 1px solid rgba(210, 130, 150, 0.12);
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

/* Draw Button */
.draw-btn {
  padding: 13px 44px;
  border: 1px solid rgba(210, 130, 150, 0.35);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #5a3040;
  font-family: 'Noto Serif SC', serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.3s ease;
  -webkit-tap-highlight-color: transparent;
  animation: fade-in 0.8s ease-out 0.2s both;
}

.draw-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(210, 130, 150, 0.6);
  box-shadow: 0 4px 20px rgba(210, 130, 150, 0.15);
}

.draw-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.draw-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 1.5px solid rgba(210, 130, 150, 0.25);
  border-top-color: rgba(210, 130, 150, 0.7);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Card loading */
.card-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fdf0f3;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 1.5px solid rgba(210, 130, 150, 0.15);
  border-top-color: rgba(210, 130, 150, 0.5);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Preview Overlay */
.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(253, 245, 247, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: preview-fade 0.25s ease-out;
}

.preview-img {
  max-width: 92vw;
  max-height: 88vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(180, 100, 120, 0.15);
}

@keyframes preview-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
