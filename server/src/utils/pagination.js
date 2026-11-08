const MAX_PAGE = 100000
const MAX_PAGE_SIZE = 100

export function getPagination(query = {}, defaultSize = 10) {
  const rawPage = Number.parseInt(query.page, 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.min(rawPage, MAX_PAGE) : 1

  const rawSize = Number.parseInt(
    query.page_size ?? query.pageSize ?? query.per_page ?? query.limit,
    10
  )
  const size = Number.isFinite(rawSize) && rawSize > 0 ? Math.min(MAX_PAGE_SIZE, rawSize) : defaultSize

  return { page, size, skip: (page - 1) * size, take: size }
}

export function paginated(list, total, page, size) {
  return {
    list,
    total,
    page,
    page_size: size,
    total_pages: size > 0 ? Math.ceil(total / size) : 0
  }
}

export function readBool(value) {
  if (value === true || value === 1) return true
  const text = String(value ?? '').toLowerCase()
  return text === '1' || text === 'true' || text === 'yes' || text === 'with'
}
