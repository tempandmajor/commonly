import { Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CatererImageProps {
  imageUrl: string;
  name: string;
  isLiked: boolean;
  onLikeChange: (liked: boolean) => void;
}

const CatererImage = ({ imageUrl, name, isLiked, onLikeChange }: CatererImageProps) => {
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleLike = () => {
    onLikeChange(!isLiked);
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };

  return (
    <div className='relative w-full h-[40vh] md:h-[50vh] overflow-hidden'>
      <img src={imageUrl} alt={name} className='w-full h-full object-cover' />
      <div className='absolute top-4 right-4 flex space-x-2'>
        <Button
          size='icon'
          variant='secondary'
          className='rounded-full bg-white/80 text-black hover:bg-white'
          onClick={handleShare}
        >
          <Share2 className='h-4 w-4' />
        </Button>
        <Button
          size='icon'
          variant='secondary'
          className={`rounded-full ${isLiked ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white/80 text-black hover:bg-white'}`}
          onClick={handleLike}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default CatererImage;
