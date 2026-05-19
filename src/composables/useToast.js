import { reactive, readonly } from 'vue'

const state = reactive({
  visible: false,
  message: '',
  type: 'success',
})

let timer = null

export function useToast() {
  function show(message, type = 'success', duration = 2000) {
    if (timer) clearTimeout(timer)
    state.message = message
    state.type = type
    state.visible = true
    timer = setTimeout(() => {
      state.visible = false
    }, duration)
  }

  function hide() {
    if (timer) clearTimeout(timer)
    state.visible = false
  }

  return {
    toast: readonly(state),
    show,
    hide,
  }
}
