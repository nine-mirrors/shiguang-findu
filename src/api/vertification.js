import request from './request'

/**
 * 第二优先级：获取我的实名认证状态
 * 文档接口：GET /api/my/verification
 *
 * 用途：
 * - 用户进入实名认证页时，查看当前认证状态
 * - 展示 basic / full / pending / approved / rejected 等状态
 *
 * 当前策略：
 * - 页面可以保留
 * - 不作为第一阶段主流程入口
 * - 不阻塞发布、认领、收藏、通知等第一优先级功能
 */
export const getMyVerificationApi = () => {
  return request.get('/api/my/verification')
}

/**
 * 第二优先级：提交实名认证申请
 * 文档接口：POST /api/verifications
 *
 * 用途：
 * - 用户提交基础认证或完整认证申请
 * - 后续用于贵重物品认领、邮寄领取、争议处理等增强场景
 *
 * 请求字段：
 * - level：basic / full
 * - real_name：真实姓名
 * - student_no：学号 / 工号
 * - phone：手机号
 * - id_card_last4：证件后四位，完整认证时可用
 *
 * 当前策略：
 * - 先封装接口
 * - 页面保留
 * - 后端如果第一阶段时间紧，可以暂缓实现
 */
export const submitVerificationApi = data => {
  return request.post('/api/verifications', {
    level: data.level,
    real_name: data.realName,
    student_no: data.studentNo,
    phone: data.phone,
    id_card_last4: data.idCardLast4 || ''
  })
}