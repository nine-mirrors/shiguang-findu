import { app } from './app.js'
import { config } from './config.js'
import { prisma } from './db.js'

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

  const shutdown = async signal => {
    console.log(`\n[findu] 收到 ${signal}，正在关闭服务...`)
    server.close(async () => {
      await prisma.$disconnect()
      process.exit(0)
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

bootstrap()
