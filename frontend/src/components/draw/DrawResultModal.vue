<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-backdrop" @click.self="$emit('close')">
        <div class="modal-content">
          <!-- SSR Flash Effect -->
          <div v-if="hasSSR" class="ssr-flash" />

          <div class="modal-header">
            <h2 class="modal-title">{{ title }}</h2>
            <p class="modal-subtitle">{{ subtitle }}</p>
          </div>

          <div class="modal-cards" :class="{ 'is-ten': cards.length > 1 }">
            <DrawCard
              v-for="(card, i) in cards"
              :key="i"
              :name="card.name"
              :rarity="card.rarity"
              :image-url="card.imageUrl"
              :flipped="revealed"
              :revealing="revealed && card.rarity === 'SSR'"
              :index="i"
              :style="{ animationDelay: `${i * 80}ms` }"
              class="modal-card-item"
            />
          </div>

          <div class="modal-footer">
            <button class="confirm-btn" @click="$emit('close')">
              确认
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Card } from '../../composables/useCardApi'
import DrawCard from './DrawCard.vue'

const props = defineProps<{
  visible: boolean
  cards: Card[]
}>()

defineEmits<{
  close: []
}>()

const revealed = ref(false)
let revealTimer: ReturnType<typeof setTimeout> | null = null

const hasSSR = computed(() => props.cards.some((c) => c.rarity === 'SSR'))
const hasSR = computed(() => props.cards.some((c) => c.rarity === 'SR'))

const title = computed(() => {
  if (props.cards.length > 1) return '十连抽结果'
  return '抽卡结果'
})

const subtitle = computed(() => {
  if (hasSSR.value) return '🌟 恭喜获得传说卡牌！'
  if (hasSR.value) return '✨ 运气不错！'
  return '祝你好运'
})

watch(
  () => props.visible,
  (v) => {
    if (v) {
      revealed.value = false
      revealTimer = setTimeout(() => {
        revealed.value = true
      }, 500)
    } else {
      if (revealTimer) clearTimeout(revealTimer)
    }
  }
)

onMounted(() => {
  if (props.visible) {
    revealTimer = setTimeout(() => {
      revealed.value = true
    }, 500)
  }
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  animation: fadeInScale 0.4s var(--ease-spring);
}

.ssr-flash {
  position: fixed;
  inset: 0;
  background: radial-gradient(
    circle at center,
    rgba(255, 215, 0, 0.15),
    transparent 70%
  );
  pointer-events: none;
  animation: fadeIn 0.5s ease;
  z-index: -1;
}

.modal-header {
  text-align: center;
}

.modal-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 4px;
  letter-spacing: 0.05em;
}

.modal-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.modal-cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  padding: 8px 0;
}

.modal-cards.is-ten {
  gap: 8px;
}

.modal-card-item {
  animation: scaleIn 0.4s var(--ease-spring) backwards;
}

/* Stagger animation for cards */
.modal-card-item:nth-child(1) { animation-delay: 0ms; }
.modal-card-item:nth-child(2) { animation-delay: 60ms; }
.modal-card-item:nth-child(3) { animation-delay: 120ms; }
.modal-card-item:nth-child(4) { animation-delay: 180ms; }
.modal-card-item:nth-child(5) { animation-delay: 240ms; }
.modal-card-item:nth-child(6) { animation-delay: 300ms; }
.modal-card-item:nth-child(7) { animation-delay: 360ms; }
.modal-card-item:nth-child(8) { animation-delay: 420ms; }
.modal-card-item:nth-child(9) { animation-delay: 480ms; }
.modal-card-item:nth-child(10) { animation-delay: 540ms; }

.modal-footer {
  padding: 8px 0;
}

.confirm-btn {
  padding: 12px 60px;
  border: none;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: all 0.3s var(--ease-out);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
  -webkit-tap-highlight-color: transparent;
}

.confirm-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.2);
}

/* Transition */
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
  opacity: 0;
}

@media (max-width: 380px) {
  .modal-cards {
    gap: 6px;
  }
  .modal-cards.is-ten {
    gap: 4px;
  }
  .modal-title {
    font-size: 18px;
  }
}
</style>
