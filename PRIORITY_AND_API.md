# FindU 校园失物招领平台 - 接口设计文档 V2.1

## 1. 文档说明

本文档基于《FindU 校园失物招领平台需求文档 V2.1》编写，详细定义了前后端交互接口。

### 1.1 接口风格

- RESTful API 设计
- 请求/响应使用 JSON 格式
- 认证使用 Bearer Token（Laravel Sanctum）
- 状态码遵循 HTTP 标准

### 1.2 隐私脱敏方案

#### 前端职责
前端负责展示层的脱敏处理：
- **手机号脱敏**：`138****5678`
- **邮箱脱敏**：`li***@example.com`
- **地址不展示**：仅后台和工作人员可见

#### 后端职责
后端负责数据访问层的脱敏：
- **证明照片**：仅管理员可见，普通用户无法访问
- **证件信息**：不返回给前端
- **详细地址**：不返回给前端

#### 脱敏实现
```
前端展示：使用 maskPhone()、maskEmail() 函数处理
后端存储：敏感字段加密存储
API返回：完整数据由前端处理脱敏
```

---

## 2. 用户认证

### 2.1 注册

```
POST /api/auth/register
Content-Type: application/json

请求体：
{
  "username": "张三",
  "email": "zhangsan@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "email_code": "123456"
}

响应（200）：
{
  "message": "注册成功",
  "user": {
    "id": 1,
    "username": "张三",
    "email": "zhangsan@example.com",
    "role": "user",
    "verification_level": "none"
  },
  "token": "1|abc123..."
}

响应（422）：
{
  "message": "注册信息有误",
  "errors": {
    "email": ["该邮箱已被注册"],
    "email_code": ["验证码错误"]
  }
}
```

### 2.2 登录

```
POST /api/auth/login
Content-Type: application/json

请求体：
{
  "email": "zhangsan@example.com",
  "password": "password123"
}

响应（200）：
{
  "message": "登录成功",
  "user": {
    "id": 1,
    "username": "张三",
    "email": "zhangsan@example.com",
    "role": "user",
    "verification_level": "basic"
  },
  "token": "2|abc123..."
}

响应（401）：
{
  "message": "账号或密码错误"
}
```

### 2.3 发送邮箱验证码

```
POST /api/auth/send-email-code
Content-Type: application/json

请求体：
{
  "email": "zhangsan@example.com",
  "type": "register"  // register | forget_password
}

响应（200）：
{
  "message": "验证码已发送",
  "expires_in": 900  // 15分钟
}
```

### 2.4 忘记密码

```
POST /api/auth/reset-password
Content-Type: application/json

请求体：
{
  "email": "zhangsan@example.com",
  "code": "123456",
  "password": "newPassword123",
  "password_confirmation": "newPassword123"
}

响应（200）：
{
  "message": "密码重置成功"
}

响应（422）：
{
  "message": "验证码错误或已过期"
}
```

### 2.5 退出登录

```
POST /api/auth/logout
Authorization: Bearer {token}

响应（200）：
{
  "message": "已退出登录"
}
```

### 2.6 获取个人信息

```
GET /api/user/profile
Authorization: Bearer {token}

响应（200）：
{
  "user": {
    "id": 1,
    "username": "张三",
    "email": "zhangsan@example.com",
    "phone": "13812345678",
    "avatar": "https://example.com/avatar.jpg",
    "role": "user",
    "verification_level": "basic",
    "created_at": "2024-01-01 10:00:00"
  }
}
```

### 2.7 修改个人信息

```
PUT /api/user/profile
Authorization: Bearer {token}
Content-Type: application/json

请求体：
{
  "username": "张三",
  "phone": "13812345678",
  "avatar": "https://example.com/new-avatar.jpg"
}

响应（200）：
{
  "message": "个人信息已更新",
  "user": {
    "id": 1,
    "username": "张三",
    "phone": "13812345678",
    "avatar": "https://example.com/new-avatar.jpg"
  }
}
```

---

## 3. 失物招领

### 3.1 获取物品列表

