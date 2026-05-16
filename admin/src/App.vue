<template>
  <div class="admin-app">
    <canvas ref="bgCanvas" class="bg-canvas" />

    <!-- Not Logged In -->
    <div v-if="!loggedIn" class="login-page">
      <div class="login-card">
        <div class="login-icon">🔐</div>
        <h1 class="login-title">秘之卡 · 管理后台</h1>
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
        <h1 class="header-title">秘之卡 · 管理后台</h1>
        <button class="logout-btn" @click="logout">退出</button>
      </header>

      <div class="content">
        <!-- Upload Section -->
        <div class="section">
          <h2 class="section-title">上传卡牌</h2>
          <div
            class="drop-zone"
            :class="{ 'is-dragover': isDragover, 'has-error': ratioError, 'has-file': previewUrl }"
            @dragover.prevent="isDragover = true"
            @dragleave.prevent="isDragover = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="file-input" @change="handleFileSelect" />
            <template v-if="!previewUrl">
              <div class="drop-icon">📁</div>
              <p class="drop-text">拖拽图片到此处或点击上传</p>
              <p class="drop-hint">PNG / JPEG / WebP，比例 4:3</p>
            </template>
            <template v-else>
              <img :src="previewUrl" class="drop-preview" />
              <div class="preview-overlay"><span>点击更换</span></div>
              <div class="preview-dims">{{ imgWidth }} × {{ imgHeight }}（{{ ratio.toFixed(2) }}）</div>
            </template>
          </div>
          <p v-if="ratioError" class="error-text">{{ ratioError }}</p>

          <div class="upload-form">
            <div class="form-row">
              <div class="form-field">
                <label class="field-label">卡牌名称</label>
                <input v-model="cardName" type="text" class="field-input" placeholder="输入名称..." maxlength="50" />
              </div>
              <div class="form-field">
                <label class="field-label">稀有度</label>
                <div class="rarity-select">
                  <button
                    v-for="r in rarities"
                    :key="r.key"
                    class="rarity-btn"
                    :class="{ selected: selectedRarity === r.key }"
                    :style="{ '--r-color': r.color, '--r-glow': r.glow }"
                    @click="selectedRarity = r.key"
                  >
                    {{ r.key }} · {{ r.name }}
                  </button>
                </div>
              </div>
            </div>
            <button class="upload-btn" :disabled="!canUpload || uploading" @click="handleUpload">
              <span v-if="uploading" class="spinner" />
              <span v-else>上传卡牌</span>
            </button>
          </div>
          <p v-if="uploadError" class="error-text">{{ uploadError }}</p>
          <p v-if="uploadSuccess" class="success-text">✅ 上传成功！</p>
        </div>

        <!-- Card List -->
        <div class="section">
          <h2 class="section-title">已上传卡牌（{{ cards.length }}）</h2>
          <div v-if="cards.length === 0" class="empty-list">暂无卡牌</div>
          <div v-else class="card-grid">
            <div
              v-for="card in cards"
              :key="card.id"
              class="card-item"
              :class="`rarity-${card.rarity.toLowerCase()}`"
            >
              <div class="card-img">
                <img :src="card.imageUrl" :alt="card.name" />
              </div>
              <div class="card-info">
                <span class="card-name">{{ card.name }}</span>
                <span class="card-rarity" :style="{ color: rarityColor(card.rarity) }">{{ card.rarity }}</span>
              </div>
              <button class="card-del" :disabled="deletingId === card.id" @click="handleDelete(card.id)">
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { post, authGet, authDel, uploadForm } from './utils/request'
import { safeGetItem, safeSetItem, safeRemoveItem } from './utils/storage'
import type { Rarity } from './utils/rarity'
import { RARITY_CONFIG, RARITY_ORDER } from './utils/rarity'

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
const previewUrl = ref('')
const imgWidth = ref(0)
const imgHeight = ref(0)
const ratioError = ref('')
const cardName = ref('')
const selectedRarity = ref<Rarity>('R')
const uploading = ref(false)
const uploadError = ref('')
const uploadSuccess = ref(false)
const selectedFile = ref<File | null>(null)

// Card list
interface Card {
  id: string
  name: string
  rarity: Rarity
  imageUrl: string
}
const cards = ref<Card[]>([])
const deletingId = ref<string | null>(null)
const globalError = ref('')

