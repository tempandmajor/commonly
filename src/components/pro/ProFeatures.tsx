import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

const ProFeatures = () => {
  return (
    <section className='py-16 bg-secondary/30'>
      <div className='container px-4'>
        <h2 className='text-3xl font-bold text-center mb-12'>
          Everything You Need to Create Amazing Podcasts
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <Card>
            <CardHeader>
              <CardTitle>Professional Recording</CardTitle>
              <CardDescription>Create studio-quality podcasts with our tools</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2'>
                <li className='flex items-start'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2 mt-0.5' />
                  <span>Record in HD (1080p) and Ultra HD (4K)</span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2 mt-0.5' />
                  <span>High-quality audio at up to 320kbps</span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2 mt-0.5' />
                  <span>Separate audio tracks for post-production</span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2 mt-0.5' />
                  <span>Live monitoring tools</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Features</CardTitle>
              <CardDescription>Tools for creating professional content</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2'>
                <li className='flex items-start'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2 mt-0.5' />
                  <span>Multi-person recordings with guests</span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2 mt-0.5' />
                  <span>Screen sharing during podcasts</span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2 mt-0.5' />
                  <span>Priority support</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribution & Growth</CardTitle>
              <CardDescription>Share and grow your audience</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2'>
                <li className='flex items-start'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2 mt-0.5' />
                  <span>Unlimited storage for your recordings</span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2 mt-0.5' />
                  <span>Detailed analytics and audience insights</span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2 mt-0.5' />
                  <span>Custom podcast RSS feed generation</span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2 mt-0.5' />
                  <span>Featured placement opportunities</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProFeatures;
