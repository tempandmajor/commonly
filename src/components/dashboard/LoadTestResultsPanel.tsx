import { Card } from '@/components/ui/card';

interface LoadTestResultsPanelProps {
  loadTestResults?: unknown[] | undefined;
  onRunTest?: () => void | undefined;
}

export function LoadTestResultsPanel({ loadTestResults, onRunTest }: LoadTestResultsPanelProps) {
  const resultsCount = loadTestResults?.length || 0;

  return (
    <Card className='p-4'>
      <h3 className='text-lg font-semibold mb-4'>Load Test Results</h3>
      {resultsCount > 0 ? (
        <p className='text-muted-foreground'>{resultsCount} recent load tests</p>
      ) : (
        <p className='text-muted-foreground'>No recent load tests</p>
      )}
      {onRunTest && (
        <button
          onClick={onRunTest}
          className='mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          Run Test
        </button>
      )}
    </Card>
  );
}
