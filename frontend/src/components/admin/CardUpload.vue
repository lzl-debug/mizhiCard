<template>
  <GlassCard depth="2">
    <div class="card-upload">
      <h3 class="upload-title">上传卡牌</h3>

      <!-- Drop Zone -->
      <div
        class="drop-zone"
        :class="{
          'is-dragover': isDragover,
          'has-error': ratioError,
          'has-file': previewUrl,
        }"
        @dragover.prevent="isDragover = true"
        @dragleave.prevent="isDragover = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          class="file-input"
          @change="handleFileSelect"
        />
        <template v-if="!previewUrl">
          <div class="drop-icon">📁</div>
          <p class="drop-text">拖拽图片到此处或点击上传</p>
          <p class="drop-hint">支持 PNG / JPEG / WebP，比例 4:3</p>
        </template>
        <template v-else>
          <img :src="previewUrl" class="drop-preview" />
          <div class="preview-overlay">
            <span class="preview-change">点击更换图片</span>
          </div>
          <div class="preview-dims">{{ imgWidth }} × {{ imgHeight }}</div>
        </template>
      </div>

      <p v-if="ratioError" class="error-text">{{ ratioError }}</p>

      <!-- Form -->
      <div class="upload-form">
        <div class="form-field">
          <label class="field-label">卡牌名称</label>
          <input
            v-model="cardName"
            type="text"
            class="field-input"
            placeholder="输入卡牌名称..."
            maxlength="50"
          />
        </div>

        <div class="form-field">
          <label class="field-label">稀有度</label>
          <div class="rarity-selector">
            <button
              v-for="r in rarities"
              :key="r.key"
              class="rarity-option"
              :class="{ selected: selectedRarity === r.key }"
              :style="{ '--rarity-color': r.color, '--rarity-glow': r.glow }"
              @click="selectedRarity = r.key"
            >
              {{ r.key }} · {{ r.name }}
            </button>
          </div>
        </div>

        <button
          class="upload-btn"
          :disabled="!canUpload || uploading"
          @click="handleUpload"
        >
          <span v-if="uploading" class="upload-spinner" />
          <span v-else-if="uploadProgress > 0 && uploadProgress < 100">
            上传中 {{ uploadProgress }}%
          </span>
          <span v-else>上传卡牌</span>
        </button>
      </div>

      <p v-if="uploadError" class="error-text">{{ uploadError }}</p>
      <p v-if="uploadSuccess" class="success-text">上传成功！</p>
    </div>
  </GlassCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Rarity } from '../../utils/rarity'
import { RARITY_CONFIG, RARITY_ORDER } from '../../utils/rarity'
import GlassCard from '../shared/GlassCard.vue'

const props = defineProps<{
  onUpload: (file: File, name: string, rarity: Rarity) => Promise<boolean>
}>()

const emit = defineEmits<{
  uploaded: []
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragover = ref(false)
const previewUrl = ref('')
const imgWidth = ref(0)
const imgHeight = ref(0)
const ratioError = ref('')
const cardName = ref('')
const selectedRarity = ref<Rarity>('R')
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref('')
const uploadSuccess = ref(false)
const selectedFile = ref<File | null>(null)

const rarities = RARITY_ORDER.map((k) => ({
  key: k,
  name: RARITY_CONFIG[k].name,
  color: RARITY_CONFIG[k].color,
  glow: RARITY_CONFIG[k].glowColor,
}))

const canUpload = computed(
  () =>
    selectedFile.value &&
    cardName.value.trim().length > 0 &&
    !ratioError.value &&
    !uploading.value
)

function validateRatio(w: number, h: number): boolean {
  const ratio = w / h
  const target = 4 / 3
  return Math.abs(ratio - target) < 0.03
}

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

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    processFile(input.files[0])
  }
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

  try {
    const result = await props.onUpload(
      selectedFile.value,
      cardName.value.trim(),
      selectedRarity.value
    )
    if (result) {
      uploadSuccess.value = true
      // Reset form
      previewUrl.value = ''
      cardName.value = ''
      selectedFile.value = null
      selectedRarity.value = 'R'
      emit('uploaded')
    } else {
      uploadError.value = '上传失败，请检查管理密钥是否正确'
    }
  } catch (e) {
    uploadError.value = e instanceof Error ? e.message : '上传失败'
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.card-upload {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Drop Zone */
.drop-zone {
  position: relative;
  aspect-ratio: 4 / 3;
  border: 2px dashed var(--border-medium);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
}

.drop-zone.is-dragover {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.05);
}

.drop-zone.has-error {
  border-color: var(--accent-danger);
}

.drop-zone.has-file {
  border-style: solid;
  border-color: var(--border-medium);
}

.file-input {
  display: none;
}

.drop-icon {
  font-size: 36px;
  opacity: 0.6;
}

.drop-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.drop-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
}

.drop-preview {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.3);
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.drop-zone:hover .preview-overlay {
  opacity: 1;
}

.preview-change {
  color: white;
  font-size: 13px;
  font-weight: 500;
}

.preview-dims {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  z-index: 2;
}

/* Form */
.upload-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-input {
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-medium);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
  font-family: var(--font-body);
}

.field-input:focus {
  border-color: var(--accent-primary);
}

/* Rarity Selector */
.rarity-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.rarity-option {
  padding: 8px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border-medium);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s var(--ease-out);
  -webkit-tap-highlight-color: transparent;
  font-family: var(--font-body);
}

.rarity-option.selected {
  background: color-mix(in srgb, var(--rarity-color) 10%, transparent);
  border-color: color-mix(in srgb, var(--rarity-color) 50%, transparent);
  color: var(--rarity-color);
  box-shadow: 0 0 12px color-mix(in srgb, var(--rarity-glow) 20%, transparent);
}

/* Upload Button */
.upload-btn {
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s var(--ease-out);
  -webkit-tap-highlight-color: transparent;
  font-family: var(--font-body);
}

.upload-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.upload-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.upload-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-text {
  font-size: 12px;
  color: var(--accent-danger);
  margin: 0;
}

.success-text {
  font-size: 13px;
  color: var(--accent-success);
  margin: 0;
  font-weight: 600;
}
</style>
