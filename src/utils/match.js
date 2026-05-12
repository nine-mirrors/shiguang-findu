const same = (a, b) => String(a || '').trim() && String(a || '').trim() === String(b || '').trim()
const words = (text = '') => String(text).toLowerCase().split(/[\s,，。；;、/]+/).filter(Boolean)

export function calcMatchScore(target, candidate) {
  if (!target || !candidate || target.id === candidate.id || target.type === candidate.type) return 0
  let score = 0
  const reasons = []
  if (same(target.category, candidate.category)) { score += 28; reasons.push('分类一致') }
  if (same(target.location, candidate.location)) { score += 26; reasons.push('地点相同') }
  const targetText = `${target.name} ${target.description}`
  const candidateText = `${candidate.name} ${candidate.description}`
  const targetWords = words(targetText)
  const hit = targetWords.filter(word => word.length >= 2 && candidateText.toLowerCase().includes(word))
  if (hit.length) { score += Math.min(34, hit.length * 11); reasons.push(`关键词相似：${hit.slice(0, 3).join('、')}`) }
  const dayGap = Math.abs(new Date(target.happenTime) - new Date(candidate.happenTime)) / 86400000
  if (Number.isFinite(dayGap) && dayGap <= 2) { score += 12; reasons.push('时间接近') }
  return { score: Math.min(99, score), reasons }
}

export function findSimilarItems(target, items, limit = 3) {
  return items
    .map(item => ({ ...item, match: calcMatchScore(target, item) }))
    .filter(item => item.match && item.match.score >= 28)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit)
}
