export const API_PATHS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    SEND_EMAIL_CODE: '/api/auth/send-email-code',
    LOGOUT: '/api/auth/logout'
  },
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/profile'
  },
  CATEGORY: {
    LIST: '/api/categories'
  },
  ITEM: {
    LIST: '/api/lost-found/items',
    DETAIL: (id) => `/api/lost-found/items/${id}`,
    CREATE: '/api/lost-found/items',
    UPDATE_STATUS: (id) => `/api/lost-found/items/${id}/status`,
    DELETE: (id) => `/api/lost-found/items/${id}`,
    UPLOAD_IMAGES: (id) => `/api/lost-found/items/${id}/images`,
    MY: '/api/my/lost-found/items'
  },
  CLAIM: {
    CREATE: '/api/claims',
    MY: '/api/my/claims'
  },
  FAVORITE: {
    LIST: '/api/favorites',
    ADD: '/api/favorites',
    REMOVE: (id) => `/api/favorites/${id}`
  },
  NOTIFICATION: {
    LIST: '/api/notifications',
    READ: (id) => `/api/notifications/${id}/read`,
    READ_ALL: '/api/notifications/read-all'
  },
  VERIFICATION: {
    MY: '/api/my/verification',
    SUBMIT: '/api/verifications'
  },
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',
    ITEMS: '/api/admin/items',
    AUDIT_ITEM: (id) => `/api/admin/items/${id}/audit`,
    CLAIMS: '/api/admin/claims',
    AUDIT_CLAIM: (id) => `/api/admin/claims/${id}/audit`,
    OVERDUE_ITEMS: '/api/admin/overdue-items',
    TRANSFER: (id) => `/api/admin/overdue-items/${id}/transfer`,
    ANNOUNCEMENTS: '/api/admin/announcements',
    CREATE_ANNOUNCEMENT: '/api/admin/announcements',
    DISPUTES: '/api/admin/disputes',
    RESOLVE_DISPUTE: (id) => `/api/admin/disputes/${id}/resolve`,
    RISK_USERS: '/api/admin/risk-users',
    BLACKLIST: (id) => `/api/admin/risk-users/${id}/blacklist`,
    REMOVE_BLACKLIST: (id) => `/api/admin/risk-users/${id}/remove-blacklist`,
    ANALYTICS: '/api/admin/analytics'
  }
}
