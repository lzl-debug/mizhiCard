<template>
  <div class="admin-app">
    <!-- Not Logged In -->
    <div v-if="!loggedIn" class="login-page">
      <div class="login-card">
        <div class="login-icon">🔐</div>
        <h1 class="login-title">密之语 · 管理后台</h1>
        <p class="login-desc">请输入管理密钥</p>
        <div class="login-form">
          <input
            v-model="keyInput"
            type="password"
            placeholder="管理密钥..."
            class="login-input"
            :class="{ error: loginError }"
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
          <p v-if="loginError" class="error-text">{{ loginError }}</p>
          <button class="login-btn" :disabled="loading || !keyInput.trim()" @click="handleLogin">
            <span v-if="loading" class="spinner" />
            <span v-else>验证</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Logged In -->
    <div v-else class="main-page">
      <header class="header">
        <h1 class="header-title">密之语 · 管理后台</h1>
        <button class="logout-btn" @click="logout">退出</button>
      </header>

      <div class="content">
        <!-- Upload Section -->
        <div class="section">
          <h2 class="section-title">上传图片</h2>
          <div
            class="drop-zone"
            :class="{ 'is-dragover': isDragover }"
            @dragover.prevent="isDragover = true"
            @dragleave.prevent="isDragover = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              class="file-input"
              @change="handleFileSelect"
            />
            <template v-if="selectedFiles.length === 0">
              <div class="drop-icon">📁</div>
              <p class="drop-text">拖拽图片到此处或点击上传</p>
              <p class="drop-hint">PNG / JPEG / WebP，支持批量上传</p>
            </template>
            <template v-else>
              <div class="preview-grid">
                <div v-for="(file, i) in selectedFiles" :key="i" class="preview-item">
                  <img :src="previews[i]" class="preview-img" />
                  <div class="preview-overlay">
                    <button class="preview-remove" @click.stop="removeFile(i)">✕</button>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div v-if="errors.length > 0" class="error-list">
            <p v-for="(e, i) in errors" :key="i" class="error-text">{{ e }}</p>
          </div>

          <button
            class="upload-btn"
            :disabled="selectedFiles.length === 0 || uploading"
            @click="handleUpload"
          >
            <span v-if="uploading" class="spinner" />
            <span v-else>上传 {{ selectedFiles.length }} 张图片</span>
          </button>
          <p v-if="uploadSuccess" class="success-text">上传成功！</p>
        </div>

        <!-- Card List -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">已上传卡牌（{{ cards.length }}）</h2>
            <div v-if="cards.length > 0" class="batch-actions">
              <button v-if="!selectMode" class="batch-btn" @click="enterSelectMode">批量选择</button>
              <template v-else>
                <button class="batch-btn" @click="selectAll">{{ selectedIds.size === cards.length ? '取消全选' : '全选' }}</button>
                <button class="batch-btn danger" :disabled="selectedIds.size === 0 || batchDeleting" @click="handleBatchDelete">
                  <span v-if="batchDeleting" class="spinner-sm" />
                  <span v-else>删除 ({{ selectedIds.size }})</span>
                </button>
                <button class="batch-btn" @click="exitSelectMode">取消</button>
              </template>
            </div>
          </div>
          <div v-if="cards.length === 0" class="empty-list">暂无卡牌</div>
          <div v-else class="card-grid">
            <div v-for="card in cards" :key="card.id" class="card-item" :class="{ selected: selectedIds.has(card.id) }" @click="selectMode && toggleSelect(card.id)">
              <div v-if="selectMode" class="card-checkbox" :class="{ checked: selectedIds.has(card.id) }">
                <span v-if="selectedIds.has(card.id)">✓</span>
              </div>
              <div class="card-img">
                <img :src="card.imageUrl" :alt="card.name" />
              </div>
              <span class="card-name">{{ card.name }}</span>
              <button v-if="!selectMode" class="card-del" :disabled="deletingId === card.id" @click="handleDelete(card.id)">
                <span v-if="deletingId === card.id" class="spinner-sm" />
                <span v-else>✕</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <p v-if="globalError" class="global-error">{{ globalError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { post, authGet, authDel, authPost, uploadForm } from './utils/request'
import { safeGetItem, safeSetItem, safeRemoveItem } from './utils/storage'

// Auth
const ADMIN_KEY_STORAGE = 'mizhi-card-admin-key'
const keyInput = ref('')
const loggedIn = ref(false)
const adminKey = ref('')
const loginError = ref('')
const loading = ref(false)

// Upload
const fileInput = ref<HTMLInputElement | null>(null)
const isDragover = ref(false)
const selectedFiles = ref<File[]>([])
const previews = ref<string[]>([])
const errors = ref<string[]>([])
const uploading = ref(false)
const uploadSuccess = ref(false)

// Card list
interface Card {
  id: string
  name: string
  imageUrl: string
}
const cards = ref<Card[]>([])
const deletingId = ref<string | null>(null)
const globalError = ref('')

// Batch delete
const selectMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const batchDeleting = ref(false)

// Auth
async function handleLogin() {
  if (!keyInput.value.trim()) return
  loading.value = true
  loginError.value = ''
  const res = await post<{ valid: boolean }>('/admin/auth', { key: keyInput.value.trim() })
  if (res.success) {
    adminKey.value = keyInput.value.trim()
    loggedIn.value = true
    safeSetItem(ADMIN_KEY_STORAGE, adminKey.value)
    loadCards()
  } else {
    loginError.value = '密钥错误'
  }
  loading.value = false
}

function logout() {
  adminKey.value = ''
  loggedIn.value = false
  cards.value = []
  safeRemoveItem(ADMIN_KEY_STORAGE)
}

// Upload
function triggerFileInput() { fileInput.value?.click() }

function addFiles(files: FileList | File[]) {
  errors.value = []
  uploadSuccess.value = false
  for (const file of files) {
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
      errors.value.push(`"${file.name}" 格式不支持`)
      continue
    }
    const url = URL.createObjectURL(file)
    selectedFiles.value.push(file)
    previews.value.push(url)
    new Image().src = url
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) addFiles(input.files)
}

function handleDrop(e: DragEvent) {
  isDragover.value = false
  if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
}

function removeFile(i: number) {
  selectedFiles.value.splice(i, 1)
  URL.revokeObjectURL(previews.value[i])
  previews.value.splice(i, 1)
}

async function handleUpload() {
  if (selectedFiles.value.length === 0 || uploading.value) return
  uploading.value = true
  uploadSuccess.value = false
  errors.value = []

  const formData = new FormData()
  for (const file of selectedFiles.value) {
    formData.append('image', file)
  }

  const res = await uploadForm<Card | Card[]>('/admin/cards', formData, adminKey.value)
  if (res.success && res.data) {
    uploadSuccess.value = true
    const newCards = Array.isArray(res.data) ? res.data : [res.data]
    cards.value = [...newCards, ...cards.value]

    // Clean up
    for (const url of previews.value) URL.revokeObjectURL(url)
    selectedFiles.value = []
    previews.value = []
    setTimeout(() => { uploadSuccess.value = false }, 3000)
  } else {
    errors.value.push(res.error || '上传失败')
  }
  uploading.value = false
}

// Cards
async function loadCards() {
  globalError.value = ''
  const res = await authGet<Card[]>('/admin/cards', adminKey.value)
  if (res.success && res.data) {
    cards.value = res.data
  } else {
    globalError.value = '加载卡牌列表失败'
  }
}

async function handleDelete(id: string) {
  deletingId.value = id
  const res = await authDel(`/admin/cards/${id}`, adminKey.value)
  if (res.success) {
    cards.value = cards.value.filter((c) => c.id !== id)
  } else {
    globalError.value = '删除失败'
  }
  deletingId.value = null
}

function enterSelectMode() { selectMode.value = true; selectedIds.value = new Set() }
function exitSelectMode() { selectMode.value = false; selectedIds.value = new Set() }

function toggleSelect(id: string) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) s.delete(id); else s.add(id)
  selectedIds.value = s
}

