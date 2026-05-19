<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" @keyup.esc="$emit('close')">
      <div class="modal-header">
        <h2 class="modal-title">{{ isEdit ? '编辑快捷入口' : '添加快捷入口' }}</h2>
        <button class="modal-close" @click="$emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-field">
          <label class="form-label">网站名称 *</label>
          <input v-model="title" class="form-input" type="text" placeholder="例如：GitHub" />
        </div>
        <div class="form-field">
          <label class="form-label">网站地址 *</label>
          <input v-model="url" class="form-input" type="url" placeholder="https://github.com" />
        </div>
        <div class="form-field">
          <label class="form-label">所属分组 *</label>
          <select v-model="groupId" class="form-select">
            <option value="" disabled>选择分组</option>
            <option v-for="g in sortedGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>

        <div class="form-divider"></div>

        <div class="form-field">
          <label class="form-label">账号</label>
          <input v-model="formUsername" class="form-input" type="text" :placeholder="usernamePlaceholder" />
        </div>
        <div class="form-field">
          <label class="form-label">密码</label>
          <input v-model="formPassword" class="form-input" type="password" :placeholder="passwordPlaceholder" />
        </div>

        <button v-if="isEdit && hasCredentials" class="clear-creds-btn" @click="clearCredentials">
          清除已保存的账号密码
        </button>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-confirm" @click="handleSubmit" :disabled="!isValid">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/dataStore'

const props = defineProps({
  siteId: { type: String, default: null },
})

const emit = defineEmits(['close', 'save'])

const data = useDataStore()

const title = ref('')
const url = ref('')
const groupId = ref('')
const formUsername = ref('')
const formPassword = ref('')
const hasCredentials = ref(false)

const isEdit = computed(() => !!props.siteId)

const sortedGroups = computed(() =>
  [...data.groups].sort((a, b) => a.order - b.order),
)

const usernamePlaceholder = computed(() =>
  isEdit.value ? '留空则不修改' : '登录用户名/邮箱（可选）',
)
const passwordPlaceholder = computed(() =>
  isEdit.value ? '留空则不修改' : '登录密码（可选）',
)

const isValid = computed(() => {
  if (!title.value.trim()) return false
  if (!url.value.trim()) return false
  try { new URL(url.value) } catch { return false }
  if (!groupId.value) return false
  return true
})

onMounted(() => {
  if (props.siteId) {
    const site = data.sites.find((s) => s.id === props.siteId)
    if (site) {
      title.value = site.title || ''
      url.value = site.url || ''
      groupId.value = site.groupId || ''
      hasCredentials.value = !!(site.credentials?.username || site.credentials?.password)
    }
  } else if (data.groups.length > 0) {
    groupId.value = data.groups[0].id
  }
})

function handleSubmit() {
  if (!isValid.value) return
  const payload = {
    title: title.value.trim(),
    url: url.value.trim(),
    groupId: groupId.value,
  }
  if (formUsername.value || formPassword.value) {
    payload.credentials = {
      username: formUsername.value || undefined,
      password: formPassword.value || undefined,
    }
  }
  emit('save', payload)
}

function clearCredentials() {
  hasCredentials.value = false
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.25); backdrop-filter: blur(2px);
}

.modal {
  background: var(--bg-card); border-radius: var(--radius-lg);
  width: 420px; max-width: 94vw;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 0;
}

.modal-title { font-size: 17px; font-weight: 600; }

.modal-close {
  width: 30px; height: 30px; display: flex; align-items: center;
  justify-content: center; border-radius: 6px; color: var(--text-muted);
  transition: background 0.2s;
}
.modal-close:hover { background: var(--bg-hover); }

.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }

.form-field { display: flex; flex-direction: column; gap: 6px; }

.form-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }

.form-input, .form-select {
  padding: 10px 12px; background: var(--bg);
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-size: 14px; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus, .form-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0,113,227,0.12);
  background: var(--bg-card);
}
.form-input::placeholder { color: var(--text-muted); }

.form-select {
  appearance: none; cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2386868b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center;
  padding-right: 36px;
}

.form-divider { height: 1px; background: var(--border); margin: 2px 0; }

.clear-creds-btn {
  font-size: 12px; color: var(--danger); padding: 6px 0; text-align: left;
  transition: opacity 0.2s;
}
.clear-creds-btn:hover { opacity: 0.7; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 0 24px 20px;
}

.btn-cancel, .btn-confirm {
  padding: 9px 20px; border-radius: var(--radius-sm);
  font-size: 14px; font-weight: 500; transition: background 0.2s;
}

.btn-cancel { color: var(--text-secondary); }
.btn-cancel:hover { background: var(--bg-hover); }

.btn-confirm { background: var(--accent); color: #fff; }
.btn-confirm:hover:not(:disabled) { background: var(--accent-hover); }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
