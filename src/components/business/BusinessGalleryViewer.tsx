import { useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BusinessGalleryViewerProps {
  images: string[];
  mainImage?: string;
}

export function BusinessGalleryViewer({ images, mainImage }: BusinessGalleryViewerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);

  // Combine main image with gallery images
  const allImages = mainImage ? [mainImage, ...images] : images;

  // Get current image index
  const currentIndex = selectedImage ? allImages.indexOf(selectedImage) : -1;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSelectedImage(allImages[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < allImages.length - 1) {
      setSelectedImage(allImages[currentIndex + 1]);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape') {
      setShowLightbox(false);
    }
  };

  if (allImages.length === 0) return null;

  return (
    <>
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allImages.map((image, index) => (
          <button
            key={image}
            onClick={() => {
              setSelectedImage(image);
              setShowLightbox(true);
            }}
            className={cn(
              "relative aspect-square group overflow-hidden rounded-lg bg-gray-100",
              index === 0 && "md:col-span-2 md:row-span-2"
            )}
          >
            <img
              src={image}
              alt={`Imagen ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog 
        open={showLightbox} 
        onOpenChange={setShowLightbox}
      >
        <DialogContent 
          className="max-w-5xl w-screen h-screen sm:h-auto p-0 bg-transparent border-none"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-50 text-white hover:bg-white/20"
              onClick={() => setShowLightbox(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation buttons */}
            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 z-50 text-white hover:bg-white/20"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            {currentIndex < allImages.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-50 text-white hover:bg-white/20"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

            {/* Image */}
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Vista ampliada"
                className="max-w-full max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}