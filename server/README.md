# FindU 校园失物招领 · 后端服务

基于 **Node.js + Express + Prisma** 的 FindU 后端，默认使用 **SQLite**，零配置即可跑通；接口口径对齐前端 `src/constants/api.js` 与 `src/api/lostFound.js`。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 运行时 | Node.js 18+（开发环境为 Node 24） |
| Web | Express 4 |
| ORM | Prisma 6 |
| 数据库 | SQLite（可切换 MySQL） |
| 鉴权 | JWT（学生 / 管理员角色） |
| 上传 | multer（本地 `uploads/` 目录 + 静态访问） |
| 密码 | bcryptjs |

## 目录结构

```
server/
├── prisma/
│   ├── schema.prisma          # 数据模型（含 SQLite / MySQL 切换说明）
│   ├── migrations/            # 初始迁移 SQL
│   ├── seed.js                # 种子数据脚本
│   └── dev.db                 # SQLite 数据库（运行后生成）
├── src/
│   ├── app.js                 # Express 装配
│   ├── server.js              # 启动入口
│   ├── config.js              # 环境变量
│   ├── db.js                  # PrismaClient 单例
│   ├── middleware/            # 鉴权、错误处理、图片上传
│   ├── routes/                # 9 组业务路由 + 扩展路由
│   └── utils/                 # 序列化、分页、时间、黑名单判断
├── tests/smoke.mjs            # 真实 HTTP 冒烟测试（覆盖全部端点）
├── uploads/                   # 上传图片落盘目录
├── .env.example
└── README.md
```

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（Windows PowerShell 用 Copy-Item）
cp .env.example .env

# 3. 建表（首次会创建 prisma/dev.db 并执行迁移）
npm run db:migrate

# 4. 写入种子数据
npm run db:seed

# 5. 启动
npm start
# 开发模式（文件变更自动重启）：npm run dev
```

启动后：

- 服务地址：`http://127.0.0.1:4000`
- 健康检查：`GET http://127.0.0.1:4000/api/health`
- 图片静态访问：`http://127.0.0.1:4000/uploads/<filename>`
- 默认允许任意来源跨域（`CORS_ORIGINS=*`），本地前端 `http://localhost:5173` / `http://localhost:5188` 的预检请求与 `/uploads` 静态资源均可直接访问；如需收紧，在 `.env` 中改成逗号分隔的白名单。

### 重置演示数据

种子里的帖子 / 认领时间以执行 seed 的时刻为基准生成：12 条帖子分布在最近 7 天（每天数量不均匀，并保留 2 条更早的用于“已完成 / 已关闭”），3 条认领也落在最近 7 天。因此后台趋势图不会是一条平线。

一条命令重置演示库（清空并重新写入种子）：

```bash
npm run db:reset
```

> 会清空当前库里的所有业务数据，仅用于本地演示环境。重置后 `itemStatusStats` 四个状态（寻找中 / 认领中 / 已完成 / 已关闭）都有数量。

### 演示账号

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 学生 | `student@example.com` | `123456` |
| 管理员 | `admin@example.com` | `123456` |
| 其他学生 | `wang@example.com` / `zhao@example.com` / `chen@example.com` / `zhou@example.com` | `123456` |

### 邮箱验证码

- `POST /api/auth/send-email-code` 生成 6 位验证码，写入内存（5 分钟有效），开发环境会在 `devCode` 字段直接返回；
- 为方便零配置联调，开发环境同时接受 `.env` 中的 `EMAIL_CODE_DEV`（默认 `123456`）。

## 环境变量

见 `.env.example`：

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `PORT` | 服务端口 | `4000` |
| `NODE_ENV` | 运行环境 | `development` |
| `CORS_ORIGINS` | 允许跨域来源，`*` 或逗号分隔（如 `http://localhost:5173,http://localhost:5188`） | `*` |
| `DATABASE_URL` | 数据库连接串 | `file:./dev.db` |
| `JWT_SECRET` | JWT 签名密钥（生产必须修改） | 开发默认值 |
| `JWT_EXPIRES_IN` | Token 有效期 | `7d` |
| `UPLOAD_DIR` | 上传目录 | `uploads` |
| `MAX_UPLOAD_MB` | 单张图片上限 | `5` |
| `EMAIL_CODE_DEV` | 演示环境固定验证码 | `123456` |

## 接口清单

统一约定：

