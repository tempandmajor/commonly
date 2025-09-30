import { Loading } from './loading';

interface PageSectionLoaderProps {
  message?: string | undefined;
  size?: 'sm' | undefined| 'md' | 'lg';
  className?: string | undefined;
}

export const PageSectionLoader = ({
  message = 'Loading...',
  size = 'md',
  className = '',
}: PageSectionLoaderProps) => {
  const sizeMap = {
    sm: 'small',
    md: 'medium',
    lg: 'large',
  } as const;

  return <Loading size={sizeMap[size]} message={message} className={`py-6 ${className}`} />;
};