```
GET /api/lost-found/items
Query Parameters：
- page: 页码（默认1）
- page_size: 每页数量（默认12）
- keyword: 关键词搜索
- type: 失物类型（lost | found | all，默认all）
- category_id: 分类ID
- location: 地点
- status: 状态（open | claiming | completed | closed | all，默认open）
- has_photo: 是否有照片（1 | 0 | all，默认all）

响应（200）：
{
  "data": [
    {
      "id": 1,
      "type": "lost",
      "name": "校园卡",
      "category": {
        "id": 1,
        "name": "校园卡"
      },
      "location": "图书馆三楼",
      "happen_time": "2024-01-15 14:30:00",
      "description": "蓝色校园卡，卡号尾号2024",
      "contact": "138****5678",  // 已脱敏
      "image": "https://example.com/image.jpg",  // 第一张图片
      "images": [
        {
          "id": 1,
          "url": "https://example.com/image1.jpg"
        }
      ],
      "visibility": "public",
      "is_valuable": false,
      "status": "open",
      "audit_status": "approved",
      "user": {
        "id": 1,
        "username": "张三"
      },
      "created_at": "2024-01-15 14:30:00"
    }
  ],
  "total": 100,
  "per_page": 12,
  "current_page": 1
}
```

### 3.2 获取物品详情

```
GET /api/lost-found/items/{id}

响应（200）：
{
  "data": {
    "id": 1,
    "type": "lost",
    "name": "校园卡",
    "category": {
      "id": 1,
      "name": "校园卡"
    },
    "location": "图书馆三楼",
    "happen_time": "2024-01-15 14:30:00",
    "description": "蓝色校园卡，卡号尾号2024",
    "contact": "138****5678",  // 已脱敏
    "images": [
      {
        "id": 1,
        "url": "https://example.com/image1.jpg"
      }
    ],
    "visibility": "public",
    "is_valuable": false,
    "status": "open",
    "audit_status": "approved",
    "status_timeline": [
      {
        "status": "published",
        "time": "2024-01-15 14:30:00",
        "description": "信息已发布"
      },
      {
        "status": "approved",
        "time": "2024-01-15 15:00:00",
        "description": "审核通过"
      }
    ],
    "user": {
      "id": 1,
      "username": "张三",
      "avatar": "https://example.com/avatar.jpg"
    },
    "created_at": "2024-01-15 14:30:00",
    "similar_items": [
      {
        "id": 2,
        "name": "校园卡",
        "type": "found",
        "match_score": 85,
        "match_reasons": ["分类一致", "地点相同"]
      }
    ]
  }
}
```

### 3.3 发布物品

```
POST /api/lost-found/items
Authorization: Bearer {token}
Content-Type: application/json

请求体：
{
  "type": "lost",
  "name": "校园卡",
  "category_id": 1,
  "location": "图书馆三楼",
  "happen_time": "2024-01-15 14:30:00",
  "description": "蓝色校园卡，卡号尾号2024",
  "contact": "13812345678",
  "visibility": "public",
  "is_valuable": false
}

响应（201）：
{
  "message": "发布成功，等待审核",
  "item": {
    "id": 1,
    "status": "pending",
    "audit_status": "pending"
  }
}

响应（422）：
{
  "message": "表单验证失败",
  "errors": {
    "name": ["物品名称不能为空"],
    "category_id": ["请选择分类"]
  }
}
```

### 3.4 编辑物品

```
PUT /api/lost-found/items/{id}
Authorization: Bearer {token}
Content-Type: application/json

请求体：
{
  "name": "校园卡",
  "category_id": 1,
  "location": "图书馆三楼",
  "happen_time": "2024-01-15 14:30:00",
  "description": "蓝色校园卡，卡号尾号2024",
  "contact": "13812345678",
  "visibility": "public",
  "is_valuable": false
}

响应（200）：
{
  "message": "物品信息已更新",
  "item": {
    "id": 1,
    "status": "pending",
    "audit_status": "pending",
    "updated_at": "2024-01-15 16:00:00"
  }
}

业务规则：
- 仅发布人或管理员可以编辑
- 仅在物品状态为 pending 或 rejected 时可编辑
- 编辑后物品状态重置为 pending，需重新审核
```

### 3.5 删除物品

```
DELETE /api/lost-found/items/{id}
Authorization: Bearer {token}

响应（200）：
{
  "message": "物品已删除"
}
```

### 3.6 修改物品状态

```
PUT /api/lost-found/items/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

请求体：
{
  "status": "completed"  // claiming | completed | closed
}

响应（200）：
{
  "message": "状态已更新",
  "item": {
    "id": 1,
    "status": "completed"
  }
}
```

