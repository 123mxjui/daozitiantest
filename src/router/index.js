import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import LockPage from '../views/LockPage.vue'
import MainPage from '../views/MainPage.vue'

const routes = [
  { path: '/', name: 'home', component: MainPage, meta: { requiresAuth: true } },
  { path: '/lock', name: 'lock', component: LockPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (!auth.isUnlocked) return next({ name: 'lock' })
  }
  next()
})

export default router
