<template>
  <div class="site-card">
    <a class="site-link" :href="site.url" target="_blank" rel="noopener noreferrer">
      <div class="site-icon-wrap">
        <img
          v-if="!iconFailed"
          class="site-icon"
          :src="faviconUrl"
          :alt="site.title"
          @error="onIconError"
        />
        <span v-else class="site-icon-fallback" :style="{ background: fallbackColor }">{{ firstChar }}</span>
      </div>
      <span class="site-title">{{ site.title }}</span>
    </a>
    <div class="toolbar">
      <button class="toolbar-btn" title="查看密码" @click.prevent.stop="$emit('view-credentials', site.id)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </button>
      <button class="toolbar-btn" title="编辑" @click.prevent.stop="$emit('edit-site', site.id)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="toolbar-btn danger" title="删除" @click.prevent.stop="$emit('delete-site', site.id)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  site: { type: Object, required: true },
})

defineEmits(['view-credentials', 'edit-site', 'delete-site'])

const iconFailed = ref(false)

const host = computed(() => {
  try {
    return new URL(props.site.url).hostname
  } catch {
    return ''
  }
})

const faviconUrl = computed(() => {
  return host.value ? `https://${host.value}/favicon.ico` : ''
})

const firstChar = computed(() => {
  return props.site.title?.charAt(0)?.toUpperCase() || '?'
})

const fallbackColor = computed(() => {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#00bcd4']
  const index = props.site.title ? props.site.title.charCodeAt(0) % colors.length : 0
  return colors[index]
})

function onIconError() {
  iconFailed.value = true
}
</script>

<style scoped>
.site-card {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
}

.site-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.site-link {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 20px 16px 16px; text-align: center;
  text-decoration: none; color: inherit;
}

.site-icon-wrap {
  width: 40px; height: 40px; border-radius: 10px;
  background: var(--bg); display: flex; align-items: center;
  justify-content: center; overflow: hidden;
}

.site-icon { width: 24px; height: 24px; object-fit: contain; }

.site-icon-fallback {
  font-size: 16px; font-weight: 600; color: #fff;
  line-height: 1; width: 24px; height: 24px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
}

.site-title {
  font-size: 13px; font-weight: 500; line-height: 1.3;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;
}

/* Hover toolbar */
.toolbar {
  position: absolute; top: 6px; right: 6px;
  display: flex; gap: 2px; opacity: 0;
  transition: opacity 0.2s;
}

.site-card:hover .toolbar { opacity: 1; }

.toolbar-btn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 5px;
  color: var(--text-muted); background: var(--bg-card);
  transition: background 0.15s, color 0.15s;
}

.toolbar-btn:hover { background: var(--accent-light); color: var(--accent); }
.toolbar-btn.danger:hover { color: var(--danger); background: rgba(239, 68, 68, 0.15); }
</style>
