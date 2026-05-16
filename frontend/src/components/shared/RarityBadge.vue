<template>
  <span class="rarity-badge" :class="[`rarity-${rarity.toLowerCase()}`]" :style="badgeStyle">
    <span class="rarity-dot" />
    <span class="rarity-text">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Rarity } from '../../utils/rarity'
import { RARITY_CONFIG } from '../../utils/rarity'

const props = withDefaults(
  defineProps<{
    rarity: Rarity
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    size: 'md',
  }
)

const config = computed(() => RARITY_CONFIG[props.rarity])
const label = computed(() => {
  const name = config.value.name
  if (props.size === 'sm') return props.rarity
  return `${props.rarity} · ${name}`
})

const badgeStyle = computed(() => ({
  '--rarity-color': config.value.color,
  '--rarity-glow': config.value.glowColor,
  '--rarity-bg': config.value.bgColor,
}))
</script>

<style scoped>
.rarity-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-weight: 700;
  letter-spacing: 0.05em;
  background: var(--rarity-bg);
  color: var(--rarity-color);
  border: 1px solid color-mix(in srgb, var(--rarity-color) 30%, transparent);
  text-shadow: 0 0 8px var(--rarity-glow);
  box-shadow: 0 0 8px color-mix(in srgb, var(--rarity-glow) 20%, transparent);
  font-size: 12px;
  line-height: 1;
}

.rarity-badge.sm {
  padding: 1px 6px;
  font-size: 10px;
  gap: 2px;
}

.rarity-badge.lg {
  padding: 4px 14px;
  font-size: 14px;
  gap: 6px;
}

.rarity-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--rarity-color);
  box-shadow: 0 0 4px var(--rarity-glow);
}

.rarity-badge.sm .rarity-dot {
  width: 4px;
  height: 4px;
}

.rarity-badge.lg .rarity-dot {
  width: 8px;
  height: 8px;
}
</style>