// Rarity
const rarities = RARITY_ORDER.map((k) => ({
  key: k,
  name: RARITY_CONFIG[k].name,
  color: RARITY_CONFIG[k].color,
  glow: RARITY_CONFIG[k].glowColor,
}))

function rarityColor(r: Rarity) { return RARITY_CONFIG[r].color }

const ratio = computed(() => imgWidth.value && imgHeight.value ? imgWidth.value / imgHeight.value : 0)

const canUpload = computed(
  () => selectedFile.value && cardName.value.trim().length > 0 && !ratioError.value && !uploading.value
)

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

function validateRatio(w: number, h: number) { return Math.abs(w / h - 4 / 3) < 0.03 }

function processFile(file: File) {
  ratioError.value = ''
  uploadError.value = ''
  uploadSuccess.value = false
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    imgWidth.value = img.width
    imgHeight.value = img.height
    if (!validateRatio(img.width, img.height)) {
      ratioError.value = `图片比例必须为 4:3（当前 ${img.width}×${img.height}，比例 ${(img.width / img.height).toFixed(2)}）`
      previewUrl.value = url
    } else {
      previewUrl.value = url
      selectedFile.value = file
    }
  }
  img.src = url
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) processFile(input.files[0])
}

function handleDrop(e: DragEvent) {
  isDragover.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

async function handleUpload() {
  if (!canUpload.value || !selectedFile.value) return
  uploading.value = true
  uploadError.value = ''
  uploadSuccess.value = false

  const formData = new FormData()
  formData.append('image', selectedFile.value)
  formData.append('name', cardName.value.trim())
  formData.append('rarity', selectedRarity.value)

  const res = await uploadForm<Card>('/admin/cards', formData, adminKey.value)
  if (res.success && res.data) {
    uploadSuccess.value = true
    previewUrl.value = ''
    cardName.value = ''
    selectedFile.value = null
    selectedRarity.value = 'R'
    cards.value.unshift(res.data)
    setTimeout(() => { uploadSuccess.value = false }, 3000)
  } else {
    uploadError.value = res.error || '上传失败'
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

// Background canvas
const bgCanvas = ref<HTMLCanvasElement | null>(null)
let animId = 0
let particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = []
let W = 0, H = 0

function initBg() {
  const c = bgCanvas.value
  if (!c) return
  W = window.innerWidth; H = window.innerHeight
  c.width = W * devicePixelRatio; c.height = H * devicePixelRatio
  c.style.width = W + 'px'; c.style.height = H + 'px'
  particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.3, vy: -(Math.random() * 0.3 + 0.08),
    r: Math.random() * 2 + 0.5, a: Math.random() * 0.3 + 0.08,
  }))
  animate()
}

