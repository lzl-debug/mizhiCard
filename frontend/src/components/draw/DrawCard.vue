<template>
  <div
    class="draw-card-wrapper"
    :class="{
      'is-flipped': flipped,
      'is-revealing': revealing,
      [`rarity-${rarity.toLowerCase()}`]: true,
    }"
    :style="cardStyle"
  >
    <div class="card-inner">
      <!-- Card Back -->
      <div class="card-face card-back">
        <div class="card-back-pattern">
          <div class="card-back-lines" />
          <div class="card-back-center">
            <div class="card-back-diamond" />
          </div>
        </div>
      </div>
      <!-- Card Front -->
      <div class="card-face card-front">
        <div class="card-image-wrapper">
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="name"
            class="card-image"
            loading="lazy"
          />
          <div v-else class="card-placeholder">
            <span class="placeholder-icon">?</span>
          </div>
        </div>
        <div class="card-overlay">
          <div class="card-rarity-line" />
          <RarityBadge :rarity="rarity" size="sm" />
          <span class="card-name">{{ name }}</span>
        </div>
      </div>
    </div>
    <!-- SSR Reveal Sparkles -->
    <div v-if="isSSR && revealing" class="ssr-sparkles">
      <div v-for="i in 12" :key="i" class="sparkle" :style="sparkleStyle(i)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Rarity } from '../../utils/rarity'
import { RARITY_CONFIG } from '../../utils/rarity'
import RarityBadge from '../shared/RarityBadge.vue'

const props = withDefaults(
  defineProps<{
    name?: string
    rarity?: Rarity
    imageUrl?: string
    flipped?: boolean
    revealing?: boolean
    index?: number
  }>(),
  {
    name: '',
    rarity: 'N',
    imageUrl: '',
    flipped: false,
    revealing: false,
    index: 0,
  }
)

const config = computed(() => RARITY_CONFIG[props.rarity])
const isSSR = computed(() => props.rarity === 'SSR')

const cardStyle = computed(() => ({
  '--rarity-color': config.value.color,
  '--rarity-glow': config.value.glowColor,
  transitionDelay: `${props.index * 80}ms`,
}))

function sparkleStyle(i: number) {
  const angle = (i / 12) * 360
  const distance = 60 + Math.random() * 40
  const x = Math.cos((angle * Math.PI) / 180) * distance
  const y = Math.sin((angle * Math.PI) / 180) * distance
  const delay = Math.random() * 0.4
  const size = 4 + Math.random() * 8
  return {
    '--x': `${x}px`,
    '--y': `${y}px`,
    '--size': `${size}px`,
    '--delay': `${delay}s`,
    animationDelay: `${delay}s`,
    width: `${size}px`,
    height: `${size}px`,
  }
}
</script>

<style scoped>
.draw-card-wrapper {
  perspective: 800px;
  width: 140px;
  height: 187px;
  flex-shrink: 0;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: var(--delay, 0ms);
}

.is-flipped .card-inner {
  transform: rotateY(180deg);
}

.is-revealing .card-inner {
  animation: cardRevealGlow 1s var(--ease-out);
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 10px;
  overflow: hidden;
}

/* Card Back */
.card-back {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.card-back-pattern {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.card-back-lines {
  position: absolute;
  inset: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(255, 255, 255, 0.02) 4px,
    rgba(255, 255, 255, 0.02) 8px
  );
}

.card-back-center {
  position: relative;
  z-index: 1;
}

.card-back-diamond {
  width: 36px;
  height: 36px;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  transform: rotate(45deg);
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.1);
}

/* Card Front */
.card-front {
  transform: rotateY(180deg);
  background: var(--bg-card);
  border: 2px solid color-mix(in srgb, var(--rarity-color) 40%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--rarity-glow) 30%, transparent);
}

.card-image-wrapper {
  position: absolute;
  inset: 0;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-card));
}

.placeholder-icon {
  font-size: 32px;
  font-family: var(--font-display);
  color: var(--text-muted);
}

.card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-rarity-line {
  height: 2px;
  background: var(--rarity-color);
  box-shadow: 0 0 6px var(--rarity-glow);
  border-radius: 1px;
  margin-bottom: 2px;
}

.card-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-display);
}

/* SSR Sparkles */
.ssr-sparkles {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  background: var(--rarity-ssr);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--rarity-ssr);
  animation: sparkle 0.8s var(--ease-out) forwards;
  animation-delay: var(--delay);
  opacity: 0;
}

/* Rarity-specific enhancements */
.rarity-ssr .card-front {
  border-color: color-mix(in srgb, var(--rarity-ssr) 60%, transparent);
  box-shadow:
    0 0 20px var(--rarity-ssr-glow),
    0 0 60px rgba(255, 215, 0, 0.2);
}

.rarity-sr .card-front {
  border-color: color-mix(in srgb, var(--rarity-sr) 50%, transparent);
  box-shadow: 0 0 16px var(--rarity-sr-glow);
}

@media (min-width: 480px) {
  .draw-card-wrapper {
    width: 160px;
    height: 213px;
  }
}
</style>
