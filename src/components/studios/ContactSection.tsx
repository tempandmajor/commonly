import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ContactSection = () => {
  return (
    <section className='bg-black py-20 text-white'>
      <div className='container mx-auto px-4 text-center'>
        <h2 className='text-4xl font-bold'>Work With Us</h2>
        <p className='mx-auto mt-4 max-w-2xl text-white/70'>
          Have a project in mind or a story to tell? We're always looking for new collaborations and
          creative partnerships.
        </p>
        <Link to='/contact'>
          <Button className='mt-8 bg-white text-black hover:bg-white/90'>Contact Us</Button>
        </Link>
      </div>
    </section>
  );
};

export default ContactSection;
