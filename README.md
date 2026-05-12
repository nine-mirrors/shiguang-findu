# 拾光 FindU V8 管理联动增强版

## 项目定位

**拾光 FindU 校园智能失物协寻平台**，面向校园失物招领场景，提供发布、搜索、收藏、认领申请、通知、隐私保护、后台审核、交接处理、滞留移交、公告、风控和数据分析等能力。

本版本重点修正：管理员端不能再作为普通用户发布信息；管理员只进入后台，负责平台运营管理。

## 技术栈

- Vue 3
- Vite
- Vue Router
- Pinia
- Axios
- Element Plus
- 自定义玻璃拟态组件
- 自定义线性 SVG 图标
- Laravel 接口预留
- 当前默认 mock 数据演示

## 启动方式

```bash
npm install
npm run dev
```

## 演示账号

### 学生账号

```text
student@example.com
123456
```

### 管理员账号

```text
admin@example.com
123456
```

## 管理员权限说明

管理员登录后会直接进入后台：

```text
/admin/dashboard
```

管理员不能访问普通用户页面：

```text
/home
/publish
/my-posts
/favorites
/notifications
/verification
```

如果管理员访问这些页面，会自动跳回后台。

## 管理端页面

| 页面 | 路由 | 说明 |
|---|---|---|
| 运营总览 | `/admin/dashboard` | 待办、统计、滞留、热点地点 |
| 审核中心 | `/admin/review` | 内容审核、认领核验 |
| 运营处理 | `/admin/operations` | 交接、公告、滞留移交、争议处理 |
| 用户风控 | `/admin/risk` | 实名认证、异常用户、黑名单 |
| 数据分析 | `/admin/analytics` | 热点区域、认领阶段、成功率 |

## 用户端页面

| 页面 | 路由 | 说明 |
|---|---|---|
| 首页 | `/home` | 品牌展示、搜索、统计、分类入口 |
| 失物大厅 | `/items` | 列表、筛选、搜索、收藏 |
| 物品详情 | `/items/:id` | 详情、图片、状态、认领入口 |
| 发布信息 | `/publish` | 发布失物/招领，多图预览 |
| 我的发布 | `/my-posts` | 管理自己的发布 |
| 我的认领 | `/my-claims` | 跳转到我的协寻中心认领页签 |
| 通知中心 | `/notifications` | 审核、认领、公告、匹配提醒 |
| 收藏夹 | `/favorites` | 收藏内容 |
| 帮助中心 | `/guide` | 使用说明、用户协议、隐私规则 |

## 联动流程

### 用户发布 → 管理员审核 → 前台展示

```text
用户发布信息
  ↓
进入待审核
  ↓
管理员在审核中心通过
  ↓
前台大厅展示
  ↓
用户通知中心收到审核结果
```

### 用户认领 → 管理员核验 → 运营交接 → 完成

```text
用户提交认领申请
  ↓
管理员审核通过
  ↓
进入运营处理的交接队列
  ↓
管理员登记线下/邮寄交接
  ↓
认领申请变为已完成
  ↓
物品状态同步变为已完成
```

### 管理员公告 → 用户通知

```text
管理员发布公告
  ↓
生成全员站内通知
  ↓
用户通知中心可查看
```

## Laravel 接口说明

主要接口预留在：

```text
src/api/lostFound.js
```

当前接口导入被注释：

```js
// import request from './request'
```

当前全部使用 mock 数据。后端完成后，将函数体替换为真实接口即可，例如：

```js
export async function fetchDashboard() {
  return request.get('/api/admin/dashboard')
}
```
