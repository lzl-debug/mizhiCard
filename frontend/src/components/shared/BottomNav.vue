<template>
  <nav class="bottom-nav">
    <div
      v-for="tab in tabs"
      :key="tab.path"
      class="nav-item"
      :class="{ active: currentPath === tab.path }"
      @click="navigateTo(tab.path)"
    >
      <span class="nav-icon" v-html="tab.icon" />
      <span class="nav-label">{{ tab.label }}</span>
      <div v-if="currentPath === tab.path" class="nav-indicator" />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentPath: string
}>()

const emit = defineEmits<{
  navigate: [path: string]
}>()

const tabs = [
  {
    path: '/pages/index/index',
    label: '抽卡',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  },
  {
    path: '/pages/collection/collection',
    label: '收藏',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  },
]

function navigateTo(path: string) {
  emit('navigate', path)
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 64px;
  padding: 0 12px 8px;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 100;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
}

.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s var(--ease-out);
  color: var(--text-muted);
  -webkit-tap-highlight-color: transparent;
}

.nav-item.active {
  color: var(--accent-primary);
}

.nav-item:active {
  transform: scale(0.92);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  transition: transform 0.3s var(--ease-out);
}

.nav-item.active .nav-icon {
  transform: translateY(-2px);
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.nav-indicator {
  position: absolute;
  top: -1px;
  width: 20px;
  height: 2px;
  background: var(--accent-primary);
  border-radius: 0 0 2px 2px;
  box-shadow: 0 0 8px var(--accent-primary-glow);
  animation: slideDown 0.3s var(--ease-spring);
}
</style>
