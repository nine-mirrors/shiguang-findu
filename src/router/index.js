import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userOnly = {
  requiresAuth: true,
  userOnly: true
}

const adminOnly = {
  requiresAuth: true,
  requiresAdmin: true
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/Login.vue'),
      meta: { guest: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/pages/Register.vue'),
      meta: { guest: true }
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/pages/ForgotPassword.vue'),
      meta: { guest: true }
    },
    {
      path: '/403',
      name: 'Forbidden',
      component: () => import('@/pages/Forbidden.vue')
    },
    {
      path: '/',
      component: () => import('@/layouts/UserLayout.vue'),
      meta: { userArea: true },
      children: [
        {
          path: 'home',
          name: 'Home',
          component: () => import('@/pages/Home.vue')
        },
        {
          path: 'items',
          name: 'Items',
          component: () => import('@/pages/Items.vue')
        },
        {
          path: 'items/:id',
          name: 'ItemDetail',
          component: () => import('@/pages/ItemDetail.vue')
        },
        {
          path: 'items/:id/claim',
          name: 'ClaimApply',
          component: () => import('@/pages/ClaimApply.vue'),
          meta: userOnly
        },
        {
          path: 'publish',
          name: 'Publish',
          component: () => import('@/pages/Publish.vue'),
          meta: userOnly
        },
        {
          path: 'publish/:id/edit',
          name: 'EditPublish',
          component: () => import('@/pages/Publish.vue'),
          meta: userOnly,
          props: route => ({ editId: route.params.id })
        },
        {
          path: 'my-posts',
          name: 'MyPosts',
          component: () => import('@/pages/MyPosts.vue'),
          meta: userOnly
        },
        {
          path: 'my-claims',
          redirect: '/my-posts?tab=claims',
          meta: userOnly
        },
        {
          path: 'notifications',
          name: 'Notifications',
          component: () => import('@/pages/Notifications.vue'),
          meta: userOnly
        },
        {
          path: 'favorites',
          name: 'Favorites',
          component: () => import('@/pages/Favorites.vue'),
          meta: userOnly
        },
        {
          path: 'verification',
          name: 'Verification',
          component: () => import('@/pages/Verification.vue'),
          meta: userOnly
        },
        {
          path: 'guide',
          name: 'GuideAgreement',
          component: () => import('@/pages/GuideAgreement.vue')
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/pages/Profile.vue'),
          meta: userOnly
        }
      ]
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: adminOnly,
      children: [
        {
          path: '',
          redirect: '/admin/dashboard'
        },
        {
          path: 'dashboard',
          name: 'AdminDashboard',
          component: () => import('@/pages/AdminDashboard.vue')
        },
        {
          path: 'items',
          name: 'AdminItems',
          component: () => import('@/pages/AdminReview.vue'),
          props: route => ({ tab: route.query.tab || 'items' })
        },
        {
          path: 'claims',
          name: 'AdminClaims',
          component: () => import('@/pages/AdminReview.vue'),
          props: route => ({ tab: route.query.tab || 'claims' })
        },
        {
          path: 'review',
          redirect: '/admin/items'
        },
        {
          path: 'operations',
          name: 'AdminOperations',
          component: () => import('@/pages/AdminOperations.vue'),
          props: route => ({ tab: route.query.tab || 'handover' })
        },
        {
          path: 'overdue-items',
          name: 'AdminOverdueItems',
          component: () => import('@/pages/AdminOperations.vue'),
          props: route => ({ tab: route.query.tab || 'storage' })
        },
        {
          path: 'announcements',
          name: 'AdminAnnouncements',
          component: () => import('@/pages/AdminOperations.vue'),
          props: route => ({ tab: route.query.tab || 'announcements' })
        },
        {
          path: 'disputes',
          name: 'AdminDisputes',
          component: () => import('@/pages/AdminOperations.vue'),
          props: route => ({ tab: route.query.tab || 'disputes' })
        },
        {
          path: 'risk',
          name: 'AdminRisk',
          component: () => import('@/pages/AdminRisk.vue'),
          props: route => ({ tab: route.query.tab || 'blacklist' })
        },
        {
          path: 'verifications',
          name: 'AdminVerifications',
          component: () => import('@/pages/AdminRisk.vue'),
          props: route => ({ tab: route.query.tab || 'verify' })
        },
        {
          path: 'blacklist',
          name: 'AdminBlacklist',
          component: () => import('@/pages/AdminRisk.vue'),
          props: route => ({ tab: route.query.tab || 'blacklist' })
        },
        {
          path: 'analytics',
          name: 'AdminAnalytics',
          component: () => import('@/pages/AdminAnalytics.vue')
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/pages/NotFound.vue')
    }
  ]
})

router.beforeEach(async to => {
  const userStore = useUserStore()

  if (userStore.token && !userStore.profileLoaded) {
    try {
      await userStore.fetchProfile()
    } catch {
      if (to.meta.requiresAuth) {
        ElMessage.warning('登录状态已失效，请重新登录')

        return {
          path: '/login',
          query: {
            redirect: to.fullPath
          }
        }
      }
    }
  }

  if (to.meta.requiresAuth && !userStore.isLogin) {
    ElMessage.warning('请先登录后再继续操作')

    return {
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    ElMessage.error('当前账号没有管理员权限')

    return '/403'
  }

  if (userStore.isAdmin && to.meta.userArea) {
    ElMessage.info('管理员账号仅用于后台运营管理')

    return '/admin/dashboard'
  }

  if (to.meta.guest && userStore.isLogin) {
    return userStore.isAdmin ? '/admin/dashboard' : '/home'
  }

  return true
})

export default router