<template>
  <div class="main-page">
    <!-- Top Bar -->
    <header class="topbar">
      <div class="topbar-inner">
        <div class="topbar-left">
          <span class="app-name">个人快捷入口</span>
        </div>
        <div class="topbar-right">
          <span class="sync-status" v-if="syncStatus" @click="showSync = true" title="点击打开同步面板">{{ syncStatus }}</span>
          <button class="topbar-btn sync-btn" @click="showSync = true" title="数据同步">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            <span>同步</span>
          </button>
          <button class="topbar-btn" @click="handleLock" title="锁定">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main class="content">
      <!-- Search -->
      <div class="search-section">
        <div class="search-box">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input class="search-input" v-model="data.searchQuery" type="text" placeholder="搜索网站..." />
        </div>
      </div>

      <!-- Groups -->
      <div v-if="data.filteredGroups.length > 0">
        <div class="groups" v-for="group in data.filteredGroups" :key="group.id">
          <GroupPanel
            :group="group"
            @edit-site="handleEditSite"
            @delete-site="handleDeleteSite"
            @view-credentials="handleViewCredentials"
            @delete-group="handleDeleteGroup"
            @reorder-sites="handleReorderSites"
            @rename-group="handleRenameGroup"
          />
        </div>

        <!-- Add group -->
        <div class="add-group">
          <button v-if="!showAddGroup" class="add-group-btn" @click="openAddGroup()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            添加分组
          </button>
          <div v-else class="add-group-input-wrap">
            <input
              ref="groupInputRef"
              v-model="newGroupName"
              class="add-group-input"
              placeholder="输入分组名称"
              @keyup.enter="handleAddGroup"
              @keyup.escape="cancelAddGroup"
              @blur="handleAddGroup"
            />
            <button class="add-group-cancel" @click="cancelAddGroup">取消</button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div class="empty-state" v-if="data.filteredGroups.length === 0">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p class="empty-text">还没有添加快捷入口</p>
        <p class="empty-hint">点击右下角 + 按钮开始添加</p>
        <button class="empty-add-group-btn" @click="openAddGroup()">+ 添加分组</button>
        <div v-if="showAddGroup" class="add-group-input-wrap" style="margin-top: 12px;">
          <input
            ref="groupInputRef"
            v-model="newGroupName"
            class="add-group-input"
            placeholder="输入分组名称"
            @keyup.enter="handleAddGroup"
            @keyup.escape="cancelAddGroup"
            @blur="handleAddGroup"
          />
          <button class="add-group-cancel" @click="cancelAddGroup">取消</button>
        </div>
      </div>
    </main>

    <!-- FAB -->
    <button class="fab" @click="handleAddSite" title="添加快捷入口">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>

    <!-- Sync Panel -->
    <SyncPanel v-if="showSync" @close="showSync = false" />

    <!-- Site Form -->
    <SiteFormModal
      v-if="showSiteForm"
      :site-id="editingSiteId"
      @close="closeSiteForm"
      @save="handleSaveSite"
    />

    <!-- Credential Popover -->
    <CredentialPopover
      v-if="showCredentials"
      :site-id="credentialSiteId"
      @close="showCredentials = false"
      @edit-credentials="handleEditCredentials"
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-if="confirm"
      :title="confirm.title"
      :message="confirm.message"
      @confirm="confirm.onConfirm(); confirm = null"
      @cancel="confirm = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useDataStore } from '../stores/dataStore'
import { useToast } from '../composables/useToast'
import { loadSyncConfig } from '../composables/useSync'
import GroupPanel from '../components/GroupPanel.vue'
import SyncPanel from '../components/SyncPanel.vue'
import SiteFormModal from '../components/SiteFormModal.vue'
import CredentialPopover from '../components/CredentialPopover.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const auth = useAuthStore()
const data = useDataStore()
const router = useRouter()
const { show: showToast } = useToast()

// Modal visibility state
const showSync = ref(false)
const showSiteForm = ref(false)
const showCredentials = ref(false)
const editingSiteId = ref(null)
const credentialSiteId = ref(null)
const confirm = ref(null)
const showAddGroup = ref(false)
const newGroupName = ref('')
const groupInputRef = ref(null)

function openAddGroup() {
  showAddGroup.value = true
  nextTick(() => groupInputRef.value?.focus())
}

const syncStatus = ref('')

function refreshSyncStatus() {
  const cfg = loadSyncConfig()
  if (!cfg.syncedAt) {
    syncStatus.value = ''
    return
  }
  const d = new Date(cfg.syncedAt)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  syncStatus.value = `已同步 ${mm}-${dd} ${hh}:${mi}`
}

// Refresh status after sync panel closes
watch(showSync, (val) => { if (!val) refreshSyncStatus() })

onMounted(() => {
  data.loadFromStorage()
  refreshSyncStatus()
})

function handleLock() {
  auth.lock()
  router.push('/lock')
}

function handleAddSite() {
  editingSiteId.value = null
  showSiteForm.value = true
}

function handleEditSite(id) {
  editingSiteId.value = id
  showSiteForm.value = true
}

function closeSiteForm() {
  showSiteForm.value = false
  editingSiteId.value = null
}