### 3.7 上传物品图片

```
POST /api/lost-found/items/{id}/images
Authorization: Bearer {token}
Content-Type: multipart/form-data

请求体：
- images[]: File (支持多图，最多3张)
- images[]: File
- images[]: File

响应（200）：
{
  "message": "图片上传成功",
  "images": [
    {
      "id": 1,
      "url": "https://example.com/storage/items/1_1705312800.jpg"
    },
    {
      "id": 2,
      "url": "https://example.com/storage/items/1_1705312900.jpg"
    }
  ]
}

注意：
- 图片上传到服务器本地或云存储
- 返回的URL由后端生成
- 前端不需要处理OSS
```

### 3.8 删除物品图片

```
DELETE /api/lost-found/items/{id}/images/{imageId}
Authorization: Bearer {token}

响应（200）：
{
  "message": "图片已删除"
}
```

### 3.9 获取我的发布

```
GET /api/my/lost-found/items
Authorization: Bearer {token}
Query Parameters：
- page: 页码
- page_size: 每页数量
- status: 筛选状态

响应（200）：
{
  "data": [
    {
      "id": 1,
      "type": "lost",
      "name": "校园卡",
      "status": "pending",
      "audit_status": "pending",
      "reject_reason": null,
      "created_at": "2024-01-15 14:30:00",
      "claims_count": 0
    }
  ],
  "total": 5,
  "per_page": 12,
  "current_page": 1
}
```

---

## 4. 认领申请

### 4.1 提交认领申请

```
POST /api/claims
Authorization: Bearer {token}
Content-Type: application/json

请求体：
{
  "item_id": 1,
  "claim_type": "claim",  // claim | clue | wrong_return
  "proof_text": "这是我丢失的校园卡，卡号后四位是2024",
  "proof_images": [],  // 可选，证明照片
  "pickup_method": "offline",  // offline | delivery
  "phone": "13812345678",
  "delivery_address": "",  // 邮寄时必填
  "remark": ""  // 可选
}

响应（201）：
{
  "message": "认领申请已提交",
  "claim": {
    "id": 1,
    "status": "pending",
    "match_score": 85
  }
}
```

### 4.2 获取我的认领申请

```
GET /api/my/claims
Authorization: Bearer {token}
Query Parameters：
- page: 页码
- status: 筛选状态

响应（200）：
{
  "data": [
    {
      "id": 1,
      "item": {
        "id": 1,
        "name": "校园卡",
        "type": "lost",
        "image": "https://example.com/image.jpg"
      },
      "claim_type": "claim",
      "pickup_method": "offline",
      "status": "approved",
      "match_score": 85,
      "created_at": "2024-01-15 14:30:00"
    }
  ],
  "total": 3,
  "per_page": 12
}
```

### 4.3 获取认领申请详情

```
GET /api/claims/{id}
Authorization: Bearer {token}

响应（200）：
{
  "data": {
    "id": 1,
    "item": {
      "id": 1,
      "name": "校园卡",
      "location": "图书馆三楼",
      "contact": "13812345678"  // 仅发布人或管理员可见完整号码
    },
    "claim_type": "claim",
    "proof_text": "这是我丢失的校园卡，卡号后四位是2024",
    "proof_images": [],  // 仅管理员可见
    "pickup_method": "offline",
    "phone": "138****5678",
    "delivery_address": "",
    "status": "approved",
    "audit_reason": "核验通过",
    "match_score": 85,
    "created_at": "2024-01-15 14:30:00"
  }
}
```

### 4.4 更新交接状态

```
PUT /api/claims/{id}/handover
Authorization: Bearer {token}
Content-Type: application/json

请求体：
{
  "status": "completed"  // handover_pending | completed
}

响应（200）：
{
  "message": "交接状态已更新",
  "claim": {
    "id": 1,
    "status": "completed"
  }
}
```

---

## 5. 通知中心

### 5.1 获取通知列表

```
GET /api/notifications
Authorization: Bearer {token}
Query Parameters：
- page: 页码
- is_read: 已读筛选（1 | 0 | all）

响应（200）：
{
  "data": [
    {
      "id": 1,
      "title": "您的发布已审核通过",
      "content": "您发布的【校园卡】已审核通过，现在可以在失物大厅查看。",
      "type": "audit_result",
      "target_type": "item",
      "target_id": 1,
      "is_read": false,
      "created_at": "2024-01-15 15:00:00"
    }
  ],
  "total": 10,
  "unread_count": 3,
  "per_page": 20
}
```

