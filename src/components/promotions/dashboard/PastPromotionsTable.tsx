import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EyeIcon } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PromotionSettings } from '@/lib/types/promotion';

export interface PastPromotionsTableProps {
  promotions: PromotionSettings[];
  onSelectPromotion: (promotion: PromotionSettings) => void;
  getStatusBadge?: (status: string) => React.ReactNode | undefined;
}

const PastPromotionsTable: React.FC<PastPromotionsTableProps> = ({
  promotions,
  onSelectPromotion,
  getStatusBadge = status => {
    switch (status) {
      case 'completed':
        return <Badge variant='secondary'>Completed</Badge>;
      case 'rejected':
        return <Badge variant='destructive'>Rejected</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  },
}) => {
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {promotions.length > 0 ? (
            promotions.map(promotion => (
              <TableRow key={promotion.id}>
                <TableCell className='font-medium'>{promotion.title}</TableCell>
                <TableCell>
                  {promotion.type.charAt(0).toUpperCase() + promotion.type.slice(1)}
                </TableCell>
                <TableCell>{formatCurrency(promotion.budget)}</TableCell>
                <TableCell>{formatDate(new Date(promotion.startDate))}</TableCell>
                <TableCell>
                  {promotion.endDate ? formatDate(new Date(promotion.endDate)) : 'Ongoing'}
                </TableCell>
                <TableCell>{getStatusBadge(promotion.status)}</TableCell>
                <TableCell className='text-right'>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => onSelectPromotion(promotion)}
                    className='h-8 w-8 p-0'
                  >
                    <EyeIcon className='h-4 w-4' />
                    <span className='sr-only'>View</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className='h-24 text-center'>
                No past promotions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PastPromotionsTable;
