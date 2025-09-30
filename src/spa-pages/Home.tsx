import { Link } from 'react-router-dom';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Home = () => {
  return (
    <div className='flex min-h-screen flex-col'>
      <SimpleHeader />

      <main className='flex-1'>
        {/* Hero Section */}
        <section className='py-24 md:py-32 bg-gradient-to-b from-primary/5 to-transparent'>
          <div className='container px-4'>
            <div className='max-w-3xl'>
              <h1 className='text-4xl md:text-6xl font-bold tracking-tight mb-6'>
                Connect, Create, and Collaborate
              </h1>
              <p className='text-xl text-muted-foreground mb-8'>
                The all-in-one platform for creators, event organizers, and communities. Discover
                events, join communities, create content, and build your audience.
              </p>
              <div className='flex flex-wrap gap-4'>
                <Link to='/explore'>
                  <Button size='lg'>Explore Events</Button>
                </Link>
                <Link to='/communities'>
                  <Button size='lg' variant='outline'>
                    Join Communities
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className='py-16 container px-4'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold mb-4'>Everything You Need to Succeed</h2>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
              From hosting events to building communities, we provide the tools to help you grow.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <Card>
              <CardContent className='p-6 text-center'>
                <div className='bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto'>
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='text-primary'
                  >
                    <rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect>
                    <line x1='16' y1='2' x2='16' y2='6'></line>
                    <line x1='8' y1='2' x2='8' y2='6'></line>
                    <line x1='3' y1='10' x2='21' y2='10'></line>
                  </svg>
                </div>
                <h3 className='text-xl font-bold mb-2'>Host Events</h3>
                <p className='text-muted-foreground'>
                  Create and manage events with built-in ticketing, crowdfunding, and promotion
                  tools.
                </p>
                <Link to='/create-event' className='inline-block mt-4'>
                  <Button variant='outline' size='sm'>
                    Create Event
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6 text-center'>
                <div className='bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto'>
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='text-primary'
                  >
                    <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'></path>
                    <circle cx='9' cy='7' r='4'></circle>
                    <path d='M23 21v-2a4 4 0 0 0-3-3.87'></path>
                    <path d='M16 3.13a4 4 0 0 1 0 7.75'></path>
                  </svg>
                </div>
                <h3 className='text-xl font-bold mb-2'>Build Communities</h3>
                <p className='text-muted-foreground'>
                  Connect with like-minded people and create thriving communities around your
                  interests.
                </p>
                <Link to='/communities' className='inline-block mt-4'>
                  <Button variant='outline' size='sm'>
                    Explore Communities
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6 text-center'>
                <div className='bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto'>
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='text-primary'
                  >
                    <path d='M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z'></path>
                    <path d='M19 10v2a7 7 0 0 1-14 0v-2'></path>
                    <line x1='12' y1='19' x2='12' y2='23'></line>
                    <line x1='8' y1='23' x2='16' y2='23'></line>
                  </svg>
                </div>
                <h3 className='text-xl font-bold mb-2'>Create Content</h3>
                <p className='text-muted-foreground'>
                  Launch podcasts, sell products, and share your creativity with integrated
                  monetization.
                </p>
                <Link to='/create' className='inline-block mt-4'>
                  <Button variant='outline' size='sm'>
                    Start Creating
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className='py-16 bg-muted/30'>
          <div className='container px-4 text-center'>
            <h2 className='text-3xl font-bold mb-4'>Ready to Get Started?</h2>
            <p className='text-xl text-muted-foreground mb-8 max-w-2xl mx-auto'>
              Join thousands of creators, event organizers, and community builders who are already
              using our platform.
            </p>
            <div className='flex flex-wrap gap-4 justify-center'>
              <Link to='/auth?mode=register'>
                <Button size='lg'>Sign Up Free</Button>
              </Link>
              <Link to='/explore'>
                <Button size='lg' variant='outline'>
                  Browse Events
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