### 5.2 标记单条已读

```
PUT /api/notifications/{id}/read
Authorization: Bearer {token}

响应（200）：
{
  "message": "已标记为已读"
}
```

### 5.3 全部标记已读

```
PUT /api/notifications/read-all
Authorization: Bearer {token}

响应（200）：
{
  "message": "全部已标记为已读"
}
```

---

## 6. 收藏夹

### 6.1 获取收藏列表

```
GET /api/favorites
Authorization: Bearer {token}
Query Parameters：
- page: 页码

响应（200）：
{
  "data": [
    {
      "id": 1,
      "item": {
        "id": 1,
        "type": "lost",
        "name": "校园卡",
        "location": "图书馆三楼",
        "image": "https://example.com/image.jpg",
        "status": "open"
      },
      "created_at": "2024-01-15 14:30:00"
    }
  ],
  "total": 5,
  "per_page": 12
}
```

### 6.2 添加收藏

```
POST /api/favorites
Authorization: Bearer {token}
Content-Type: application/json

请求体：
{
  "item_id": 1
}

响应（201）：
{
  "message": "已添加收藏"
}
```

### 6.3 取消收藏

```
DELETE /api/favorites/{item_id}
Authorization: Bearer {token}

响应（200）：
{
  "message": "已取消收藏"
}
```

---

## 7. 分类管理

### 7.1 获取分类列表

```
GET /api/categories

响应（200）：
{
  "data": [
    {
      "id": 1,
      "name": "校园卡",
      "icon": "card",
      "sort": 1
    },
    {
      "id": 2,
      "name": "钥匙",
      "icon": "key",
      "sort": 2
    }
  ]
}
```

---

## 8. 管理员接口

### 8.1 运营总览

```
GET /api/admin/dashboard
Authorization: Bearer {token}
Role Required: admin

响应（200）：
{
  "stats": {
    "total_items": 100,
    "pending_items": 15,
    "total_claims": 50,
    "pending_claims": 8,
    "total_users": 200,
    "today_items": 5
  },
  "todos": {
    "pending_items": 15,
    "pending_claims": 8,
    "pending_verifications": 3
  },
  "hot_locations": [
    {"name": "图书馆", "count": 25},
    {"name": "教学楼", "count": 18}
  ],
  "recent_overdue": []
}
```

### 8.2 内容审核 - 获取列表

```
GET /api/admin/lost-found/items
Authorization: Bearer {token}
Role Required: admin
Query Parameters：
- page: 页码
- audit_status: 审核状态（pending | approved | rejected | all）
- type: 物品类型（lost | found | all）
- category_id: 分类ID

响应（200）：
{
  "data": [
    {
      "id": 1,
      "type": "lost",
      "name": "校园卡",
      "category": {"id": 1, "name": "校园卡"},
      "location": "图书馆三楼",
      "happen_time": "2024-01-15 14:30:00",
      "description": "蓝色校园卡，卡号尾号2024",
      "contact": "13812345678",  // 管理员可见完整号码
      "images": [],
      "is_valuable": false,
      "status": "open",
      "audit_status": "pending",
      "reject_reason": null,
      "user": {
        "id": 1,
        "username": "张三",
        "phone": "13812345678"  // 管理员可见
      },
      "created_at": "2024-01-15 14:30:00"
    }
  ],
  "total": 50,
  "per_page": 20
}
```

### 8.3 内容审核 - 审核操作

```
PUT /api/admin/lost-found/items/{id}/audit
Authorization: Bearer {token}
Role Required: admin
Content-Type: application/json

请求体：
{
  "action": "approve",  // approve | reject
  "audit_reason": "审核通过"  // 审核意见
}

响应（200）：
{
  "message": "审核完成",
  "item": {
    "id": 1,
    "audit_status": "approved"
  }
}
```

### 8.4 内容审核 - 删除物品

```
DELETE /api/admin/lost-found/items/{id}
Authorization: Bearer {token}
Role Required: admin

响应（200）：
{
  "message": "物品已删除"
}
```