async function handleSaveSite(siteData) {
  if (editingSiteId.value) {
    await data.updateSite(editingSiteId.value, siteData)
    showToast('已更新', 'success')
  } else {
    await data.createSite(siteData)
    showToast('已添加', 'success')
  }
  closeSiteForm()
}

function handleDeleteSite(id) {
  const site = data.sites.find((s) => s.id === id)
  confirm.value = {
    title: '删除快捷入口',
    message: `确定删除「${site?.title || ''}」？关联的账号密码也将被删除。`,
    onConfirm: () => {
      data.deleteSite(id)
      showToast('已删除', 'success')
    },
  }
}

function handleViewCredentials(id) {
  credentialSiteId.value = id
  showCredentials.value = true
}

function handleEditCredentials(id) {
  showCredentials.value = false
  editingSiteId.value = id
  showSiteForm.value = true
}

function handleDeleteGroup(id) {
  const group = data.groups.find((g) => g.id === id)
  const count = data.sites.filter((s) => s.groupId === id).length
  const msg =
    count > 0
      ? `删除分组「${group?.name}」后，组内 ${count} 个站点也将被删除。`
      : `确定删除分组「${group?.name}」？`
  confirm.value = {
    title: '删除分组',
    message: msg,
    onConfirm: () => {
      data.deleteGroup(id)
      showToast('分组已删除', 'success')
    },
  }
}

function handleReorderSites({ groupId, orderedIds }) {
  data.reorderSites(groupId, orderedIds)
}

function handleRenameGroup({ id, name }) {
  data.updateGroup(id, { name })
}

function handleAddGroup() {
  const name = newGroupName.value.trim()
  if (!name) {
    cancelAddGroup()
    return
  }
  data.createGroup({ name })
  showToast('分组已添加', 'success')
  cancelAddGroup()
}

function cancelAddGroup() {
  showAddGroup.value = false
  newGroupName.value = ''
}
</script>

<style scoped>
.main-page { min-height: 100vh; }

/* Top Bar */
.topbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(242, 243, 245, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}

.topbar-inner {
  max-width: 960px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px;
}

.topbar-left { display: flex; align-items: center; gap: 10px; }

.app-name { font-size: 18px; font-weight: 600; letter-spacing: -0.3px; }

.topbar-right { display: flex; align-items: center; gap: 8px; }

.sync-status {
  font-size: 11px; color: var(--text-muted); cursor: pointer;
  padding: 4px 8px; border-radius: 4px; transition: background 0.2s;
  white-space: nowrap;
}
.sync-status:hover { background: var(--bg-hover); }

.topbar-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: var(--radius-sm);
  font-size: 13px; color: var(--text-secondary);
  transition: background 0.2s, color 0.2s;
}

.topbar-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

/* Content */
.content { max-width: 960px; margin: 0 auto; padding: 24px; padding-bottom: 100px; }

/* Search */
.search-section { margin-bottom: 32px; }

.search-box { position: relative; max-width: 480px; }

.search-icon {
  position: absolute; left: 14px; top: 50%;
  transform: translateY(-50%); color: var(--text-muted); pointer-events: none;
}

.search-input {
  width: 100%; padding: 11px 14px 11px 42px;
  background: var(--bg-card); border: 1.5px solid transparent;
  border-radius: var(--radius-md); font-size: 14px;
  box-shadow: var(--shadow-sm); outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
}

.search-input::placeholder { color: var(--text-muted); }

/* Groups */
.groups { margin-bottom: 32px; }
.groups:last-child { margin-bottom: 0; }

/* Empty state */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 24px; text-align: center;
}

.empty-text { font-size: 16px; color: var(--text-secondary); margin-top: 16px; }
.empty-hint { font-size: 13px; color: var(--text-muted); margin-top: 6px; }

.empty-add-group-btn {
  margin-top: 16px; padding: 8px 18px; font-size: 14px; font-weight: 500;
  color: var(--accent); border: 1.5px dashed var(--border);
  border-radius: var(--radius-sm); transition: background 0.2s, border-color 0.2s;
}
.empty-add-group-btn:hover { background: var(--accent-light); border-color: var(--accent); }

/* Add group */
.add-group { margin-top: -16px; margin-bottom: 32px; }

.add-group-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; font-size: 13px; color: var(--text-secondary);
  border-radius: var(--radius-sm); transition: background 0.2s, color 0.2s;
}
.add-group-btn:hover { background: var(--bg-hover); color: var(--accent); }

.add-group-input-wrap { display: flex; gap: 8px; align-items: center; }

.add-group-input {
  flex: 1; max-width: 280px; padding: 8px 12px;
  background: var(--bg-card); border: 1.5px solid var(--accent);
  border-radius: var(--radius-sm); font-size: 14px; outline: none;
}

.add-group-cancel {
  font-size: 13px; color: var(--text-secondary); padding: 6px 10px;
  border-radius: var(--radius-sm); transition: background 0.2s;
}
.add-group-cancel:hover { background: var(--bg-hover); }

/* FAB */
.fab {
  position: fixed; bottom: 32px; right: 32px;
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--accent); color: #fff; border: none;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 113, 227, 0.35);
  transition: transform 0.2s, box-shadow 0.2s;
}

.fab:hover { transform: scale(1.06); box-shadow: 0 6px 24px rgba(0, 113, 227, 0.45); }
.fab:active { transform: scale(0.96); }
</style>
