import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ServiceMetric {
  name: string;
  responseTime: string;
  errorRate: string;
}

interface ServiceMetricsTableProps {
  services?: ServiceMetric[] | undefined;
  metrics?: any | undefined;
}

export function ServiceMetricsTable({ services }: ServiceMetricsTableProps) {
  const mockServices: ServiceMetric[] = services || [
    { name: 'API', responseTime: '150ms', errorRate: '0.1%' },
    { name: 'Database', responseTime: '50ms', errorRate: '0.05%' },
  ];

  return (
    <Card className='p-4'>
      <h3 className='text-lg font-semibold mb-4'>Service Metrics</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Response Time</TableHead>
            <TableHead>Error Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockServices.map((service, index) => (
            <TableRow key={index}>
              <TableCell>{service.name}</TableCell>
              <TableCell>{service.responseTime}</TableCell>
              <TableCell>{service.errorRate}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
