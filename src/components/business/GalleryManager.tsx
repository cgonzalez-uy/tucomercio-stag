import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { cn } from '../../lib/utils';

interface GalleryManagerProps {
  businessId: string;
  images: string[];
  onUpdate: (images: string[]) => Promise<void>;
}

export function GalleryManager({ businessId, images, onUpdate }: GalleryManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      setUploading(true);

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede superar los 5MB');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      // Validate maximum number of images
      if (images.length >= 5) {
        throw new Error('No puedes subir más de 5 imágenes');
      }

      // Generate a unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      
      // Upload image
      const storageRef = ref(storage, `businesses/${businessId}/gallery/${filename}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      // Update gallery
      await onUpdate([...images, url]);

      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      setError('');
      setUploading(true);

      // First update the gallery array to maintain UI responsiveness
      const newImages = images.filter(img => img !== imageUrl);
      await onUpdate(newImages);

      // Then try to delete the file from storage
      try {
        // Extract the path from the URL
        const path = decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0]);
        const imageRef = ref(storage, path);
        await deleteObject(imageRef);
      } catch (err: any) {
        // If the file doesn't exist, that's fine - just log it
        if (err.code === 'storage/object-not-found') {
          console.log('Image already deleted from storage');
        } else {
          // For other errors, log but don't throw
          console.error('Error deleting image from storage:', err);
        }
      }
    } catch (err) {
      console.error('Error removing image:', err);
      setError('Error al eliminar la imagen');
      
      // If the gallery update failed, we should show an error
      // but the image might already be deleted from storage
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Galería de imágenes</h3>
          <p className="text-sm text-gray-500">
            Puedes subir hasta 5 imágenes adicionales de tu comercio
          </p>
        </div>

        {images.length < 5 && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>Subir imagen</span>
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((image, index) => (
          <div key={image} className="relative group aspect-square">
            <img
              src={image}
              alt={`Imagen ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveImage(image)}
                disabled={uploading}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {images.length === 0 && (
          <div 
            className={cn(
              "aspect-square border-2 border-dashed rounded-lg",
              "flex flex-col items-center justify-center gap-2",
              "text-gray-400 bg-gray-50"
            )}
          >
            <ImageIcon className="h-8 w-8" />
            <p className="text-sm text-center">
              No hay imágenes<br />en la galería
            </p>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Tamaño máximo por imagen: 5MB. Formatos soportados: JPG, PNG, GIF
      </p>
    </div>
  );
}