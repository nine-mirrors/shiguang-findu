import { app } from './app.js'
import { config } from './config.js'
import { prisma } from './db.js'
import { runOverdueScan } from './services/overdue.js'

const OVERDUE_SCAN_INTERVAL = 6 * 60 * 60 * 1000

async function scheduleOverdueScan() {
  try {
    const result = await runOverdueScan()
    if (result.expired || result.nearExpired) {
      console.log(
        `[findu] 保管期扫描：到期关闭 ${result.expired} 条，临期提醒 ${result.nearExpired} 条`
      )
    }
  } catch (error) {
    console.warn('[findu] 保管期扫描失败:', error.message)
  }
}

async function bootstrap() {
  try {
    await prisma.$connect()
  } catch (error) {
    console.error('[findu] 数据库连接失败，请先执行 npm run db:migrate 或 npm run db:push')
    console.error(error.message)
    process.exit(1)
  }

  const server = app.listen(config.port, () => {
    console.log(`[findu] 服务已启动: http://127.0.0.1:${config.port}`)
    console.log(`[findu] 健康检查: http://127.0.0.1:${config.port}/api/health`)
    console.log(`[findu] 环境: ${config.nodeEnv}`)
  })

  // 逾期扫描：启动即跑一次，之后每 6 小时一次；unref 避免阻塞进程退出
  scheduleOverdueScan()
  const scanTimer = setInterval(scheduleOverdueScan, OVERDUE_SCAN_INTERVAL)
  if (typeof scanTimer.unref === 'function') scanTimer.unref()

  const shutdown = async signal => {
    console.log(`\n[findu] 收到 ${signal}，正在关闭服务...`)
    clearInterval(scanTimer)
    server.close(async () => {
      await prisma.$disconnect()
      process.exit(0)
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

bootstrap()
