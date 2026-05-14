# 拾光 FindU V7：一二优先级实现说明与 Laravel 接口清单

## 1. 本版定位

本版保留失物招领平台主线，但修正管理员角色定位：

> 管理员是平台运营者，不是普通发布者。管理员只进入后台，负责审核、核验、公告、风控、滞留处理和数据分析。

## 2. 前端当前实现范围

### 第一优先级

| 模块 | 当前状态 |
|---|---|
| 登录注册 | mock 已实现，邮箱验证码接口已预留 |
| 首页 | 已实现品牌 Hero、搜索、统计、分类、最新协寻 |
| 失物大厅 | 已实现搜索、筛选、卡片、收藏 |
| 发布信息 | 已实现图片完整预览、中文时间选择、实时预览 |
| 详情页 | 已实现图片、脱敏、时间线、认领入口、相似推荐 |
| 认领申请 | 已实现 claim / clue / wrong_return，线下 / 邮寄方式 |
| 通知中心 | 已实现 mock |
| 收藏夹 | 已实现 mock |
| 管理员内容审核 | 已实现，支持通过、拒绝、疑似重复 |
| 管理员认领审核 | 已实现，支持匹配度、证明信息、通过 / 驳回 |
| 帮助 / 协议 | 已实现 |
| 管理员权限隔离 | 已实现，管理员不能进入普通用户区 |

### 第二优先级

| 模块 | 当前状态 |
|---|---|
| 分级实名认证 | 已实现管理端审核页面和用户提交页面 |
| 双重审核 | 字段与流程已预留 |
| 线下 / 邮寄领取 | 认领申请已支持 |
| 领错归还 | 认领申请类型已支持 |
| 交接留证 | 作为流程与接口预留 |
| 滞留物品处理 | 管理端已实现滞留列表和移交登记 |
| 公告发布 | 管理端已实现公告发布，生成通知 |
| 争议处理 | 管理端已实现争议列表和结案 |
| 黑名单管理 | 管理端已实现异常用户和加入黑名单 |
| 数据统计分析 | 管理端已实现热点地点、成功率、阶段分布 |

## 3. 管理端接口清单

### 运营总览

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/dashboard` | 获取后台统计、待办、滞留快照、热点地点 |
| GET | `/api/admin/todos` | 获取管理员待办队列，可选 |

### 内容审核

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/lost-found/items` | 获取全部发布信息 |
| PUT | `/api/admin/lost-found/items/{id}/audit` | 审核通过 / 驳回发布信息 |
| DELETE | `/api/admin/lost-found/items/{id}` | 删除违规信息 |

### 认领审核

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/claims` | 获取认领申请列表 |
| PUT | `/api/admin/claims/{id}/audit` | 审核认领、线索、领错归还申请 |
| PUT | `/api/claims/{id}/handover` | 更新交接状态 |

### 运营处理

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/overdue-items` | 获取滞留 / 保管物品 |
| PUT | `/api/admin/overdue-items/{id}/transfer` | 登记移交处理 |
| GET | `/api/announcements` | 获取公告列表 |
| POST | `/api/admin/announcements` | 发布公告 |
| GET | `/api/admin/disputes` | 获取争议列表 |
| PUT | `/api/admin/disputes/{id}/resolve` | 处理争议并结案 |

### 用户风控

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/verifications` | 获取实名认证申请 |
| PUT | `/api/admin/verifications/{id}/audit` | 审核实名认证 |
| GET | `/api/admin/users` | 获取用户风险概览 |
| GET | `/api/admin/blacklists` | 获取黑名单 |
| POST | `/api/admin/blacklists` | 添加黑名单 |

### 数据分析

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/analytics` | 获取热点地点、成功率、用户活跃、认领阶段数据 |

## 4. 普通用户接口仍保留

管理员后台增强不影响普通用户接口。普通用户仍使用：

- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/send-email-code` - 发送邮箱验证码（支持register/forget_password类型）
- `/api/auth/forget-password` - **新增**忘记密码重置
- `/api/auth/reset-password` - **新增**重置密码
- `/api/lost-found/items`
- `/api/lost-found/items/{id}` - **新增**编辑物品信息
- `/api/my/lost-found/items`
- `/api/claims`
- `/api/my/claims`
- `/api/notifications`
- `/api/favorites`
- `/api/verifications`

## 5. 新增接口（第一优先级扩展）

### 5.1 忘记密码

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/send-email-code` | 发送重置密码验证码（type=forget_password） |
| POST | `/api/auth/forget-password` | 验证验证码并发送重置链接 |
| POST | `/api/auth/reset-password` | 使用token重置新密码 |

#### 发送重置验证码

```
POST /api/auth/send-email-code
Content-Type: application/json

{
  "email": "user@example.com",
  "type": "forget_password"
}
```

响应：
```json
{
  "message": "验证码已发送到邮箱",
  "expires_in": 900
}
```

#### 验证并重置

```
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456",
  "password": "newPassword123",
  "password_confirmation": "newPassword123"
}
```

响应：
```json
{
  "message": "密码重置成功"
}
```

### 5.2 编辑物品信息

| 方法 | 路径 | 说明 |
|---|---|---|
| PUT | `/api/lost-found/items/{id}` | 编辑物品信息（仅发布人或管理员） |
| DELETE | `/api/lost-found/items/{id}/images/{imageId}` | **新增**删除物品图片 |

#### 编辑物品信息

```
PUT /api/lost-found/items/{id}
Content-Type: application/json

{
  "name": "校园卡",
  "category_id": 1,
  "location": "图书馆三楼",
  "happen_time": "2024-01-15 14:30:00",
  "description": "蓝色校园卡，卡号尾号2024",
  "contact": "138****1234",
  "visibility": "public",
  "is_valuable": false
}
```

**字段说明**：
- `name`: 物品名称
- `category_id`: 分类ID
- `location`: 地点
- `happen_time`: 丢失/拾取时间
- `description`: 详细描述
- `contact`: 联系方式
- `visibility`: 可见范围（public/matched/admin_only）
- `is_valuable`: 是否贵重物品

**业务规则**：
- 仅发布人或管理员可以编辑
- 仅在物品状态为`pending`（待审核）或`rejected`（已拒绝）时可编辑
- 编辑后物品状态重置为`pending`，需重新审核

响应：
```json
{
  "message": "物品信息已更新",
  "item": {
    "id": 1,
    "status": "pending",
    "updated_at": "2024-01-15 16:00:00"
  }
}
```

#### 删除物品图片

```
DELETE /api/lost-found/items/{id}/images/{imageId}
```

响应：
```json
{
  "message": "图片已删除"
}
```

### 5.3 图片上传（后端存储）

#### 上传流程

```
1. 前端上传图片文件到后端
2. 后端保存到服务器本地或云存储
3. 返回图片URL给前端
4. 前端将URL关联到物品
```

#### 接口定义

##### 上传物品图片

```
POST /api/lost-found/items/{id}/images
Content-Type: multipart/form-data

Body:
- images[]: File (支持多图，最多3张)
```

响应：
```json
{
  "message": "图片上传成功",
  "images": [
    {
      "id": 1,
      "url": "https://findu.example.com/storage/items/1_1705312800.jpg"
    }
  ]
}
```

#### 隐私脱敏（前端实现）

前端已完成联系方式脱敏：

```javascript
// Phone脱敏
function maskPhone(phone) {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// Email脱敏  
function maskEmail(email) {
  if (!email) return ''
  const [username, domain] = email.split('@')
  return username.slice(0, 2) + '***@' + domain
}
```

**使用场景**：
- 物品详情页：联系方式已脱敏
- 用户列表：邮箱、手机号已脱敏
- 认领申请：证明照片仅管理员可见

**后端建议**：
- API返回完整数据，前端负责脱敏展示
- 敏感字段（证明照片、证件号等）后端可限制访问

## 5. 接口启用策略

当前全部走 mock。Laravel 完成后，在 `src/api/lostFound.js` 中启用：

```js
// import request from './request'
```

然后逐个替换 mock 函数体。
