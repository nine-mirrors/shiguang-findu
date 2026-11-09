import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loginApi, registerApi, logoutApi } from '@/api/auth'
import { getUserProfileApi, updateUserProfileApi, uploadUserAvatarApi } from '@/api/user'
import { storage } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref(storage.get('token', ''))
  const user = ref(storage.get('user', null))
  const profileLoaded = ref(false)
  const profileLoading = ref(false)

  const isLogin = computed(() => Boolean(token.value && user.value?.id))
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isStudent = computed(() => user.value?.role === 'student')
  const verificationLevel = computed(() => user.value?.verification_level || 'none')
  const displayName = computed(() => user.value?.username || user.value?.name || user.value?.email || '同学')
  const avatarText = computed(() => displayName.value.slice(0, 1))

  const normalizeUser = value => {
    if (!value) return null

    return {
      ...value,
      name: value.name || value.username || value.email || '',
      username: value.username || value.name || '',
      role: value.role || 'student',
      verification_level: value.verification_level || 'none'
    }
  }

  const normalizeAuthPayload = res => {
    const payload = res?.data || res

    return {
      token: payload?.token || '',
      user: normalizeUser(payload?.user || null)
    }
  }

  const normalizeUserPayload = res => {
    const payload = res?.data || res
    const currentUser = payload?.user || payload

    return normalizeUser(currentUser)
  }

  const setAuth = payload => {
    token.value = payload.token
    user.value = normalizeUser(payload.user)
    profileLoaded.value = true

    storage.set('token', token.value)
    storage.set('user', user.value)
  }

  const setUser = value => {
    user.value = normalizeUser(value)
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

    if (!payload.token || !payload.user?.id) {
      throw new Error('登录接口返回数据格式不正确')
    }

    setAuth(payload)
    return payload
  }

  const register = async form => {
    const res = await registerApi(form)
    const payload = normalizeAuthPayload(res)

    if (!payload.token || !payload.user?.id) {
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
      if (error.response?.status === 401) {
        clearAuth()
      }

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

  const uploadAvatar = async (file, onProgress) => {
    const res = await uploadUserAvatarApi(file, {
      onUploadProgress: event => {
        if (!onProgress || !event?.total) return

        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
      }
    })

    const payload = res?.data || res || {}
    const avatar = payload.avatar || payload.user?.avatar || ''

    if (!avatar) {
      throw new Error('头像上传接口返回数据格式不正确')
    }

    const nextUser = normalizeUser(payload.user || { ...user.value, avatar })

    setUser(nextUser)

    return { avatar, user: nextUser }
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
    isStudent,
    verificationLevel,
    displayName,
    avatarText,
    setAuth,
    setUser,
    login,
    register,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    logout,
    clearAuth
  }
})