- 鉴权：请求头 `Authorization: Bearer <token>`；标注「登录」的接口需要 token，标注「管理员」的还需要 `role = admin`。
- 分页响应：`{ "list": [], "total": 0, "page": 1, "page_size": 10, "total_pages": 0 }`。
- 错误响应：`{ "message": "错误说明", "errors": { "字段": "说明" } }`，HTTP 状态码语义化（401 / 403 / 404 / 409 / 422）。
- 字段：响应统一使用 camelCase（与前端 mock 一致）；管理端审核接口同时兼容 `audit_status`、`reject_reason`、`page_size` 等下划线入参。
- 账号被限制时返回 `403`，响应体带 `code: "user_blocked"`。

### 1. auth（4）

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | 公开 | 邮箱密码登录，返回 `{ token, user }` |
| POST | `/api/auth/register` | 公开 | 注册（含邮箱验证码），返回 `{ token, user }` |
| POST | `/api/auth/send-email-code` | 公开 | 发送邮箱验证码 |
| POST | `/api/auth/logout` | 登录 | 登出（JWT 无状态，前端清除 token） |

### 2. user（2）

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/user/profile` | 登录 | 当前用户资料 |
| PUT | `/api/user/profile` | 登录 | 修改用户名 / 头像 / 手机号 / 学号 |

### 3. category（1）

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/categories` | 公开 | 分类列表，返回 `[{ id, name, icon }]` |

### 4. item（7）

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/lost-found/items` | 公开 | 大厅列表，仅 `approved`；支持 `keyword/type/category/status/location/hasPhoto/page/page_size` |
| GET | `/api/lost-found/items/:id` | 公开 | 详情；未审核帖子仅作者 / 管理员可见 |
| POST | `/api/lost-found/items` | 登录 | 发布失物 / 招领，初始 `auditStatus = pending` |
| PUT | `/api/lost-found/items/:id/status` | 登录（作者/管理员） | 更新 `open / claiming / done / overdue` |
| DELETE | `/api/lost-found/items/:id` | 登录（作者/管理员） | 删除帖子 |
| POST | `/api/lost-found/items/:id/images` | 登录（作者/管理员） | 上传图片（multipart，字段 `images` / `files` / `file` / `image`，单次最多 5 张、单件最多 10 张） |
| GET | `/api/my/lost-found/items` | 登录 | 我的发布（分页） |

`hasPhoto` 取值：`with` / `without`；`type` 取值：`lost` / `found`；`status` 取值：`open / claiming / done / overdue`。

### 5. claim（2）

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/claims` | 登录 | 提交认领 / 领错归还申请（返回匹配度 `score`） |
| GET | `/api/my/claims` | 登录 | 我的申请（分页，含 `item`） |

状态流转：`pending →（管理员通过）handover_pending →（完成交接）completed`；驳回为 `rejected`；领错归还为 `wrong_return_pending → completed`。

业务约束：不能认领自己发布的帖子；同一帖子存在进行中的申请时再次提交返回 `409`；`done` / `overdue` 帖子不再接受申请；只有 `completed` 的认领才能发起领错归还。

### 6. favorite（3）

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/favorites` | 登录 | 收藏列表（分页，每项含 `item`） |
| POST | `/api/favorites` | 登录 | 添加收藏（幂等），body `{ itemId }` |
| DELETE | `/api/favorites/:id` | 登录 | 取消收藏，`:id` 兼容收藏记录 id / 物品 id |

### 7. notification（3）

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/notifications` | 登录 | 我的通知 + 全站公告（分页，返回 `unread`） |
| PUT | `/api/notifications/:id/read` | 登录 | 标记单条已读 |
| PUT | `/api/notifications/read-all` | 登录 | 全部已读 |

### 8. verification（2）

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/my/verification` | 登录 | 我的实名认证（无记录时返回 `status: "none"`） |
| POST | `/api/verifications` | 登录 | 提交实名认证 |

### 9. admin（15）

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/admin/dashboard` | 管理员 | 总览统计、待办、分类 / 地点分布 |
| GET | `/api/admin/items` | 管理员 | 审核列表（支持 `audit_status/keyword/status/type`） |
| PUT | `/api/admin/items/:id/audit` | 管理员 | 审核帖子（通过 / 驳回），招领帖通过后自动生成保管记录 |
| GET | `/api/admin/claims` | 管理员 | 认领列表（`status` 支持逗号分隔） |
| PUT | `/api/admin/claims/:id/audit` | 管理员 | 审核认领（通过 / 驳回 / 待补充） |
| GET | `/api/admin/overdue-items` | 管理员 | 滞留 / 保管物品列表 |
| PUT | `/api/admin/overdue-items/:id/transfer` | 管理员 | 登记移交去向 |
| GET | `/api/admin/announcements` | 管理员 | 公告列表 |
| POST | `/api/admin/announcements` | 管理员 | 发布公告（发布后写入全站通知） |
| GET | `/api/admin/disputes` | 管理员 | 争议列表 |
| PUT | `/api/admin/disputes/:id/resolve` | 管理员 | 处理争议 |
| GET | `/api/admin/risk-users` | 管理员 | 风险用户 / 黑名单列表 |
| POST | `/api/admin/risk-users/:id/blacklist` | 管理员 | 限制用户（`:id` 为用户 id） |
| POST | `/api/admin/risk-users/:id/remove-blacklist` | 管理员 | 解除限制（`:id` 兼容用户 id / 记录 id） |
| GET | `/api/admin/analytics` | 管理员 | 数据分析（活跃用户、成功率、热门地点、认领阶段、物品状态分布、近 7 日趋势） |

