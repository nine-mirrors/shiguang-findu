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
- `/api/lost-found/items`
- `/api/my/lost-found/items`
- `/api/claims`
- `/api/my/claims`
- `/api/notifications`
- `/api/favorites`
- `/api/verifications`

## 5. 接口启用策略

当前全部走 mock。Laravel 完成后，在 `src/api/lostFound.js` 中启用：

```js
// import request from './request'
```

然后逐个替换 mock 函数体。
