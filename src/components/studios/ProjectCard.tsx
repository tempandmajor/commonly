import { Button } from '@/components/ui/button';
import { Project } from '@/services/studioService';
import styles from '@/spa-pages/studios.module.css';

interface ProjectCardProps {
  project: Project;
  size?: 'large' | undefined| 'small';
}

const ProjectCard = ({ project, size = 'small' }: ProjectCardProps) => {
  return (
    <div className='group relative aspect-video overflow-hidden rounded-lg bg-gray-200'>
      <img
        src={project.image}
        alt={project.title}
        className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
      />
      <div className='absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-90'>
        <div className={`absolute bottom-0 p-${size === 'large' ? '6' : '4'}`}>
          <h3
            className={`${size === 'large' ? 'text-3xl' : 'text-xl'} font-bold text-white ${styles.shadowText}`}
          >
            {project.title}
          </h3>
          <p
            className={`${size === 'large' ? 'mt-2' : 'mt-1'} ${size === 'large' ? 'text-base' : 'text-sm'} text-white/80 ${styles.shadowText}`}
          >
            {project.type} • {project.year}
          </p>
          {size === 'large' && project.trailerUrl && (
            <a href={project.trailerUrl} target='_blank' rel='noopener noreferrer'>
              <Button variant='outline' className='mt-4 text-white hover:bg-white hover:text-black'>
                Watch Trailer
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
