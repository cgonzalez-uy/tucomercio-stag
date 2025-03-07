import { useState, useRef } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Upload, X, Calendar, AlertCircle } from 'lucide-react';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface BannerFormProps {
  initialData?: {
    image: string;
    altText?: string;
    buttonLink?: string;
    startDate: any;
    endDate: any;
    isActive: boolean;
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function BannerForm({ initialData, onSubmit, onCancel }: BannerFormProps) {
  const [formData, setFormData] = useState({
    image: initialData?.image || '',
    altText: initialData?.altText || '',
    buttonLink: initialData?.buttonLink || '',
    startDate: initialData?.startDate ? new Date(initialData.startDate.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate ? new Date(initialData.endDate.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    isActive: initialData?.isActive ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {


      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      // Upload to Firebase Storage
      const storageRef = ref(storage, `banners/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      // Update form data and preview
      setImagePreview(url);
      setFormData(prev => ({ ...prev, image: url }));
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Error al subir la imagen');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.image) {
        throw new Error('La imagen es requerida');
      }

      if (!formData.altText.trim()) {
        throw new Error('El texto alternativo es requerido');
      }

      // Create timestamps
      const startTimestamp = new Date(formData.startDate);
      const endTimestamp = new Date(formData.endDate);

      // Validate dates
      if (endTimestamp <= startTimestamp) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      setLoading(true);
      await onSubmit({
        ...formData,
        altText: formData.altText.trim(),
        // Only include buttonLink if it has a value
        ...(formData.buttonLink.trim() && { buttonLink: formData.buttonLink.trim() }),
        startDate: startTimestamp,
        endDate: endTimestamp
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el banner');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Imagen <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        
        {imagePreview ? (
          <div className="relative aspect-[21/9] rounded-lg overflow-hidden bg-gray-100">
            <img
              src={imagePreview}
              alt={formData.altText}
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                setImagePreview(null);
                setFormData(prev => ({ ...prev, image: '' }));
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[21/9] flex flex-col items-center justify-center gap-2"
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <span>Subir imagen</span>
            <span className="text-sm text-gray-500">PNG, JPG o GIF (max. 8MB)</span>
          </Button>
        )}
      </div>

      {/* Alt Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Texto alternativo <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.altText}
          onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
          placeholder="Describe el contenido del banner"
        />
        <p className="mt-1 text-sm text-gray-500">
          Este texto se usará para búsquedas y accesibilidad
        </p>
      </div>

      {/* Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Enlace <span className="text-gray-500">(opcional)</span>
        </label>
        <Input
          value={formData.buttonLink}
          onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
          placeholder="Ej: /events"
        />
        <p className="mt-1 text-sm text-gray-500">
          Deja este campo vacío si el banner es solo informativo
        </p>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fecha inicio <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fecha fin <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      {/* Active Status */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium text-gray-700">Banner activo</span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Calendar className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4" />
              {initialData ? 'Guardar cambios' : 'Crear banner'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}