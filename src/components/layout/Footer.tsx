import { Link, useNavigate } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { getSocialLinks } from '@/utils/socialMediaLinks';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

const Footer = () => {
  const socialLinks = getSocialLinks();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateEventClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=/create');
      toast.info('Please sign in to create an event');
    } else {
      navigate('/create');
    }
  };

  return (
    <footer className='border-t bg-background'>
      <div className='container px-4 py-12 md:px-6'>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-5'>
          <div className='space-y-4'>
            <h3 className='text-xl font-bold'>commonly</h3>
            <p className='text-sm text-muted-foreground'>
              The community platform for creating and supporting events that matter.
            </p>
            <div className='flex space-x-4'>
              <a
                href={socialLinks.facebook}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground'
              >
                <Facebook className='h-5 w-5' />
                <span className='sr-only'>Facebook</span>
              </a>
              <a
                href={socialLinks.instagram}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground'
              >
                <Instagram className='h-5 w-5' />
                <span className='sr-only'>Instagram</span>
              </a>
              <a
                href={socialLinks.linkedin}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground'
              >
                <Linkedin className='h-5 w-5' />
                <span className='sr-only'>LinkedIn</span>
              </a>
              <a
                href={socialLinks.youtube}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground'
              >
                <Youtube className='h-5 w-5' />
                <span className='sr-only'>YouTube</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className='mb-4 font-medium'>Platform</h4>
            <ul className='space-y-2 text-sm'>
              <li>
                <Link to='/explore' className='text-muted-foreground hover:text-foreground'>
                  Explore Events
                </Link>
              </li>
              <li>
                <span
                  onClick={handleCreateEventClick}
                  className='text-muted-foreground hover:text-foreground cursor-pointer'
                >
                  Create Event
                </span>
              </li>
              <li>
                <Link to='/creator-program' className='text-muted-foreground hover:text-foreground'>
                  Creator Program
                </Link>
              </li>
              <li>
                <Link to='/for-creators' className='text-muted-foreground hover:text-foreground'>
                  For Creators
                </Link>
              </li>
              <li>
                <Link to='/for-sponsors' className='text-muted-foreground hover:text-foreground'>
                  For Sponsors
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='mb-4 font-medium'>Ventures</h4>
            <ul className='space-y-2 text-sm'>
            </ul>
          </div>

          <div>
            <h4 className='mb-4 font-medium'>Resources</h4>
            <ul className='space-y-2 text-sm'>
              <li>
                <Link to='/help-center' className='text-muted-foreground hover:text-foreground'>
                  Help Center
                </Link>
              </li>
              <li>
                <Link to='/blog' className='text-muted-foreground hover:text-foreground'>
                  Blog
                </Link>
              </li>
              <li>
                <Link to='/guidelines' className='text-muted-foreground hover:text-foreground'>
                  Guidelines
                </Link>
              </li>
              <li>
                <Link to='/careers' className='text-muted-foreground hover:text-foreground'>
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='mb-4 font-medium'>Legal</h4>
            <ul className='space-y-2 text-sm'>
              <li>
                <Link to='/privacy-policy' className='text-muted-foreground hover:text-foreground'>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to='/terms-of-service'
                  className='text-muted-foreground hover:text-foreground'
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to='/cookie-policy' className='text-muted-foreground hover:text-foreground'>
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to='/contact' className='text-muted-foreground hover:text-foreground'>
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className='mt-12 border-t pt-6'>
          <p className='text-center text-xs text-muted-foreground'>
            © {new Date().getFullYear()} commonly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