### 兼容扩展端点

以下端点用于补齐前端 `src/api/admin.js` / `lostFound.js` 中已出现但未列入 `api.js` 的调用，避免前端联调 404：

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/favorites/toggle` | 登录 | 收藏开关（兼容旧 mock 调用） |
| POST | `/api/claims/:id/return-wrong` | 登录 | 领错归还 |
| POST | `/api/handover-records` | 管理员 | 完成交接并结单 |
| GET | `/api/announcements` | 公开 | 已发布公告列表 |
| GET | `/api/admin/lost-found/items` | 管理员 | 审核列表别名 |
| PUT | `/api/admin/lost-found/items/:id/audit` | 管理员 | 审核别名 |
| DELETE | `/api/admin/lost-found/items/:id` | 管理员 | 下架别名 |
| GET | `/api/admin/users` | 管理员 | 用户检索（黑名单选人） |
| GET | `/api/admin/verifications` | 管理员 | 实名认证列表 |
| PUT | `/api/admin/verifications/:id/audit` | 管理员 | 审核实名认证 |
| GET / POST | `/api/admin/blacklists` | 管理员 | 黑名单列表 / 新增别名 |
| PUT | `/api/admin/blacklists/:id/release` | 管理员 | 解除限制别名 |
| DELETE | `/api/admin/blacklists/:id` | 管理员 | 删除黑名单记录 |

完整字段形状以 `src/utils/serialize.js` 为准，`item` / `claim` / `notification` 等序列化结果与前端 mock 字段一一对应。

数据分析接口除原有指标外，额外返回两组可直接渲染的数据：

```json
{
  "itemStatusStats": [
    { "status": "open", "name": "寻找中", "type": "primary", "value": 6, "percent": 50 },
    { "status": "claiming", "name": "认领中", "type": "warning", "value": 2, "percent": 17 },
    { "status": "done", "name": "已完成", "type": "success", "value": 3, "percent": 25 },
    { "status": "overdue", "name": "已关闭", "type": "info", "value": 1, "percent": 8 }
  ],
  "dailyTrend": [
    { "date": "2026-11-02", "items": 0, "claims": 0 },
    { "date": "2026-11-03", "items": 2, "claims": 1 }
  ]
}
```

- `itemStatusStats`：固定 4 个状态各一项，`value` 为数量，`percent` 为占全部物品的百分比（四舍五入）。
- `dailyTrend`：含今天在内最近 7 天，按日期升序；没有数据的日期补 `0`，图表不会断线。

### 手机号返回口径

`user` / `item` / `claim` / `verification` / `admin` 各端统一：

- 本人查看自己的资料、认领申请、实名认证时返回完整手机号；
- 其他用户、管理端列表（用户、认领、认证、黑名单）、交接记录等一律脱敏为 `138****1111` 形式；
- 已脱敏的历史数据原样返回，不会二次处理。

## 参数校验与限制

所有写接口在入库前做统一校验，脏数据直接返回 `422`，不会落库：

| 字段 | 规则 |
| --- | --- |
| `username` | 2-20 字符 |
| `email` | 合法邮箱格式，最长 254 |
| `password` | 6-32 位，且同时包含字母和数字（登录不校验强度） |
| `phone` | 选填；非空必须是 11 位大陆手机号 |
| `studentNo` | 选填；4-20 位字母或数字 |
| `name`（帖子） | 必填，1-60 字符 |
| `description` | 最长 1000 字符 |
| `location` / `contact` | 分别最长 100 字符 |
| `claimHint` / `proofText` | 最长 200 / 1000 字符 |
| `images` | 数组，单件最多 10 张，每项最长 300 字符 |
| 公告 `title` / `content` | 最长 100 / 5000 字符 |
| 审核备注 / 争议原因 | 最长 300 / 500 字符 |

分页：`page` 非法或 ≤0 回落为 1，超过 100000 裁剪为 100000；`page_size` 合法区间 1-100，默认 10。路径参数 `:id` 非法（如 `/items/abc`）统一返回 `404`，不会触发 500。

## 图片上传

```bash
curl -X POST http://127.0.0.1:4000/api/lost-found/items/1/images \
  -H "Authorization: Bearer <token>" \
  -F "images=@./demo.png"
