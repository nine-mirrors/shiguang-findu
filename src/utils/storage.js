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
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key)
    localStorage.removeItem(LEGACY_PREFIX + key)
  }
}
