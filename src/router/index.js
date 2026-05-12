import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const userOnly = { requiresAuth: true, userOnly: true }

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/login', name: 'Login', component: () => import('@/pages/Login.vue'), meta: { guest: true } },
    { path: '/register', name: 'Register', component: () => import('@/pages/Register.vue'), meta: { guest: true } },
    {
      path: '/',
      component: () => import('@/layouts/UserLayout.vue'),
      meta: { userArea: true },
      children: [
        { path: 'home', name: 'Home', component: () => import('@/pages/Home.vue') },
        { path: 'items', name: 'Items', component: () => import('@/pages/Items.vue') },
        { path: 'items/:id', name: 'ItemDetail', component: () => import('@/pages/ItemDetail.vue') },
        { path: 'items/:id/claim', name: 'ClaimApply', component: () => import('@/pages/ClaimApply.vue'), meta: userOnly },
        { path: 'notifications', name: 'Notifications', component: () => import('@/pages/Notifications.vue'), meta: userOnly },
        { path: 'favorites', name: 'Favorites', component: () => import('@/pages/Favorites.vue'), meta: userOnly },
        { path: 'verification', name: 'Verification', component: () => import('@/pages/Verification.vue'), meta: userOnly },
        { path: 'guide', name: 'GuideAgreement', component: () => import('@/pages/GuideAgreement.vue') },
        { path: 'publish', name: 'Publish', component: () => import('@/pages/Publish.vue'), meta: userOnly },
        { path: 'my-posts', name: 'MyPosts', component: () => import('@/pages/MyPosts.vue'), meta: userOnly },
        { path: 'my-claims', redirect: '/my-posts?tab=claims', meta: userOnly },
        { path: 'profile', name: 'Profile', component: () => import('@/pages/Profile.vue'), meta: userOnly }
      ]
    },
    {
      path: '/admin', component: () => import('@/layouts/AdminLayout.vue'), meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', name: 'AdminDashboard', component: () => import('@/pages/AdminDashboard.vue') },
        { path: 'review', name: 'AdminReview', component: () => import('@/pages/AdminReview.vue') },
        { path: 'operations', name: 'AdminOperations', component: () => import('@/pages/AdminOperations.vue') },
        { path: 'risk', name: 'AdminRisk', component: () => import('@/pages/AdminRisk.vue') },
        { path: 'analytics', name: 'AdminAnalytics', component: () => import('@/pages/AdminAnalytics.vue') }
      ]
    },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/pages/NotFound.vue') }
  ]
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLogin) {
    ElMessage.warning('请先登录后再继续操作')
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    ElMessage.error('当前账号无管理员权限')
    return '/home'
  }
  // 管理员账号只进入后台，不参与前台发布、收藏、认领等普通用户流程。
  if (userStore.isAdmin && to.meta.userArea) {
    ElMessage.info('管理员账号仅用于后台运营管理')
    return '/admin/dashboard'
  }
  if (to.meta.guest && userStore.isLogin) return userStore.isAdmin ? '/admin/dashboard' : '/home'
  return true
})

export default router
