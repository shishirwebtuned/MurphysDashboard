import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null

  const pages = [] as number[]
  // Adjust range based on how many numbers you want to show
  const start = Math.max(1, page - 1)
  const end = Math.min(totalPages, page + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2">
        {/* First Page */}
        {start > 1 && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 w-9"
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {start > 2 && (
              <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            )}
          </>
        )}

        {/* Page Numbers */}
        {pages.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === page ? 'default' : 'outline'}
            className={`h-9 w-9 transition-all ${
              p === page ? 'pointer-events-none shadow-sm' : 'hover:bg-accent'
            }`}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        ))}

        {/* Last Page */}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 w-9"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default Pagination