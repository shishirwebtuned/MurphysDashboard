import React from 'react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null

  const pages = [] as number[]
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)

  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-between space-x-4 mt-4">
      <Button
        className="px-3 py-1 rounded border"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Prev
      </Button>

      <div className="flex gap-2">
        {start > 1 && (
          <Button className="px-3 py-1 rounded border" onClick={() => onPageChange(1)}>1</Button>
        )}
        {start > 2 && <span className="px-2">...</span>}
        {pages.map((p) => (
          <Button
            key={p}
            className={`px-3 py-1 rounded border  ${p === page ? 'bg-black cursor-not-allowed disabled' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}
        {end < totalPages - 1 && <span className="px-2">...</span>}
        {end < totalPages && (
          <Button className="px-3 py-1 rounded border" onClick={() => onPageChange(totalPages)}>{totalPages}</Button>
        )}
      </div>

      <Button
        className="px-3 py-1 rounded border"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Next
      </Button>
    </div>
  )
}

export default Pagination
