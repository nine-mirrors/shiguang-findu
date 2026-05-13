import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loginApi, registerApi, logoutApi } from '@/api/auth'
import { getUserProfileApi, updateUserProfileApi } from '@/api/user'
import { storage } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref(storage.get('token', ''))
  const user = ref(storage.get('user', null))
  const profileLoaded = ref(false)
  const profileLoading = ref(false)

  const isLogin = computed(() => Boolean(token.value && user.value?.id))
  const isAdmin = computed(() => user.value?.role === 'admin')
  const displayName = computed(() => user.value?.username || user.value?.email || '同学')
  const avatarText = computed(() => displayName.value.slice(0, 1))

  const normalizeAuthPayload = res => {
    const payload = res?.data || res

    return {
      token: payload?.token || '',
      user: payload?.user || null
    }
  }

  const normalizeUserPayload = res => {
    const payload = res?.data || res

    return payload?.user || payload
  }

  const setAuth = payload => {
    token.value = payload.token
    user.value = payload.user
    profileLoaded.value = true

    storage.set('token', token.value)
    storage.set('user', user.value)
  }

  const setUser = value => {
    user.value = value
    profileLoaded.value = true
    storage.set('user', user.value)
  }

  const clearAuth = () => {
    token.value = ''
    user.value = null
    profileLoaded.value = false
    profileLoading.value = false

    storage.remove('token')
    storage.remove('user')
  }

  const login = async form => {
    const res = await loginApi(form)
    const payload = normalizeAuthPayload(res)

    if (!payload.token || !payload.user) {
      throw new Error('登录接口返回数据格式不正确')
    }

    setAuth(payload)
    return payload
  }

  const register = async form => {
    const res = await registerApi(form)
    const payload = normalizeAuthPayload(res)

    if (!payload.token || !payload.user) {
      throw new Error('注册接口返回数据格式不正确')
    }

    setAuth(payload)
    return payload
  }

  const fetchProfile = async (force = false) => {
    if (!token.value) return null
    if (profileLoaded.value && !force) return user.value
    if (profileLoading.value) return user.value

    profileLoading.value = true

    try {
      const res = await getUserProfileApi()
      const currentUser = normalizeUserPayload(res)

      if (!currentUser?.id) {
        throw new Error('用户资料接口返回数据格式不正确')
      }

      setUser(currentUser)
      return currentUser
    } catch (error) {
      clearAuth()
      throw error
    } finally {
      profileLoading.value = false
    }
  }

  const updateProfile = async form => {
    const res = await updateUserProfileApi(form)
    const currentUser = normalizeUserPayload(res)

    if (!currentUser?.id) {
      throw new Error('用户资料更新接口返回数据格式不正确')
    }

    setUser(currentUser)
    return currentUser
  }

  const logout = async () => {
    try {
      if (token.value) {
        await logoutApi()
      }
    } finally {
      clearAuth()
    }
  }

  return {
    token,
    user,
    profileLoaded,
    profileLoading,
    isLogin,
    isAdmin,
    displayName,
    avatarText,
    login,
    register,
    fetchProfile,
    updateProfile,
    logout,
    clearAuth
  }
})