function selectAll() {
  if (selectedIds.value.size === cards.value.length) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(cards.value.map(c => c.id))
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.size === 0) return
  if (!confirm(`确定删除选中的 ${selectedIds.value.size} 张卡牌？`)) return
  batchDeleting.value = true
  const res = await authPost<{ deleted: string[]; failed: string[] }>(
    '/admin/cards/batch-delete', adminKey.value, { ids: [...selectedIds.value] }
  )
  if (res.success && res.data) {
    cards.value = cards.value.filter(c => !res.data!.deleted.includes(c.id))
    if (res.data.failed.length > 0) {
      globalError.value = `${res.data.failed.length} 张卡牌删除失败`
    }
  } else {
    globalError.value = res.error || '批量删除失败'
  }
  batchDeleting.value = false
  exitSelectMode()
}

onMounted(() => {
  const stored = safeGetItem<string | null>(ADMIN_KEY_STORAGE, null)
  if (stored) { adminKey.value = stored; loggedIn.value = true; loadCards() }
})
</script>

<style lang="scss">
$bg: #f5f5f7;
$bg-card: #ffffff;
$text: #1a1a2e;
$sub: #6b6b80;
$muted: #999aaf;
$accent: #6366F1;
$danger: #EF4444;
$success: #22C55E;

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

.admin-app {
  width: 100%; height: 100vh; overflow: hidden; background: $bg; font-family: inherit;
}

