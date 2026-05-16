<template>
  <div class="admin-login">
    <GlassCard depth="2">
      <div class="login-content">
        <div class="login-icon">🔐</div>
        <h2 class="login-title">管理员验证</h2>
        <p class="login-desc">请输入管理密钥以访问后台</p>
        <div class="login-form">
          <input
            v-model="key"
            type="password"
            placeholder="输入管理密钥..."
            class="login-input"
            :class="{ error: errorMsg }"
            @keyup.enter="handleLogin"
            :disabled="loading"
          />
          <p v-if="errorMsg" class="login-error">{{ errorMsg }}</p>
          <button
            class="login-btn"
            :disabled="loading || !key.trim()"
            @click="handleLogin"
          >
            <span v-if="loading" class="btn-loading" />
            <span v-else>验证</span>
          </button>
        </div>
      </div>
    </GlassCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GlassCard from '../shared/GlassCard.vue'

const emit = defineEmits<{
  login: [key: string]
}>()

const key = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (!key.value.trim()) return
  loading.value = true
  errorMsg.value = ''
  emit('login', key.value.trim())
}
</script>

<style scoped>
.admin-login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  padding: 20px;
}

.login-content {
  padding: 40px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 320px;
}

.login-icon {
  font-size: 48px;
  margin-bottom: 4px;
}

.login-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.login-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0 0 8px;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-medium);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s ease;
  font-family: var(--font-body);
}

.login-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.login-input.error {
  border-color: var(--accent-danger);
}

.login-input::placeholder {
  color: var(--text-muted);
}

.login-error {
  font-size: 12px;
  color: var(--accent-danger);
  margin: 0;
}

.login-btn {
  width: 100%;
  padding: 12px;
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

.login-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-loading {
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
</style>
