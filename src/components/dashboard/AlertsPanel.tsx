import { Card } from '@/components/ui/card';

interface AlertsPanelProps {
  alerts?: unknown[] | undefined;
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const alertCount = alerts?.length || 0;

  return (
    <Card className='p-4'>
      <h3 className='text-lg font-semibold mb-4'>Alerts</h3>
      {alertCount > 0 ? (
        <p className='text-muted-foreground'>{alertCount} active alerts</p>
      ) : (
        <p className='text-muted-foreground'>No active alerts</p>
      )}
    </Card>
  );
}
