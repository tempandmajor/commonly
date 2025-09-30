import { Film, Link2, Building, PenTool } from 'lucide-react';

const ServicesSection = () => {
  return (
    <section className='py-20'>
      <div className='container mx-auto px-4'>
        <h2 className='mb-16 text-center text-4xl font-bold'>What We Do</h2>

        <div className='grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4'>
          <div className='text-center'>
            <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white'>
              <Film className='h-8 w-8' />
            </div>
            <h3 className='mb-4 text-xl font-bold'>Film Production</h3>
            <p className='text-[#2B2B2B]/70'>
              From independent features to blockbusters, we bring compelling stories to the big
              screen.
            </p>
          </div>

          <div className='text-center'>
            <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white'>
              <Building className='h-8 w-8' />
            </div>
            <h3 className='mb-4 text-xl font-bold'>Television</h3>
            <p className='text-[#2B2B2B]/70'>
              Award-winning series and limited runs that captivate audiences around the world.
            </p>
          </div>

          <div className='text-center'>
            <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white'>
              <Link2 className='h-8 w-8' />
            </div>
            <h3 className='mb-4 text-xl font-bold'>Digital Content</h3>
            <p className='text-[#2B2B2B]/70'>
              Innovative digital stories that engage audiences across platforms.
            </p>
          </div>

          <div className='text-center'>
            <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white'>
              <PenTool className='h-8 w-8' />
            </div>
            <h3 className='mb-4 text-xl font-bold'>Creative Development</h3>
            <p className='text-[#2B2B2B]/70'>
              We nurture stories from concept to screen with our experienced development team.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
