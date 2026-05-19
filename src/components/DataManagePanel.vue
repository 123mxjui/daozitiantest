<template>
  <div class="manage-overlay" @click.self="$emit('close')">
    <div class="manage-panel">
      <div class="manage-header">
        <h2 class="manage-title">数据管理</h2>
        <button class="manage-close" @click="$emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="manage-body">
        <!-- Error -->
        <p class="manage-error" v-if="error">{{ error }}</p>

        <!-- Backup section -->
        <div class="manage-section">
          <h3 class="section-title">备份与恢复</h3>
          <p class="section-desc">数据将使用主密钥加密后导出，导入时需当前主密码解密</p>
          <div class="section-actions">
            <button class="manage-btn primary" :disabled="exporting" @click="handleExport">
              <svg v-if="exporting" class="btn-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {{ exporting ? '导出中...' : '导出加密备份' }}
            </button>
            <button class="manage-btn" :disabled="importing" @click="triggerImport">
              <svg v-if="importing" class="btn-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {{ importing ? '导入中...' : '导入恢复' }}
            </button>
          </div>
          <input ref="fileInputRef" type="file" accept=".json" hidden @change="handleFileSelect" />
        </div>

        <!-- Danger zone -->
        <div class="manage-section danger-zone">
          <h3 class="section-title">危险操作</h3>
          <p class="section-desc">以下操作不可撤销</p>
          <button class="manage-btn danger" @click="showResetConfirm = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            重置所有数据
          </button>
        </div>
      </div>
    </div>

    <!-- Reset confirm -->
    <ConfirmDialog
      v-if="showResetConfirm"
      title="重置所有数据"
      message="确定要重置所有数据吗？所有网站入口、账号密码和同步配置将被永久删除，此操作不可撤销。"
      confirm-text="确认重置"
      @confirm="handleReset"
      @cancel="showResetConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useDataStore } from '../stores/dataStore'
import { encrypt, decrypt } from '../composables/useCrypto'
import { clearAll } from '../composables/useStorage'
import { clearSyncConfig } from '../composables/useSync'
import { useToast } from '../composables/useToast'
import ConfirmDialog from './ConfirmDialog.vue'

const emit = defineEmits(['close'])

const auth = useAuthStore()
const data = useDataStore()
const router = useRouter()
const { show: showToast } = useToast()

const error = ref('')
const exporting = ref(false)
const importing = ref(false)
const showResetConfirm = ref(false)
const fileInputRef = ref(null)

function triggerImport() {
  fileInputRef.value?.click()
}

async function handleExport() {
  error.value = ''
  exporting.value = true
  try {
    const key = auth.getEncryptionKey()
    const jsonStr = JSON.stringify(data.getExportData())
    const { encrypted, iv } = await encrypt(jsonStr, key)

    const blob = new Blob(
      [JSON.stringify({ type: 'navvault-backup', version: 1, encrypted, iv }, null, 2)],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `navvault-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast('备份已导出', 'success')
  } catch (e) {
    error.value = e.message || '导出失败'
  } finally {
    exporting.value = false
  }
}

async function handleFileSelect(e) {
  const file = e.target?.files?.[0]
  if (!file) return
  error.value = ''
  importing.value = true

  try {
    const text = await file.text()
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error('无效的备份文件')
    }

    if (parsed.type !== 'navvault-backup' || !parsed.encrypted || !parsed.iv) {
      throw new Error('无效的备份文件格式')
    }

    const key = auth.getEncryptionKey()
    let decrypted
    try {
      decrypted = await decrypt(parsed.encrypted, parsed.iv, key)
    } catch {
      throw new Error('解密失败，请确认这是使用当前主密码导出的备份文件')
    }

    let importData
    try {
      importData = JSON.parse(decrypted)
    } catch {
      throw new Error('备份数据格式异常')
    }

    if (!importData.groups || !importData.sites) {
      throw new Error('备份数据格式异常')
    }

    data.importVaultData(importData)
    showToast('数据已恢复', 'success')
    emit('close')
  } catch (e) {
    error.value = e.message
  } finally {
    importing.value = false
    e.target.value = ''
  }
}

function handleReset() {
  showResetConfirm.value = false
  auth.reset()
  clearAll()
  clearSyncConfig()
  showToast('已重置所有数据', 'success')
  router.push('/lock')
}
</script>

<style scoped>
.manage-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(2px);
}

.manage-panel {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 420px;
  max-width: 94vw;
  box-shadow: var(--shadow-lg);
}

.manage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.manage-title {
  font-size: 17px;
  font-weight: 600;
}

.manage-close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--text-muted);
  transition: background 0.2s;
}

.manage-close:hover {
  background: var(--bg-hover);
}

.manage-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.manage-error {
  font-size: 13px;
  color: var(--danger);
  padding: 8px 12px;
  background: #fff0f0;
  border-radius: 6px;
}

.manage-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.section-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}

.section-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.manage-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
  border: 1px solid var(--border);
  color: var(--text-primary);
  background: var(--bg);
}

.manage-btn:hover:not(:disabled) {
  background: var(--bg-hover);
}

.manage-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.manage-btn.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.manage-btn.primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.manage-btn.danger {
  color: var(--danger);
  border-color: #ffd0cc;
}

.manage-btn.danger:hover {
  background: #fff0f0;
}

.btn-spinner {
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