### 8.5 认领审核 - 获取列表

```
GET /api/admin/claims
Authorization: Bearer {token}
Role Required: admin
Query Parameters：
- page: 页码
- status: 申请状态（pending | approved | rejected | handover_pending | completed | all）
- claim_type: 申请类型（claim | clue | wrong_return | all）

响应（200）：
{
  "data": [
    {
      "id": 1,
      "item": {
        "id": 1,
        "name": "校园卡",
        "type": "lost",
        "contact": "13812345678"  // 管理员可见完整号码
      },
      "user": {
        "id": 2,
        "username": "李四",
        "phone": "13912345678"
      },
      "claim_type": "claim",
      "proof_text": "这是我丢失的校园卡",
      "proof_images": [],  // 管理员可见
      "pickup_method": "offline",
      "phone": "139****5678",
      "delivery_address": "",
      "match_score": 85,
      "status": "pending",
      "created_at": "2024-01-15 14:30:00"
    }
  ],
  "total": 20,
  "per_page": 20
}
```

### 8.6 认领审核 - 审核操作

```
PUT /api/admin/claims/{id}/audit
Authorization: Bearer {token}
Role Required: admin
Content-Type: application/json

请求体：
{
  "action": "approve",  // approve | reject
  "audit_reason": "核验通过"  // 审核意见
}

响应（200）：
{
  "message": "审核完成",
  "claim": {
    "id": 1,
    "status": "approved"
  }
}
```

### 8.7 滞留物品 - 获取列表

```
GET /api/admin/overdue-items
Authorization: Bearer {token}
Role Required: admin
Query Parameters：
- page: 页码
- disposal_status: 处理状态

响应（200）：
{
  "data": [
    {
      "id": 1,
      "item": {
        "id": 1,
        "name": "校园卡",
        "type": "found"
      },
      "storage_code": "LF2024010001",
      "storage_location": "失物招领中心",
      "expire_at": "2024-02-15 14:30:00",
      "disposal_status": "normal",
      "created_at": "2024-01-15 14:30:00"
    }
  ],
  "total": 5
}
```

### 8.8 滞留物品 - 移交登记

```
PUT /api/admin/overdue-items/{id}/transfer
Authorization: Bearer {token}
Role Required: admin
Content-Type: application/json

请求体：
{
  "handover_target": "保卫处",
  "handover_time": "2024-02-16 10:00:00",
  "remark": "物品移交登记"
}

响应（200）：
{
  "message": "移交登记完成",
  "record": {
    "id": 1,
    "disposal_status": "transferred",
    "handover_target": "保卫处"
  }
}
```

### 8.9 公告管理 - 获取列表

```
GET /api/announcements

响应（200）：
{
  "data": [
    {
      "id": 1,
      "title": "关于寒假期物招领安排的通知",
      "content": "...",
      "status": "published",
      "published_at": "2024-01-10 10:00:00",
      "created_at": "2024-01-10 09:00:00"
    }
  ]
}
```

### 8.10 公告管理 - 发布公告

```
POST /api/admin/announcements
Authorization: Bearer {token}
Role Required: admin
Content-Type: application/json

请求体：
{
  "title": "关于寒假期物招领安排的通知",
  "content": "...",
  "status": "published"
}

响应（201）：
{
  "message": "公告已发布",
  "announcement": {
    "id": 1,
    "title": "关于寒假期物招领安排的通知",
    "status": "published",
    "published_at": "2024-01-15 14:30:00"
  }
}
```

### 8.11 争议处理 - 获取列表

```
GET /api/admin/disputes
Authorization: Bearer {token}
Role Required: admin

响应（200）：
{
  "data": [
    {
      "id": 1,
      "item": {"id": 1, "name": "校园卡"},
      "claim": {"id": 1},
      "reason": "双方对物品归属有争议",
      "status": "pending",
      "created_at": "2024-01-15 14:30:00"
    }
  ]
}
```

### 8.12 争议处理 - 结案

```
PUT /api/admin/disputes/{id}/resolve
Authorization: Bearer {token}
Role Required: admin
Content-Type: application/json

请求体：
{
  "result": "维持原认领，物品归属确认",
  "remark": "经核实，物品归属无误"
}

响应（200）：
{
  "message": "争议已结案",
  "dispute": {
    "id": 1,
    "status": "resolved",
    "result": "维持原认领，物品归属确认"
  }
}
```

