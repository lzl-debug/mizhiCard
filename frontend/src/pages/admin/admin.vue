<template>
  <div class="admin-page">
    <ParticleBackground :particle-count="30" />

    <div class="page-content">
      <header class="page-header">
        <h1 class="page-title">管理后台</h1>
        <button
          v-if="admin.isLoggedIn"
          class="logout-btn"
          @click="admin.logout()"
        >
          退出
        </button>
      </header>

      <!-- Login -->
      <AdminLogin v-if="!admin.isLoggedIn" @login="handleLogin" />

      <!-- Admin Content -->
      <template v-else>
        <!-- Upload Form -->
        <CardUpload
          :key="uploadKey"
          :on-upload="handleUpload"
          @uploaded="refreshCards"
        />

        <!-- Card List -->
        <AdminCardList
          :cards="adminCards"
          @delete="handleDelete"
        />
      </template>

      <p v-if="error" class="error-msg">{{ error }}</p>
    </div>

    <BottomNav
      current-path="/pages/admin/admin"
      @navigate="handleNavigate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdmin } from '../../composables/useAdmin'
import type { Card } from '../../composables/useCardApi'
import type { Rarity } from '../../utils/rarity'
import ParticleBackground from '../../components/shared/ParticleBackground.vue'
import BottomNav from '../../components/shared/BottomNav.vue'
import AdminLogin from '../../components/admin/AdminLogin.vue'
import CardUpload from '../../components/admin/CardUpload.vue'
import AdminCardList from '../../components/admin/AdminCardList.vue'

const admin = useAdmin()
const adminCards = ref<Card[]>([])
const error = ref('')
const uploadKey = ref(0)

async function handleLogin(key: string) {
  error.value = ''
  const success = await admin.login(key)
  if (!success) {
    error.value = '密钥错误，请重试'
  } else {
    await loadCards()
  }
}

async function handleUpload(file: File, name: string, rarity: Rarity): Promise<boolean> {
  error.value = ''
  const result = await admin.uploadCard(file, name, rarity)
  if (result) {
    uploadKey.value++ // Reset the upload form
    return true
  }
  error.value = '上传失败，请检查图片格式和大小'
  return false
}

async function loadCards() {
  const cards = await admin.fetchAdminCards()
  adminCards.value = cards
}

async function handleDelete(id: string) {
  error.value = ''
  const success = await admin.deleteCard(id)
  if (success) {
    adminCards.value = adminCards.value.filter((c) => c.id !== id)
  } else {
    error.value = '删除失败'
  }
}

function refreshCards() {
  loadCards()
}

function handleNavigate(path: string) {
  uni.navigateTo({ url: path })
}

onMounted(() => {
  if (admin.isLoggedIn) {
    loadCards()
  }
})
</script>

<style scoped>
.admin-page {
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
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.logout-btn {
  padding: 6px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-medium);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  -webkit-tap-highlight-color: transparent;
  font-family: var(--font-body);
}

.logout-btn:active {
  color: var(--accent-danger);
  border-color: var(--accent-danger);
}

.error-msg {
  text-align: center;
  font-size: 13px;
  color: var(--accent-danger);
  margin: 0;
}
</style>
