<template>
  <div class="popover-overlay" @click.self="$emit('close')">
    <div class="popover">
      <div class="popover-header">
        <div class="popover-site">
          <img
            class="popover-favicon"
            :src="faviconUrl"
            alt=""
            @error="e => e.target.style.display='none'"
          />
          <span class="popover-site-name">{{ site?.title || '' }}</span>
        </div>
        <button class="popover-close" @click="$emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Loading -->
      <div class="loading-state" v-if="loading">
        <div class="spinner"></div>
        <span>解密中...</span>
      </div>

      <!-- Has credentials -->
      <div class="credential-rows" v-else-if="creds">
        <div class="credential-row">
          <span class="credential-label">账号</span>
          <div class="credential-value">
            <span>{{ creds.username }}</span>
            <button class="copy-btn" @click="copy(creds.username, 'username')" title="复制">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="credential-row">
          <span class="credential-label">密码</span>
          <div class="credential-value">
            <span>{{ creds.password }}</span>
            <button class="copy-btn" @click="copy(creds.password, 'password')" title="复制">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="credential-actions">
          <button class="action-btn" @click="$emit('edit-credentials', siteId)">编辑</button>
          <button class="action-btn danger" @click="handleClear">清除</button>
        </div>
      </div>

      <!-- No credentials -->
      <div class="no-credential" v-else>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span>暂无保存的账号密码</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/dataStore'
import { useToast } from '../composables/useToast'

const props = defineProps({
  siteId: { type: String, required: true },
})

const emit = defineEmits(['close', 'edit-credentials'])

const data = useDataStore()
const { show: showToast } = useToast()

const loading = ref(true)
const creds = ref(null)

const site = computed(() => data.sites.find((s) => s.id === props.siteId))

const faviconUrl = computed(() => {
  try {
    const host = new URL(site.value?.url || '').hostname
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`
  } catch {
    return ''
  }
})

onMounted(async () => {
  try {
    const result = await data.decryptCredentials(props.siteId)
    creds.value = result
  } catch {
    creds.value = null
  }
  loading.value = false
})

async function copy(text, type) {
  try {
    await navigator.clipboard.writeText(text)
    showToast(type === 'username' ? '账号已复制' : '密码已复制', 'success')
  } catch {
    showToast('复制失败', 'error')
  }
}

function handleClear() {
  if (window.confirm('确定清除此网站的账号密码？')) {
    data.clearCredentials(props.siteId)
    showToast('凭证已清除', 'success')
    emit('close')
  }
}
</script>

<style scoped>
.popover-overlay {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.25); backdrop-filter: blur(2px);
}

.popover {
  background: var(--bg-card); border-radius: var(--radius-lg);
  width: 360px; max-width: 94vw; box-shadow: var(--shadow-lg); overflow: hidden;
}

.popover-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
}

.popover-site { display: flex; align-items: center; gap: 10px; }
.popover-favicon { width: 20px; height: 20px; border-radius: 4px; }
.popover-site-name { font-size: 15px; font-weight: 600; }

.popover-close {
  width: 30px; height: 30px; display: flex; align-items: center;
  justify-content: center; border-radius: 6px; color: var(--text-muted);
  transition: background 0.2s;
}
.popover-close:hover { background: var(--bg-hover); }

/* Loading */
.loading-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 32px 20px; color: var(--text-muted); font-size: 13px;
}

.spinner {
  width: 20px; height: 20px; border: 2px solid var(--border);
  border-top-color: var(--accent); border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Credential rows */
.credential-rows { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }

.credential-row { display: flex; align-items: center; gap: 12px; }

.credential-label {
  font-size: 12px; font-weight: 500; color: var(--text-secondary);
  width: 32px; flex-shrink: 0;
}

.credential-value {
  flex: 1; display: flex; align-items: center; justify-content: space-between;
  gap: 8px; padding: 8px 12px; background: var(--bg);
  border-radius: 6px; font-size: 13px;
  font-family: 'SF Mono', 'Menlo', monospace; min-height: 36px;
  word-break: break-all;
}

.copy-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 4px;
  color: var(--text-muted); flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
}
.copy-btn:hover { background: var(--accent-light); color: var(--accent); }

/* Actions */
.credential-actions {
  display: flex; gap: 8px; padding-top: 4px;
}

.action-btn {
  padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 500;
  color: var(--accent); transition: background 0.2s;
}
.action-btn:hover { background: var(--accent-light); }
.action-btn.danger { color: var(--danger); }
.action-btn.danger:hover { background: #fff0f0; }

/* No credentials */
.no-credential {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 32px 20px; color: var(--text-muted); font-size: 13px;
}
</style>
