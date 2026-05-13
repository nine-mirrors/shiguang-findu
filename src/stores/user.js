import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loginApi, registerApi, logoutApi } from '@/api/auth'
import { storage } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref(storage.get('token', ''))
  const user = ref(storage.get('user', null))

  const isLogin = computed(() => Boolean(token.value && user.value?.id))
  const isAdmin = computed(() => user.value?.role === 'admin')
  const displayName = computed(() => user.value?.username || user.value?.email || '同学')
  const avatarText = computed(() => displayName.value.slice(0, 1))

  function normalizeAuthPayload(res) {
    const payload = res?.data || res

    return {
      token: payload?.token || '',
      user: payload?.user || null
    }
  }

  function setAuth(payload) {
    token.value = payload.token
    user.value = payload.user
    storage.set('token', token.value)
    storage.set('user', user.value)
  }

  async function login(form) {
    const res = await loginApi(form)
    const payload = normalizeAuthPayload(res)

    if (!payload.token || !payload.user) {
      throw new Error('登录接口返回数据格式不正确')
    }

    setAuth(payload)
    return payload
  }

  async function register(form) {
    const res = await registerApi(form)
    const payload = normalizeAuthPayload(res)

    if (!payload.token || !payload.user) {
      throw new Error('注册接口返回数据格式不正确')
    }

    setAuth(payload)
    return payload
  }

  async function logout() {
    try {
      if (token.value) {
        await logoutApi()
      }
    } finally {
      token.value = ''
      user.value = null
      storage.remove('token')
      storage.remove('user')
    }
  }

  return {
    token,
    user,
    isLogin,
    isAdmin,
    displayName,
    avatarText,
    login,
    register,
    logout
  }
})