// Login Page
.login-page {
  display: flex; align-items: center; justify-content: center; height: 100%; padding: 20px;
}
.login-card {
  width: 100%; max-width: 360px; padding: 48px 32px; text-align: center;
  background: $bg-card; border: 1px solid rgba(0, 0, 0, 0.06); border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.login-icon { font-size: 48px; }
.login-title { font-family: 'Noto Serif SC', serif; font-size: 22px; font-weight: 900; color: $text; margin: 0; }
.login-desc { font-size: 13px; color: $muted; margin: 0 0 8px; }
.login-form { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.login-input {
  width: 100%; padding: 12px 16px; border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12); background: $bg;
  color: $text; font-size: 14px; outline: none; transition: border-color 0.3s; font-family: inherit;
  &:focus { border-color: $accent; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  &.error { border-color: $danger; }
  &::placeholder { color: $muted; }
}
.login-btn {
  width: 100%; padding: 12px; border: none; border-radius: 12px;
  background: linear-gradient(135deg, $accent, #8B5CF6); color: white;
  font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s;
  font-family: inherit;
  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// Main Page
.main-page { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid rgba(0, 0, 0, 0.06); flex-shrink: 0;
  background: $bg-card;
}
.header-title { font-family: 'Noto Serif SC', serif; font-size: 18px; font-weight: 900; margin: 0; color: $text; }
.logout-btn {
  padding: 6px 16px; border-radius: 999px; border: 1px solid rgba(0, 0, 0, 0.12);
  background: transparent; color: $sub; font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.3s;
  &:hover { color: $danger; border-color: $danger; }
}
.content {
  flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 32px;
}
.section { display: flex; flex-direction: column; gap: 12px; }
.section-title { font-family: 'Noto Serif SC', serif; font-size: 16px; font-weight: 700; margin: 0; color: $sub; }

// Drop Zone
.drop-zone {
  border: 2px dashed rgba(0, 0, 0, 0.12); border-radius: 12px;
  padding: 20px; cursor: pointer; transition: all 0.3s; background: $bg-card;
  &.is-dragover { border-color: $accent; background: rgba(99,102,241,0.04); }
}
.file-input { display: none; }
.drop-icon { font-size: 40px; text-align: center; opacity: 0.4; }
.drop-text { font-size: 14px; color: $sub; margin: 8px 0 0; text-align: center; }
.drop-hint { font-size: 11px; color: $muted; margin: 4px 0 0; text-align: center; }

.preview-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;
}
.preview-item {
  position: relative; aspect-ratio: 4 / 3; border-radius: 8px; overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
.preview-img { width: 100%; height: 100%; object-fit: cover; }
.preview-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s;
  .preview-item:hover & { opacity: 1; }
}
.preview-remove {
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: $danger; color: white; font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.preview-dims {
  position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white;
  font-size: 10px; padding: 1px 6px; border-radius: 999px;
}

.upload-btn {
  padding: 12px 24px; border: none; border-radius: 12px;
  background: linear-gradient(135deg, $accent, #8B5CF6); color: white;
  font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.3s;
  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

// Card Grid
.empty-list { text-align: center; padding: 24px; color: $muted; font-size: 13px; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.card-item {
  display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 10px;
  background: $bg-card; border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
  &.selected { border-color: $accent; background: rgba(99,102,241,0.04); }
}
.card-checkbox {
  width: 20px; height: 20px; border-radius: 4px; border: 2px solid rgba(0,0,0,0.2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  font-size: 12px; color: white; transition: all 0.2s;
  &.checked { background: $accent; border-color: $accent; }
}
.section-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.batch-actions { display: flex; gap: 8px; align-items: center; }
.batch-btn {
  padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.12);
  background: $bg-card; color: $sub; font-size: 12px; cursor: pointer; font-family: inherit;
  transition: all 0.2s;
  &:hover { border-color: $accent; color: $accent; }
  &.danger { color: $danger; border-color: rgba($danger, 0.3); &:hover { border-color: $danger; } }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}
.card-img {
  width: 40px; height: 53px; border-radius: 4px; overflow: hidden; flex-shrink: 0;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.card-name {
  flex: 1; min-width: 0; font-size: 13px; font-weight: 700; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap; font-family: 'Noto Serif SC', serif;
  color: $text;
}
.card-del {
  width: 26px; height: 26px; border-radius: 50%; border: none;
  background: rgba($danger, 0.08); color: $danger; font-size: 11px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.3s; flex-shrink: 0;
  &:active:not(:disabled) { background: $danger; color: white; }
  &:disabled { opacity: 0.5; }
}

// Shared
.spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin: 0 auto; }
.spinner-sm { width: 12px; height: 12px; border: 2px solid rgba(239,68,68,0.3); border-top-color: $danger; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-list { display: flex; flex-direction: column; gap: 4px; }
.error-text { font-size: 12px; color: $danger; margin: 0; }
.success-text { font-size: 13px; color: $success; font-weight: 600; margin: 0; }
.global-error { text-align: center; font-size: 13px; color: $danger; padding: 12px 24px 24px; margin: 0; flex-shrink: 0; }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }
</style>