function animate() {
  const c = bgCanvas.value; if (!c) return
  const ctx = c.getContext('2d'); if (!ctx) return
  ctx.clearRect(0, 0, c.width, c.height)
  ctx.scale(devicePixelRatio, devicePixelRatio)
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy
    if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10
    if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${p.a})`; ctx.fill()
  }
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y
      if (Math.sqrt(dx * dx + dy * dy) < 100) {
        ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y)
        ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 0.5; ctx.stroke()
      }
    }
  }
  animId = requestAnimationFrame(animate)
}

onMounted(() => {
  const stored = safeGetItem<string | null>(ADMIN_KEY_STORAGE, null)
  if (stored) { adminKey.value = stored; loggedIn.value = true; loadCards() }
  nextTick(initBg)
  window.addEventListener('resize', initBg)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', initBg)
})
</script>

<style lang="scss">
$bg: #0a0a0f;
$text: #e8e8ed;
$sub: #8888a0;
$muted: #555570;
$accent: #6366F1;
$danger: #EF4444;
$success: #22C55E;

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

.admin-app {
  width: 100%; height: 100vh; overflow: hidden; background: $bg; font-family: inherit;
}

.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }

// Login Page
.login-page {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center; height: 100%; padding: 20px;
}
.login-card {
  width: 100%; max-width: 360px; padding: 48px 32px; text-align: center;
  background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 16px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.login-icon { font-size: 48px; }
.login-title { font-family: 'Noto Serif SC', serif; font-size: 22px; font-weight: 900; color: $text; margin: 0; }
.login-desc { font-size: 13px; color: $muted; margin: 0 0 8px; }
.login-form { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.login-input {
  width: 100%; padding: 12px 16px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
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
.main-page {
  position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; overflow: hidden;
}
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
}
.header-title { font-family: 'Noto Serif SC', serif; font-size: 18px; font-weight: 900; margin: 0; color: $text; }
.logout-btn {
  padding: 6px 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.1);
  background: transparent; color: $muted; font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.3s;
  &:hover { color: $danger; border-color: $danger; }
}
.content {
  flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 32px;
}
.section { display: flex; flex-direction: column; gap: 12px; }
.section-title { font-family: 'Noto Serif SC', serif; font-size: 16px; font-weight: 700; margin: 0; color: $sub; }

// Drop Zone
.drop-zone {
  position: relative; aspect-ratio: 4 / 3; max-height: 300px;
  border: 2px dashed rgba(255,255,255,0.15); border-radius: 12px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; transition: all 0.3s; overflow: hidden; background: rgba(255,255,255,0.01);
  &.is-dragover { border-color: $accent; background: rgba(99,102,241,0.05); }
  &.has-error { border-color: $danger; }
  &.has-file { border-style: solid; border-color: rgba(255,255,255,0.1); }
}
.file-input { display: none; }
.drop-icon { font-size: 36px; opacity: 0.5; }
.drop-text { font-size: 14px; color: $sub; margin: 0; }
.drop-hint { font-size: 11px; color: $muted; margin: 0; }
.drop-preview { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: rgba(0,0,0,0.3); }
.preview-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s;
  color: white; font-size: 13px;
  .drop-zone:hover & { opacity: 1; }
}
.preview-dims {
  position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white;
  font-size: 11px; padding: 2px 8px; border-radius: 999px; z-index: 2;
}

// Upload Form
.upload-form { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 11px; font-weight: 600; color: $sub; text-transform: uppercase; letter-spacing: 0.05em; }
.field-input {
  padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04); color: $text; font-size: 14px; outline: none;
  font-family: inherit; transition: border-color 0.3s;
  &:focus { border-color: $accent; }
}
.rarity-select { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.rarity-btn {
  padding: 6px 8px; border-radius: 8px; border: 1.5px solid rgba(255,255,255,0.08);
  background: transparent; color: $sub; font-size: 11px; font-weight: 700; cursor: pointer;
  font-family: inherit; transition: all 0.3s;
  &.selected {
    background: rgba(var(--r-color, 99,102,241), 0.1);
    border-color: rgba(var(--r-color, 99,102,241), 0.5);
    color: var(--r-color);
    box-shadow: 0 0 12px rgba(var(--r-glow, 99,102,241), 0.15);
  }
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
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
.card-item {
  display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 10px;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
  transition: all 0.3s;
  &.rarity-ssr { border-color: rgba(255,215,0,0.4); }
  &.rarity-sr { border-color: rgba(168,85,247,0.3); }
  &.rarity-r { border-color: rgba(59,130,246,0.2); }
}
.card-img { width: 40px; height: 53px; border-radius: 4px; overflow: hidden; flex-shrink: 0; img { width: 100%; height: 100%; object-fit: cover; } }
.card-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.card-name { font-size: 13px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: 'Noto Serif SC', serif; }
.card-rarity { font-size: 10px; font-weight: 700; letter-spacing: 0.05em; }
.card-del {
  width: 26px; height: 26px; border-radius: 50%; border: none;
  background: rgba($danger, 0.1); color: $danger; font-size: 11px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.3s; flex-shrink: 0;
  &:active:not(:disabled) { background: $danger; color: white; }
  &:disabled { opacity: 0.5; }
}

// Shared
.spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin: 0 auto; }
.spinner-sm { width: 12px; height: 12px; border: 2px solid rgba(239,68,68,0.3); border-top-color: $danger; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-text { font-size: 12px; color: $danger; margin: 0; }
.success-text { font-size: 13px; color: $success; font-weight: 600; margin: 0; }
.global-error { text-align: center; font-size: 13px; color: $danger; padding: 12px 24px 24px; margin: 0; flex-shrink: 0; }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
</style>
