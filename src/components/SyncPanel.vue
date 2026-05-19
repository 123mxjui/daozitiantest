<template>
  <div class="sync-overlay" @click.self="$emit('close')">
    <div class="sync-panel">
      <div class="sync-header">
        <h2 class="sync-title">数据同步</h2>
        <button class="sync-close" @click="$emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="sync-body">
        <div class="sync-field">
          <label class="sync-label">GitHub Token</label>
          <input class="sync-input" v-model="token" type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" />
        </div>
        <div class="sync-field">
          <label class="sync-label">Gist ID</label>
          <input class="sync-input" v-model="gistId" type="text" placeholder="输入 Gist ID 或留空新建" />
        </div>

        <!-- Hint -->
        <p class="sync-field-hint">
          需要 GitHub Token（勾选 <strong>gist</strong> 权限）
          到 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">github.com/settings/tokens</a> 生成
        </p>

        <!-- Error -->
        <p class="sync-error" v-if="error">{{ error }}</p>
      </div>

      <div class="sync-actions">
        <button class="sync-btn push-btn" :disabled="syncing || !token.trim()" @click="handlePush">
          <span v-if="syncing && action === 'push'" class="btn-spinner"></span>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
          </svg>
          推送到云端
        </button>
        <button class="sync-btn pull-btn" :disabled="syncing || !token.trim() || !gistId.trim()" @click="handlePull">
          <span v-if="syncing && action === 'pull'" class="btn-spinner"></span>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
          </svg>
          从云端拉取
        </button>
      </div>

      <p class="sync-hint">数据在传输和存储过程中均经过 AES-256 加密</p>
    </div>

    <!-- Push confirm -->
    <ConfirmDialog
      v-if="showPushConfirm"
      title="确认推送"
      message="将覆盖云端数据，确定继续？"
      confirm-text="继续推送"
      @confirm="showPushConfirm = false; doPush()"
      @cancel="showPushConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { loadSyncConfig, saveSyncConfig, createGist, updateGist, readGist } from '../composables/useSync'
import { useDataStore } from '../stores/dataStore'
import { useToast } from '../composables/useToast'
import ConfirmDialog from './ConfirmDialog.vue'

const emit = defineEmits(['close'])

const data = useDataStore()
const { show: showToast } = useToast()

const token = ref('')
const gistId = ref('')
const error = ref('')
const syncing = ref(false)
const action = ref('')
const showPushConfirm = ref(false)

onMounted(() => {
  const cfg = loadSyncConfig()
  token.value = cfg.token || ''
  gistId.value = cfg.gistId || ''
})

function handlePush() {
  if (gistId.value.trim()) {
    showPushConfirm.value = true
    return
  }
  doPush()
}

async function doPush() {
  error.value = ''
  syncing.value = true
  action.value = 'push'

  try {
    const exportData = data.getExportData()
    const content = JSON.stringify(exportData, null, 2)
    const currentToken = token.value.trim()
    const currentGistId = gistId.value.trim()

    let newGistId = currentGistId
    if (newGistId) {
      await updateGist(currentToken, newGistId, content)
    } else {
      newGistId = await createGist(currentToken, content)
    }

    saveSyncConfig({ token: currentToken, gistId: newGistId, syncedAt: new Date().toISOString() })
    gistId.value = newGistId
    showToast('已推送到云端', 'success')
    emit('close')
  } catch (e) {
    error.value = e.message
  } finally {
    syncing.value = false
    action.value = ''
  }
}

async function handlePull() {
  error.value = ''
  syncing.value = true
  action.value = 'pull'

  try {
    const currentToken = token.value.trim()
    const currentGistId = gistId.value.trim()
    const remoteData = await readGist(currentToken, currentGistId)

    if (!remoteData.groups || !remoteData.sites) {
      throw new Error('同步数据格式异常')
    }

    data.importVaultData(remoteData)
    saveSyncConfig({ token: currentToken, gistId: currentGistId, syncedAt: new Date().toISOString() })
    showToast('已从云端拉取', 'success')
    emit('close')
  } catch (e) {
    error.value = e.message
  } finally {
    syncing.value = false
    action.value = ''
  }
}
</script>

<style scoped>
.sync-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(2px);
}

.sync-panel {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 400px;
  box-shadow: var(--shadow-lg);
}

.sync-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.sync-title {
  font-size: 17px;
  font-weight: 600;
}

.sync-close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--text-muted);
  transition: background 0.2s;
}

.sync-close:hover {
  background: var(--bg-hover);
}

.sync-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sync-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sync-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.sync-input {
  padding: 10px 12px;
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.sync-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
  background: var(--bg-card);
}

.sync-input::placeholder {
  color: var(--text-muted);
}

.sync-field-hint {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
}

.sync-field-hint a {
  color: var(--accent);
}

.sync-error {
  font-size: 13px;
  color: var(--danger);
  padding: 8px 12px;
  background: #fff0f0;
  border-radius: 6px;
}

.sync-actions {
  display: flex;
  gap: 12px;
  padding: 0 24px 20px;
}

.sync-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
}

.sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.push-btn {
  background: var(--accent);
  color: #fff;
}

.push-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.pull-btn {
  background: var(--bg);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.pull-btn:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.sync-hint {
  padding: 0 24px 16px;
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}
</style>
