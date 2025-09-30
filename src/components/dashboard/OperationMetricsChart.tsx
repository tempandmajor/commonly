import { Card } from '@/components/ui/card';

interface OperationMetricsChartProps {
  operations?: unknown[] | undefined;
}

export function OperationMetricsChart({ operations }: OperationMetricsChartProps) {
  return (
    <Card className='p-4'>
      <h3 className='text-lg font-semibold mb-4'>Operation Metrics</h3>
      <div className='h-64 flex items-center justify-center text-muted-foreground'>
        Chart placeholder - metrics visualization would go here
        {operations && <p className='ml-2'>({operations.length} operations)</p>}
      </div>
    </Card>
  );
}
