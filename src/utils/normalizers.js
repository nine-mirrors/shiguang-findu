export function normalizeItems(res) {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

export function normalizeItem(res) {
  return res?.data || res || null
}

export function normalizeList(res) {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

export function normalizeFavorites(res) {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

export function normalizeFavoriteItems(list) {
  return list.map(item => {
    return item.item || item.lost_found_item || item
  })
}

export function normalizeCategories(res) {
  const list = res?.data || res || []

  return list.map(item => {
    if (typeof item === 'string') {
      return {
        id: item,
        name: item,
        icon: ''
      }
    }

    return {
      id: item.id,
      name: item.name,
      icon: item.icon || ''
    }
  })
}

export function normalizeNotifications(res) {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

export function normalizeUserPayload(res) {
  const payload = res?.data || res
  return payload?.user || payload
}

export function normalizeAuthPayload(res) {
  const payload = res?.data || res

  return {
    token: payload?.token || '',
    user: payload?.user || null
  }
}

export function normalizeVerification(res) {
  return res?.data || res || {}
}

export function normalizeDashboard(res) {
  const payload = res?.data || res || {}

  return {
    total: payload.total || 0,
    pending: payload.pending || payload.item_pending || 0,
    retained: payload.retained || payload.storage_retained || 0,
    blacklist: payload.blacklist || payload.risk_users || 0,
    claimPending: payload.claimPending || payload.claim_pending || 0,
    todos: payload.todos || payload.admin_todos || [],
    retainedItems: payload.retainedItems || payload.retained_items || [],
    locations: payload.locations || payload.hot_locations || []
  }
}
