<template>
  <div class="lock-page">
    <div class="lock-card">
      <div class="lock-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>

      <h1 class="lock-title">个人快捷入口</h1>
      <p class="lock-desc">{{ isFirstTime ? '首次使用，设置主密码' : '输入主密码解锁' }}</p>

      <!-- Error -->
      <p class="error-msg" v-if="error">{{ error }}</p>

      <!-- Password inputs -->
      <div class="password-input-wrap">
        <input
          v-model="password"
          type="password"
          class="password-input"
          :placeholder="isFirstTime ? '请设置主密码（至少8位，含字母+数字）' : '请输入主密码'"
          @keyup.enter="handleSubmit"
          :disabled="loading"
        />
        <input
          v-if="isFirstTime"
          v-model="confirmPassword"
          type="password"
          class="password-input"
          placeholder="再次输入确认"
          @keyup.enter="handleSubmit"
          :disabled="loading"
        />
      </div>

      <!-- Submit -->
      <button class="unlock-btn" @click="handleSubmit" :disabled="loading">
        <span v-if="loading" class="spinner"></span>
        <span v-else>{{ isFirstTime ? '设置并解锁' : '解锁' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const auth = useAuthStore()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

const isFirstTime = computed(() => !auth.isInitialized)

onMounted(() => {
  if (auth.isUnlocked) router.push('/')
})

function checkPasswordStrength(pw) {
  if (pw.length < 8) return '密码长度至少 8 位'
  if (!/[a-zA-Z]/.test(pw)) return '密码需包含字母'
  if (!/[0-9]/.test(pw)) return '密码需包含数字'
  return null
}

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (isFirstTime.value) {
      const strengthError = checkPasswordStrength(password.value)
      if (strengthError) {
        error.value = strengthError
        loading.value = false
        return
      }
      if (password.value !== confirmPassword.value) {
        error.value = '两次输入的密码不一致'
        loading.value = false
        return
      }
      await auth.setupMasterPassword(password.value)
    } else {
      const ok = await auth.unlock(password.value)
      if (!ok) {
        error.value = '密码错误，请重试'
        loading.value = false
        return
      }
    }
    router.push('/')
  } catch (e) {
    error.value = '操作失败，请重试'
    console.error(e)
  }
  loading.value = false
}
</script>

<style scoped>
.lock-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.lock-card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: 48px 40px 40px;
  width: 380px;
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.lock-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--accent-light);
  color: var(--accent);
  margin-bottom: 20px;
}

.lock-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: -0.3px;
}

.lock-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 20px;
}

.error-msg {
  color: var(--danger);
  font-size: 13px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fff0f0;
  border-radius: 6px;
}

.password-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.password-input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 15px;
  background: var(--bg);
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.password-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.15);
  background: var(--bg-card);
}

.password-input::placeholder {
  color: var(--text-muted);
}

.unlock-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.unlock-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.unlock-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
