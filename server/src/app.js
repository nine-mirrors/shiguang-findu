import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import routes from './routes/index.js'
import { notFoundHandler, errorHandler } from './middleware/error.js'

export const app = express()

app.disable('x-powered-by')

// 允许前端本地 dev 端口（5173 / 5188 等）跨域；CORS_ORIGINS=* 时回显任意来源
const corsOptions = {
  origin(origin, callback) {
    if (!origin || config.corsOrigins === '*') return callback(null, true)
    return callback(null, config.corsOrigins.includes(origin))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400,
  optionsSuccessStatus: 204
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// 上传后的图片通过 /uploads/<filename> 直接访问（带 CORS，便于前端 canvas / fetch 使用）
app.use(
  '/uploads',
  express.static(config.uploadDir, {
    maxAge: '7d',
    setHeaders(res) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    }
  })
)

app.use('/api', routes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
