import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Save } from 'lucide-react';

interface EventFormDraftProps {
  hasDraft: boolean;
  handleClearDraft: () => void;
  lastSaved?: Date | undefined| null;
}

const EventFormDraft = ({ hasDraft, handleClearDraft, lastSaved }: EventFormDraftProps) => {
  if (!hasDraft) return null;

  return (
    <>
      <Button variant='outline' onClick={handleClearDraft} className='whitespace-nowrap'>
        <Save className='mr-2 h-4 w-4' />
        Clear Draft
      </Button>

      <Card className='mb-6 bg-blue-50 border-blue-200'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div>
            <h3 className='text-blue-700 font-medium'>Draft Restored</h3>
            <p className='text-sm text-blue-600'>
              We've restored your previously saved draft. You can continue editing or clear it to
              start fresh.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default EventFormDraft;
