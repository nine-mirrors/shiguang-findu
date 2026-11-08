import { Router } from 'express'
import authRoutes from './auth.js'
import userRoutes from './user.js'
import categoryRoutes from './category.js'
import itemRoutes from './item.js'
import myRoutes from './my.js'
import claimRoutes from './claim.js'
import favoriteRoutes from './favorite.js'
import notificationRoutes from './notification.js'
import verificationRoutes from './verification.js'
import announcementRoutes from './announcement.js'
import handoverRoutes from './handover.js'
import adminRoutes from './admin.js'

const router = Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'findu-backend', time: new Date().toISOString() })
})

router.use('/auth', authRoutes)
router.use('/user', userRoutes)
router.use('/categories', categoryRoutes)
router.use('/lost-found/items', itemRoutes)
router.use('/my', myRoutes)
router.use('/claims', claimRoutes)
router.use('/favorites', favoriteRoutes)
router.use('/notifications', notificationRoutes)
router.use('/verifications', verificationRoutes)
router.use('/announcements', announcementRoutes)
router.use('/handover-records', handoverRoutes)
router.use('/admin', adminRoutes)

export default router
