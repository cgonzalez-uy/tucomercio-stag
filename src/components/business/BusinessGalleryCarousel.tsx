import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BusinessGalleryCarouselProps {
  images: string[];
}

export function BusinessGalleryCarousel({ images }: BusinessGalleryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  // Auto-advance carousel
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [currentIndex, images.length]);

  const handlePrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Handle keyboard navigation in lightbox
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape') {
      setShowLightbox(false);
    }
  };

  if (images.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Galería de imágenes
        </h2>

        {/* Main carousel */}
        <div className="relative group">
          {/* Main image container */}
          <div 
            className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
            onClick={() => setShowLightbox(true)}
          >
            {/* Current image with transition */}
            <img
              src={images[currentIndex]}
              alt={`Imagen ${currentIndex + 1}`}
              className={cn(
                "w-full h-full object-cover transition-all duration-500",
                isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
              )}
            />

            {/* Overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-4 bg-black/20 hover:bg-black/40 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-4 bg-black/20 hover:bg-black/40 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            )}

            {/* Progress indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      currentIndex === index
                        ? "bg-white w-8"
                        : "bg-white/50 w-4 hover:bg-white/75"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog 
        open={showLightbox} 
        onOpenChange={setShowLightbox}
      >
        <DialogContent 
          className="max-w-7xl w-screen h-screen sm:h-auto p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          <DialogHeader className="absolute top-2 left-4 right-4 z-50 flex-row items-center justify-between">
            <DialogTitle className="text-white">
              Imagen {currentIndex + 1} de {images.length}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setShowLightbox(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </DialogHeader>

          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-50 text-white hover:bg-white/20"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-50 text-white hover:bg-white/20"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Image with transition */}
            <img
              src={images[currentIndex]}
              alt={`Imagen ${currentIndex + 1} de ${images.length}`}
              className={cn(
                "max-w-full max-h-[80vh] object-contain transition-all duration-500",
                isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
              )}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}