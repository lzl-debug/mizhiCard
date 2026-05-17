<template>
  <div class="draw-buttons">
    <button
      class="draw-btn draw-btn--single"
      :disabled="disabled"
      @click="$emit('draw', 'single')"
    >
      <span class="btn-label">单抽</span>
      <span class="btn-sub">抽一次</span>
    </button>
    <button
      class="draw-btn draw-btn--ten"
      :disabled="disabled"
      @click="$emit('draw', 'ten')"
    >
      <span class="btn-glow" />
      <span class="btn-label">十连抽</span>
      <span class="btn-sub">保底 SR+</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

defineEmits<{
  draw: [type: 'single' | 'ten']
}>()
</script>

<style scoped>
.draw-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 8px 0;
}

.draw-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.3s var(--ease-out);
  overflow: hidden;
  font-family: var(--font-body);
}

.draw-btn:active:not(:disabled) {
  transform: scale(0.94);
}

.draw-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.btn-label {
  font-weight: 700;
  letter-spacing: 0.1em;
  position: relative;
  z-index: 1;
}

.btn-sub {
  font-size: 10px;
  opacity: 0.7;
  position: relative;
  z-index: 1;
}

/* Single Draw Button */
.draw-btn--single {
  padding: 14px 28px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: var(--text-primary);
  font-size: 14px;
}

.draw-btn--single:active:not(:disabled) {
  background: rgba(0, 0, 0, 0.08);
}

/* 10-Draw Button */
.draw-btn--ten {
  padding: 14px 36px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: white;
  font-size: 16px;
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.3);
}

.draw-btn--ten::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: calc(var(--radius-lg) + 2px);
  background: linear-gradient(
    90deg,
    var(--rarity-ssr),
    var(--rarity-sr),
    var(--rarity-r),
    var(--rarity-sr),
    var(--rarity-ssr)
  );
  background-size: 300% 100%;
  animation: borderRotate 3s linear infinite;
  z-index: 0;
  opacity: 0.8;
}

.draw-btn--ten:active:not(:disabled) {
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);
}

.btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
  z-index: 0;
}
</style>
