import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HelpSupportSectionProps {
  user?: unknown | undefined;
}

const HelpSupportSection = ({ user }: HelpSupportSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Help & Support</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <p className='text-sm text-muted-foreground'>
            Need help? Contact our support team for assistance.
          </p>
          <button className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90'>
            Contact Support
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HelpSupportSection;
