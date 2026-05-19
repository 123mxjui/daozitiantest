<template>
  <section class="group">
    <div class="group-header" @click="collapsed = !collapsed">
      <div class="group-title-area">
        <svg
          class="collapse-icon"
          :class="{ collapsed }"
          width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
        >
          <polyline points="4 3 7 6 4 9" />
        </svg>
        <h2 class="group-title">{{ group.name }}</h2>
        <span class="site-count">{{ group.sites.length }}</span>
      </div>
      <div class="group-actions" @click.stop>
        <button class="group-action-btn" @click="startRename" title="重命名分组">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="group-action-btn danger" @click="confirmDelete" title="删除分组">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Rename input -->
    <div class="rename-box" v-if="renaming" @click.stop>
      <input
        ref="renameInput"
        v-model="renameText"
        class="rename-input"
        @keyup.enter="doRename"
        @keyup.escape="renaming = false"
        @blur="doRename"
        autofocus
      />
    </div>

    <!-- Site grid -->
    <div
      class="site-grid"
      v-show="!collapsed"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      :class="{ 'drag-over': isDragOver }"
    >
      <TransitionGroup name="site-list">
        <SiteCard
          v-for="site in group.sites"
          :key="site.id"
          :site="site"
          draggable="true"
          @dragstart="onDragStart($event, site.id)"
          @view-credentials="$emit('view-credentials', site.id)"
          @edit-site="$emit('edit-site', site.id)"
          @delete-site="$emit('delete-site', site.id)"
        />
      </TransitionGroup>
    </div>
  </section>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import SiteCard from './SiteCard.vue'

const props = defineProps({
  group: { type: Object, required: true },
})

const emit = defineEmits([
  'edit-site',
  'delete-site',
  'view-credentials',
  'delete-group',
  'reorder-sites',
])

const collapsed = ref(false)
const renaming = ref(false)
const renameText = ref('')
const renameInput = ref(null)
const dragSiteId = ref(null)
const isDragOver = ref(false)

function startRename() {
  renameText.value = props.group.name
  renaming.value = true
  nextTick(() => renameInput.value?.focus())
}

function doRename() {
  const name = renameText.value.trim()
  if (name && name !== props.group.name) {
    emit('rename-group', { id: props.group.id, name })
  }
  renaming.value = false
}

function confirmDelete() {
  emit('delete-group', props.group.id)
}

function onDragStart(e, siteId) {
  dragSiteId.value = siteId
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', siteId)
}

function onDragOver() {
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(e) {
  isDragOver.value = false
  const draggedId = e.dataTransfer.getData('text/plain')
  const targetId = dragSiteId.value
  if (!draggedId || !targetId || draggedId === targetId) return

  const ids = props.group.sites.map((s) => s.id)
  const fromIndex = ids.indexOf(draggedId)
  const toIndex = ids.indexOf(targetId)
  if (fromIndex === -1 || toIndex === -1) return

  ids.splice(fromIndex, 1)
  ids.splice(toIndex, 0, draggedId)
  emit('reorder-sites', { groupId: props.group.id, orderedIds: ids })
  dragSiteId.value = null
}
</script>

<style scoped>
.group-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 4px; cursor: pointer; border-radius: 6px;
  transition: background 0.2s; margin-bottom: 8px;
}
.group-header:hover { background: var(--bg-hover); }

.group-title-area {
  display: flex; align-items: center; gap: 8px;
}

.collapse-icon {
  color: var(--text-muted); transition: transform 0.2s; flex-shrink: 0;
}
.collapse-icon.collapsed { transform: rotate(-90deg); }

.group-title { font-size: 14px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.3px; }

.site-count { font-size: 12px; color: var(--text-muted); }

.group-actions { display: flex; gap: 2px; }

.group-action-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  color: var(--text-muted); transition: background 0.2s, color 0.2s;
}
.group-action-btn:hover { background: var(--bg-hover); color: var(--text-secondary); }
.group-action-btn.danger:hover { color: var(--danger); background: #fff0f0; }

/* Rename */
.rename-box { padding: 0 4px 10px; }
.rename-input {
  width: 100%; padding: 8px 12px;
  border: 1.5px solid var(--accent); border-radius: 6px;
  font-size: 14px; outline: none;
}

/* Site grid */
.site-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  transition: background 0.2s;
  border-radius: var(--radius-md);
  padding: 4px;
  margin: -4px;
}

.site-grid.drag-over {
  background: var(--accent-light);
}

/* TransitionGroup animations */
.site-list-enter-active,
.site-list-leave-active {
  transition: all 0.25s ease;
}
.site-list-enter-from {
  opacity: 0; transform: scale(0.85);
}
.site-list-leave-to {
  opacity: 0; transform: scale(0.85);
}
.site-list-move {
  transition: transform 0.25s ease;
}
</style>
