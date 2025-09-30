import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Project } from '@/services/studioService';
import ProjectCard from './ProjectCard';

interface ProjectGridProps {
  projects: Project[];
}

const ProjectGrid = ({ projects }: ProjectGridProps) => {
  if (!projects.length) return null;

  return (
    <>
      <div className='grid grid-cols-1 gap-8 md:grid-cols-12'>
        <div className='md:col-span-8'>
          <ProjectCard project={projects[0]} size='large' />
        </div>

        <div className='flex flex-col gap-8 md:col-span-4'>
          {projects.slice(1, 3).map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      <div className='mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
        {projects.slice(3).map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      <div className='mt-12 text-center'>
        <Link to='/projects'>
          <Button variant='outline'>View All Projects</Button>
        </Link>
      </div>
    </>
  );
};

export default ProjectGrid;
