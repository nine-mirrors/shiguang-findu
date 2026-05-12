import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loginApi, registerApi } from '@/api/lostFound'
import { storage } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref(storage.get('token', ''))
  const user = ref(storage.get('user', null))

  const isLogin = computed(() => Boolean(token.value && user.value?.id))
  const isAdmin = computed(() => user.value?.role === 'admin')
  const displayName = computed(() => user.value?.username || user.value?.email || '同学')
  const avatarText = computed(() => displayName.value.slice(0, 1))

  function setAuth(payload) {
    token.value = payload.token
    user.value = payload.user
    storage.set('token', token.value)
    storage.set('user', user.value)
  }

  async function login(form) {
    const payload = await loginApi(form)
    setAuth(payload)
    return payload
  }

  async function register(form) {
    const payload = await registerApi(form)
    setAuth(payload)
    return payload
  }

  function logout() {
    token.value = ''
    user.value = null
    storage.remove('token')
    storage.remove('user')
  }

  return { token, user, isLogin, isAdmin, displayName, avatarText, login, register, logout }
})
