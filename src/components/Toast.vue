<template>
  <Teleport to="body">
    <transition name="toast">
      <div v-if="toast.visible" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { useToast } from '../composables/useToast'

const { toast } = useToast()
</script>

<style scoped>
.toast {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  z-index: 9999;
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  white-space: nowrap;
  pointer-events: none;
}

.toast.success {
  background: #1d1d1f;
  color: #fff;
}

.toast.error {
  background: var(--danger);
  color: #fff;
}

.toast-enter-active {
  transition: all 0.25s ease-out;
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  opacity: 0; transform: translateX(-50%) translateY(12px);
}

.toast-leave-to {
  opacity: 0; transform: translateX(-50%) translateY(-4px);
}
</style>
