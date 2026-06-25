import type { AdminListParams } from '@/features/admin/types'

const defaultPageSize = 20
const maxPageSize = 50

export function parseAdminListParams(params: Record<string, string | string[] | undefined>): AdminListParams{
  const rawPage = Number(Array.isArray(params.page) ? params.page[0] : params.page)
  const rawPageSize = Number(Array.isArray(params.pageSize) ? params.pageSize[0] : params.pageSize)

  return {
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1,
    pageSize: Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.min(Math.floor(rawPageSize), maxPageSize) : defaultPageSize,
    search: typeof params.search === 'string' ? params.search.trim().slice(0, 80) : undefined,
    status: typeof params.status === 'string' ? params.status.trim().slice(0, 40) : undefined,
  }
}

export function paginationRange(params: AdminListParams){
  const from = (params.page - 1) * params.pageSize
  return { from, to: from + params.pageSize - 1 }
}