```

- 只允许 `jpg / jpeg / png / gif / webp`，既校验扩展名与 `Content-Type`，也会读取文件头确认真实内容；
- 单张上限由 `MAX_UPLOAD_MB` 控制（默认 5MB），超限返回 `413`；伪造图片或非图片文件返回 `422`；
- 文件落在 `uploads/`，响应返回相对路径 `/uploads/xxx.png`；
- 通过 `http://127.0.0.1:4000/uploads/xxx.png` 直接访问，响应带 CORS 与 `Cross-Origin-Resource-Policy: cross-origin`。

## 切换 MySQL

1. 修改 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

2. 修改 `.env`：

```env
DATABASE_URL="mysql://root:password@127.0.0.1:3306/findu"
```

3. 重新生成并建表：

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

模型未使用 SQLite 专属类型（`images` 以 JSON 字符串存储），切换 provider 不需要改动任何模型字段。

## 测试

```bash
# 先启动服务
npm start

# 另开终端执行真实 HTTP 冒烟测试
npm run test:api
```

`tests/smoke.mjs` 共 **67 项**真实 HTTP 断言，覆盖：

- 全部业务端点：健康检查、分类、登录 / 注册、资料、列表筛选、详情、发布、图片上传与静态访问、管理员审核、认领提交 / 审核 / 交接、收藏、通知、实名认证、总览、滞留移交、公告、争议、黑名单拦截、数据分析（含状态分布与 7 日趋势）、下架、登出；
- 联调准备：`5173` / `5188` 端口的 CORS 预检、`/uploads` 跨域读取；
- 边界与异常：分页越界、`page_size` 超限、非法 `page`、非法 id、已下架帖子再操作、重复认领、认领自己的帖子、重复移交、无 token / 非法 token；
- 权限矩阵：学生访问 12 个管理端接口全部 `403`，修改 / 删除他人帖子、上传他人帖子图片、标记他人通知均 `403`；
- 手机号口径：本人资料 / 认领 / 认证返回完整号码，管理端用户 / 认领 / 认证列表与交接记录全部脱敏；
- 输入校验：邮箱格式、密码强度、用户名长度、手机号、学号、头像长度、帖子必填与长度、非法分类、非法状态、伪造图片、超限图片。

测试默认连接 `http://127.0.0.1:4000`，可用环境变量指向其它实例：

```bash
# 建议用独立的临时库跑测试，避免污染开发数据
DATABASE_URL="file:C:/temp/findu-test.db" npx prisma migrate deploy
DATABASE_URL="file:C:/temp/findu-test.db" npm run db:seed
DATABASE_URL="file:C:/temp/findu-test.db" PORT=4100 npm start
API_BASE=http://127.0.0.1:4100 npm run test:api
```

## 常见问题

- **`npm install` 报 `EPERM: operation not permitted, mkdir ...node_modules`**：个别 Windows 环境会对项目所在盘符限制 npm 创建目录。可先在其他可写目录安装后把 `node_modules` 复制过来，或把项目放到用户目录下再安装；依赖装好后 `npm start` 不受影响。
- **启动报数据库表不存在**：先执行 `npm run db:migrate`（或 `npm run db:deploy`）再启动。
- **前端请求被浏览器拦截**：确认 `.env` 的 `CORS_ORIGINS` 为 `*`，或把前端实际地址加入白名单后重启服务。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm start` | 生产式启动 |
| `npm run dev` | 监听文件变更启动 |
| `npm run db:migrate` | 创建 / 应用迁移（开发） |
| `npm run db:deploy` | 应用已有迁移（生产） |
| `npm run db:push` | 不生成迁移，直接同步表结构 |
| `npm run db:seed` | 写入种子数据 |
| `npm run db:reset` | 重置数据库、重新迁移并写入种子数据（会清空数据） |
| `npm run test:api` | 真实 HTTP 接口冒烟测试 |
