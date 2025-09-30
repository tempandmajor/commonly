import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number | undefined;
  pageSize?: number | undefined;
  showSummary?: boolean | undefined;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  showSummary = true,
}: PaginationControlsProps) {
  const isMobile = useMediaQuery('(max-width: 640px)');

  // Calculate page info for summary if available
  const startIndex = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const endIndex = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;

  if (totalPages <= 1) return null;

  return (
    <div className='flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4'>
      {showSummary && startIndex !== null && endIndex !== null && (
        <div className='text-sm text-muted-foreground order-2 sm:order-1'>
          Showing {startIndex}-{endIndex} of {totalItems}
        </div>
      )}

      <div className='flex items-center gap-2 order-1 sm:order-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className='h-4 w-4 mr-1' />
          {!isMobile && <span>Previous</span>}
        </Button>

        {!isMobile && totalPages <= 7 && (
          <div className='flex items-center gap-1'>
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? 'default' : 'outline'}
                size='sm'
                className='w-9'
                onClick={() => onPageChange(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        )}

        {!isMobile && totalPages > 7 && (
          <div className='flex items-center gap-1'>
            {currentPage > 3 && (
              <>
                <Button variant='outline' size='sm' className='w-9' onClick={() => onPageChange(1)}>
                  1
                </Button>
                {currentPage > 4 && <span className='px-2 text-muted-foreground'>...</span>}
              </>
            )}

            {[...Array(5)].map((_, i) => {
              const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages));

              if (pageNum <= 0 || pageNum > totalPages) return null;

              if (i === 0 && pageNum > 2) return null;
              if (i === 4 && pageNum < totalPages - 1) return null;

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size='sm'
                  className='w-9'
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && (
                  <span className='px-2 text-muted-foreground'>...</span>
                )}
                <Button
                  variant='outline'
                  size='sm'
                  className='w-9'
                  onClick={() => onPageChange(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
        )}

        <div className='text-sm mx-2'>{isMobile && `${currentPage} / ${totalPages}`}</div>

        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          {!isMobile && <span>Next</span>}
          <ChevronRight className='h-4 w-4 ml-1' />
        </Button>
      </div>
    </div>
  );
}
