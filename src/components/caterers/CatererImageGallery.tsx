import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Download,
  Share,
  Grid3X3,
  Maximize,
} from 'lucide-react';
import { CatererMedia } from '@/types/caterer';

interface CatererImageGalleryProps {
  media: CatererMedia;
  catererName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number | undefined;
}

const CatererImageGallery: React.FC<CatererImageGalleryProps> = ({
  media,
  catererName,
  open,
  onOpenChange,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);

  const allImages = [
          ...(media.cover_image ? [media.cover_image] : []),
          ...media.gallery_images,
          ...media.portfolio_images,
          ...media.menu_images,
  ];

  const currentImage = allImages[currentIndex];

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
    setIsZoomed(false);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    setIsZoomed(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') onOpenChange(false);
  };

  React.useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [open]);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handleShare = async () => {
    if (!currentImage) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${catererName} - Photo ${currentIndex + 1}`,
          url: currentImage,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(currentImage);
      }
    } else {
      navigator.clipboard.writeText(currentImage);
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `${catererName}-photo-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getImageCategory = (index: number) => {
    let offset = 0;

    if (media.cover_image) {
      if (index === 0) return 'Cover Photo';
      offset = 1;
    }

    if (index < offset + media.gallery_images.length) {
      return 'Gallery';
    }
    offset += media.gallery_images.length;

    if (index < offset + media.portfolio_images.length) {
      return 'Portfolio';
    }
    offset += media.portfolio_images.length;

    if (index < offset + media.menu_images.length) {
      return 'Menu';
    }

    return 'Photo';
  };

  if (allImages.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full h-full max-h-screen p-0 bg-black">
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-4">
              <Badge className="bg-white/20 text-white">
                {currentIndex + 1} of {allImages.length}
              </Badge>
              <Badge className="bg-[#2B2B2B]/80 text-white">
                {getImageCategory(currentIndex)}
              </Badge>
              <h2 className="text-white font-medium">{catererName}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowThumbnails(!showThumbnails)}
                className="text-white hover:bg-white/20"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsZoomed(!isZoomed)}
                className="text-white hover:bg-white/20"
              >
                {isZoomed ? <Maximize className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-white hover:bg-white/20"
              >
                <Share className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Image */}
          <div className="flex-1 flex items-center justify-center relative">
            <img
              src={currentImage}
              alt={`${catererName} - Photo ${currentIndex + 1}`}
              className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
                isZoomed ? 'scale-150 cursor-grab' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
              draggable={false}
            />

            {/* Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-12 h-12"
                  disabled={allImages.length <= 1}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-12 h-12"
                  disabled={allImages.length <= 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {showThumbnails && allImages.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
              <div className="flex gap-2 justify-center overflow-x-auto">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsZoomed(false);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-white scale-110'
                        : 'border-white/50 hover:border-white'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CatererImageGallery;