### 8.13 黑名单管理 - 获取列表

```
GET /api/admin/blacklists
Authorization: Bearer {token}
Role Required: admin

响应（200）：
{
  "data": [
    {
      "id": 1,
      "user": {
        "id": 10,
        "username": "恶意用户",
        "email": "bad@example.com"
      },
      "reason": "多次发布虚假信息",
      "limit_type": "publish",
      "status": "active",
      "created_at": "2024-01-15 14:30:00"
    }
  ]
}
```

### 8.14 黑名单管理 - 添加黑名单

```
POST /api/admin/blacklists
Authorization: Bearer {token}
Role Required: admin
Content-Type: application/json

请求体：
{
  "user_id": 10,
  "reason": "多次发布虚假信息",
  "limit_type": "publish"  // publish | claim | all
}

响应（201）：
{
  "message": "已加入黑名单",
  "blacklist": {
    "id": 1,
    "user_id": 10,
    "status": "active"
  }
}
```

### 8.15 黑名单管理 - 解除黑名单

```
DELETE /api/admin/blacklists/{id}
Authorization: Bearer {token}
Role Required: admin

响应（200）：
{
  "message": "已从黑名单移除"
}
```

### 8.16 数据分析

```
GET /api/admin/analytics
Authorization: Bearer {token}
Role Required: admin

响应（200）：
{
  "category_stats": [
    {"name": "校园卡", "count": 30},
    {"name": "钥匙", "count": 25}
  ],
  "location_stats": [
    {"name": "图书馆", "count": 40},
    {"name": "教学楼", "count": 30}
  ],
  "time_stats": {
    "labels": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
    "data": [12, 15, 10, 18, 20, 8, 5]
  },
  "success_rate": 75.5,
  "total_items": 200,
  "completed_items": 151,
  "active_users": 150,
  "period": "week"  // week | month | all
}
```

---

## 9. 实名认证

### 9.1 提交实名认证

```
POST /api/verifications
Authorization: Bearer {token}
Content-Type: application/json

请求体：
{
  "level": "basic",  // basic | full
  "real_name": "张三",
  "student_no": "2021001234",
  "phone": "13812345678",
  "id_card_last4": "1234",  // 完整认证时必填
  "id_card_image": ""  // 完整认证时必填，证件照片URL
}

响应（201）：
{
  "message": "认证申请已提交",
  "verification": {
    "id": 1,
    "level": "basic",
    "status": "pending"
  }
}
```

### 9.2 获取认证状态

```
GET /api/my/verification
Authorization: Bearer {token}

响应（200）：
{
  "verification": {
    "id": 1,
    "level": "basic",
    "status": "approved",
    "real_name": "张三",  // 脱敏显示为 张*
    "student_no": "2021001234",
    "created_at": "2024-01-10 10:00:00"
  }
}
```

### 9.3 管理员审核认证

```
PUT /api/admin/verifications/{id}/audit
Authorization: Bearer {token}
Role Required: admin
Content-Type: application/json

请求体：
{
  "action": "approve",  // approve | reject
  "reject_reason": ""  // 驳回时必填
}

响应（200）：
{
  "message": "审核完成",
  "verification": {
    "id": 1,
    "status": "approved"
  }
}
```

---

## 10. 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（未登录或Token过期） |
| 403 | 无权限（角色不允许） |
| 404 | 资源不存在 |
| 422 | 表单验证失败 |
| 500 | 服务器内部错误 |

---

## 11. 邮箱推送场景

后端需要实现以下邮箱推送：

| 场景 | 触发时机 | 内容 |
|------|---------|------|
| 注册验证码 | 用户注册时 | 6位数字验证码，15分钟有效 |
| 密码重置 | 用户忘记密码时 | 重置链接或验证码 |
| 发布审核结果 | 管理员审核后 | 通过/驳回通知 |
| 认领审核结果 | 管理员审核后 | 通过/驳回通知 |
| 认领状态变更 | 状态变化时 | 交接提醒等 |
| 匹配提醒 | 系统匹配到物品时 | 相似物品提醒 |

注意：
- 邮件仅作为提醒，详细内容需登录平台查看
- 邮件中不展示完整手机号、地址、证件号
- 使用 Laravel Notification + Queue 实现异步发送
