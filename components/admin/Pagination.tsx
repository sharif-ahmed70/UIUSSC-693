import Link from 'next/link'

type PaginationProps = {
  page: number
  pageSize: number
  count: number
  basePath: string
}

export default function Pagination({ page, pageSize, count, basePath }: PaginationProps){
  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm" aria-label="Pagination">
      <p className="font-bold text-slate-600">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <Link aria-disabled={page <= 1} href={`${basePath}?page=${Math.max(1, page - 1)}`} className="rounded-md border border-slate-200 bg-white px-4 py-2 font-bold text-uiussc-charcoal aria-disabled:pointer-events-none aria-disabled:opacity-50">
          Previous
        </Link>
        <Link aria-disabled={page >= totalPages} href={`${basePath}?page=${Math.min(totalPages, page + 1)}`} className="rounded-md border border-slate-200 bg-white px-4 py-2 font-bold text-uiussc-charcoal aria-disabled:pointer-events-none aria-disabled:opacity-50">
          Next
        </Link>
      </div>
    </nav>
  )
}
