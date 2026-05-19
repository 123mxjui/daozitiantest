<template>
  <div class="confirm-overlay" @click.self="$emit('cancel')">
    <div class="confirm-dialog">
      <h3 class="confirm-title">{{ title }}</h3>
      <p class="confirm-message" v-if="message">{{ message }}</p>
      <div class="confirm-actions">
        <button class="btn-cancel" @click="$emit('cancel')">{{ cancelText }}</button>
        <button class="btn-confirm danger" @click="$emit('confirm')">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
})

defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.confirm-overlay {
  position: fixed; inset: 0; z-index: 300;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.3);
}

.confirm-dialog {
  background: var(--bg-card); border-radius: var(--radius-lg);
  padding: 24px; width: 340px; max-width: 90vw;
  box-shadow: var(--shadow-lg);
}

.confirm-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }

.confirm-message {
  font-size: 14px; color: var(--text-secondary);
  line-height: 1.5; margin-bottom: 20px;
}

.confirm-actions {
  display: flex; justify-content: flex-end; gap: 10px;
}

.btn-cancel, .btn-confirm {
  padding: 8px 18px; border-radius: var(--radius-sm);
  font-size: 14px; font-weight: 500; transition: background 0.2s;
}

.btn-cancel { color: var(--text-secondary); }
.btn-cancel:hover { background: var(--bg-hover); }

.btn-confirm { color: #fff; }
.btn-confirm.danger { background: var(--danger); }
.btn-confirm.danger:hover { opacity: 0.85; }
</style>
