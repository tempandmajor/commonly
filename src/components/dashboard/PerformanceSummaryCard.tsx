import { Card } from '@/components/ui/card';

interface Service {
  name: string;
}

interface Alert {
  length: number;
}

interface PerformanceSummaryCardProps {
  title: string;
  value: string;
  trend?: string | undefined;
  service?: Service | undefined;
  alerts?: Alert | undefined;
}

export function PerformanceSummaryCard({
  title,
  value,
  trend,
  service,
  alerts,
}: PerformanceSummaryCardProps) {
  return (
    <Card className='p-4'>
      <h3 className='text-sm font-medium text-muted-foreground'>{title}</h3>
      <p className='text-2xl font-bold'>{value}</p>
      {trend && <p className='text-xs text-muted-foreground'>{trend}</p>}
      {service && <p className='text-xs text-muted-foreground'>Service: {service.name}</p>}
      {alerts && <p className='text-xs text-red-500'>Alerts: {alerts.length}</p>}
    </Card>
  );
}
