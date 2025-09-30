import { Project } from '@/services/studioService';
import ProjectGrid from './ProjectGrid';

interface FeaturedProjectsSectionProps {
  projects: Project[];
}

const FeaturedProjectsSection = ({ projects }: FeaturedProjectsSectionProps) => {
  return (
    <section className='bg-[#f8f8f8] py-20'>
      <div className='container mx-auto px-4'>
        <h2 className='mb-4 text-4xl font-bold'>Featured Projects</h2>
        <p className='mb-12 text-xl text-[#2B2B2B]/70'>
          A selection of our award-winning productions.
        </p>

        <ProjectGrid projects={projects} />
      </div>
    </section>
  );
};

export default FeaturedProjectsSection;
