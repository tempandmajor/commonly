import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardHeader = () => {
  const navigate = useNavigate();

  return (
    <div className='flex flex-col md:flex-row justify-between md:items-center gap-4'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Your Promotions</h2>
        <p className='text-muted-foreground'>Manage and track your promotional campaigns</p>
      </div>
      <Button onClick={() => navigate('/create-promotion')}>
        <Plus className='mr-2 h-4 w-4' />
        Create Promotion
      </Button>
    </div>
  );
};

export default DashboardHeader;
