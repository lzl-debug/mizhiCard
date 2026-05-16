<template>
  <div class="glass-card" :class="[`depth-${depth}`, { 'has-glow': glow }]" :style="glowStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    depth?: number
    glow?: boolean
    glowColor?: string
  }>(),
  {
    depth: 1,
    glow: false,
    glowColor: '',
  }
)

const glowStyle = computed(() => {
  if (!props.glow || !props.glowColor) return {}
  return {
    boxShadow: `0 0 20px ${props.glowColor}33, 0 0 60px ${props.glowColor}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
  }
})
</script>

<style scoped>
.glass-card {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.glass-card.depth-1 {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.glass-card.depth-2 {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-card.depth-3 {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
