/**
 * 认领凭证的跨页临时传递
 *
 * 详情页的「认领比对」允许先选图（得到 File 对象），再跳转到认领页。
 * File 不能塞进 URL query，而 blob: 预览地址提交给后端必然失效，
 * 因此用模块级变量在同一个 SPA 会话内传递，认领页取出后立即清空。
 */
let pendingProofFiles = []

export function setClaimProofFiles(files) {
  pendingProofFiles = Array.isArray(files) ? files.filter(file => file instanceof File) : []
}

export function takeClaimProofFiles() {
  const files = pendingProofFiles
  pendingProofFiles = []
  return files
}
