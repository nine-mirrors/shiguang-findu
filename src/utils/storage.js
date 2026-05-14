const PREFIX = 'findu_v8_'
const LEGACY_PREFIX = 'findu_v3_'

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key) || localStorage.getItem(LEGACY_PREFIX + key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch (e) {
      console.warn('Storage set failed:', e)
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key)
      localStorage.removeItem(LEGACY_PREFIX + key)
    } catch (e) {
      console.warn('Storage remove failed:', e)
    }
  }
}
