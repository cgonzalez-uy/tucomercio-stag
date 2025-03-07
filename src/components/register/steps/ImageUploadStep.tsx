import { useState, useRef } from 'react';
import { Button } from '../../ui/button';
import { Upload, X, Store } from 'lucide-react';

interface ImageUploadStepProps {
  data: {
    image?: string;
    imageFile?: File;
  };
  onChange: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export function ImageUploadStep({ data, onChange, onNext, onBack, onCancel }: ImageUploadStepProps) {
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(data.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError('');

      // Validar tamaño máximo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede superar los 5MB');
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      // Crear URL temporal para la vista previa
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Guardar el archivo para subirlo más tarde
      onChange({ ...data, imageFile: file });

    } catch (err) {
      console.error('Error selecting image:', err);
      setError(err instanceof Error ? err.message : 'Error al seleccionar la imagen');
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    onChange({ ...data, imageFile: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext(); }} className="space-y-6 max-w-xl mx-auto">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Imagen del comercio
        </h3>
        <p className="text-gray-500 mb-6">
          Sube una imagen que represente tu comercio. Puede ser tu logo o una foto de la fachada.
        </p>

        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center">
            {imagePreview ? (
              <div className="relative w-64 h-64">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-64 h-64 flex flex-col items-center justify-center gap-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <Store className="h-12 w-12 text-gray-400" />
                <div className="text-center">
                  <p className="font-medium text-gray-900">Subir imagen</p>
                  <p className="text-sm text-gray-500">PNG, JPG o GIF (máx. 5MB)</p>
                </div>
              </Button>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center">{error}</div>
          )}

          <p className="text-sm text-gray-500 text-center">
            Tamaño recomendado: 500x500 píxeles
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <div className="space-x-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Atrás
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
        <Button type="submit">
          Continuar
        </Button>
      </div>
    </form>
  );
}