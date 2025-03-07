import { useState, useRef } from 'react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Upload, X, Calendar, AlertCircle, Search, Store, Check } from 'lucide-react';
import { EVENT_CATEGORIES } from '../../../types/event';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useBusinesses } from '../../../lib/hooks/useBusinesses';
import { storage } from '../../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface EventFormProps {
  initialData?: {
    title: string;
    description: string;
    shortDescription: string;
    image?: string;
    startDate: any;
    endDate: any;
    location: string;
    category: string;
    organizer: string;
    price: number;
    capacity?: number;
    registrationRequired: boolean;
    participatingBusinesses: string[];
    isActive: boolean;
    registeredUsers?: any[];
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function EventForm({ initialData, onSubmit, onCancel }: EventFormProps) {
  const { businesses } = useBusinesses();
  const [businessSearchTerm, setBusinessSearchTerm] = useState('');
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<Set<string>>(
    new Set(initialData?.participatingBusinesses || [])
  );

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    shortDescription: initialData?.shortDescription || '',
    image: initialData?.image || '',
    startDate: initialData?.startDate ? format(new Date(initialData.startDate.seconds * 1000), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    startTime: initialData?.startDate ? format(new Date(initialData.startDate.seconds * 1000), 'HH:mm') : format(new Date(), 'HH:mm'),
    endDate: initialData?.endDate ? format(new Date(initialData.endDate.seconds * 1000), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    endTime: initialData?.endDate ? format(new Date(initialData.endDate.seconds * 1000), 'HH:mm') : format(new Date(), 'HH:mm'),
    location: initialData?.location || '',
    category: initialData?.category || 'cultural',
    organizer: initialData?.organizer || '',
    price: initialData?.price || 0,
    capacity: initialData?.capacity || undefined,
    registrationRequired: initialData?.registrationRequired || false,
    participatingBusinesses: initialData?.participatingBusinesses || [],
    isActive: initialData?.isActive ?? true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Required fields validation
    if (!formData.title.trim()) {
      errors.title = 'El título es requerido';
    }

    if (!formData.shortDescription.trim()) {
      errors.shortDescription = 'La descripción corta es requerida';
    } else if (formData.shortDescription.length > 150) {
      errors.shortDescription = 'La descripción corta no puede exceder los 150 caracteres';
    }

    if (!formData.description.trim()) {
      errors.description = 'La descripción es requerida';
    }

    if (!formData.location.trim()) {
      errors.location = 'La ubicación es requerida';
    }

    if (!formData.organizer.trim()) {
      errors.organizer = 'El organizador es requerido';
    }

    // Numeric fields validation
    if (formData.price < 0) {
      errors.price = 'El precio no puede ser negativo';
    }

    if (formData.capacity !== undefined) {
      const capacity = Number(formData.capacity);
      if (isNaN(capacity) || capacity <= 0) {
        errors.capacity = 'La capacidad debe ser un número mayor a 0';
      }
    }

    // Date validation
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    const now = new Date();

    // Remove time component for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());

    if (startDate < today) {
      errors.startDate = 'La fecha de inicio debe ser hoy o posterior';
    }

    if (endDateTime <= startDateTime) {
      errors.endDate = 'La fecha y hora de fin debe ser posterior a la fecha y hora de inicio';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('La imagen no puede superar los 2MB');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      // Upload to Firebase Storage
      const storageRef = ref(storage, `events/${Date.now()}-${file.name}`);
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

    if (!validateForm()) {
      setError('Por favor, corrige los errores en el formulario');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Create timestamps
      const startTimestamp = new Date(`${formData.startDate}T${formData.startTime}`);
      const endTimestamp = new Date(`${formData.endDate}T${formData.endTime}`);

      // Prepare data for submission
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        shortDescription: formData.shortDescription.trim(),
        image: formData.image || null,
        startDate: startTimestamp,
        endDate: endTimestamp,
        location: formData.location.trim(),
        category: formData.category,
        organizer: formData.organizer.trim(),
        price: Number(formData.price),
        capacity: formData.capacity ? Number(formData.capacity) : null,
        registrationRequired: formData.registrationRequired,
        participatingBusinesses: Array.from(selectedBusinessIds),
        isActive: formData.isActive,
        registeredUsers: initialData?.registeredUsers || []
      };

      await onSubmit(eventData);
    } catch (err) {
      console.error('Error submitting event:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el evento');
    } finally {
      setLoading(false);
    }
  };

  // Filter active businesses based on search term
  const filteredBusinesses = businesses
    .filter(b => b.isActive)
    .filter(business => {
      if (!businessSearchTerm) return true;
      
      const searchTermLower = businessSearchTerm.toLowerCase();
      return (
        business.name.toLowerCase().includes(searchTermLower) ||
        business.address.toLowerCase().includes(searchTermLower) ||
        business.categories.some(cat => cat.toLowerCase().includes(searchTermLower))
      );
    });

  // Toggle business selection
  const handleBusinessToggle = (businessId: string) => {
    const newSelectedIds = new Set(selectedBusinessIds);
    if (newSelectedIds.has(businessId)) {
      newSelectedIds.delete(businessId);
    } else {
      newSelectedIds.add(businessId);
    }
    setSelectedBusinessIds(newSelectedIds);
    setFormData(prev => ({
      ...prev,
      participatingBusinesses: Array.from(newSelectedIds)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Título <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Festival de Música en el Parque"
            className={cn(validationErrors.title && "border-red-500")}
          />
          {validationErrors.title && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Descripción corta <span className="text-red-500">*</span>
            <span className="text-sm text-gray-500 ml-2">
              ({formData.shortDescription.length}/150 caracteres)
            </span>
          </label>
          <Input
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            placeholder="Breve descripción para listados"
            maxLength={150}
            className={cn(validationErrors.shortDescription && "border-red-500")}
          />
          {validationErrors.shortDescription && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.shortDescription}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Descripción completa <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={cn(
              "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20",
              validationErrors.description && "border-red-500"
            )}
            rows={4}
          />
          {validationErrors.description && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.description}</p>
          )}
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          
          {imagePreview ? (
            <div className="relative w-full h-48">
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
              className="w-full h-48 flex flex-col items-center justify-center gap-2"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <span>Subir imagen</span>
              <span className="text-sm text-gray-500">PNG, JPG o GIF (max. 2MB)</span>
            </Button>
          )}
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha inicio <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
                className={cn(validationErrors.startDate && "border-red-500")}
              />
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            {validationErrors.startDate && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.startDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha fin <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                className={cn(validationErrors.endDate && "border-red-500")}
              />
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
            {validationErrors.endDate && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.endDate}</p>
            )}
          </div>
        </div>

        {/* Location and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ubicación <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Plaza Principal"
              className={cn(validationErrors.location && "border-red-500")}
            />
            {validationErrors.location && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.location}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
            >
              {Object.entries(EVENT_CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Organizer and Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Organizador <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.organizer}
              onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
              placeholder="Ej: Municipalidad"
              className={cn(validationErrors.organizer && "border-red-500")}
            />
            {validationErrors.organizer && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.organizer}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Precio
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className={cn(validationErrors.price && "border-red-500")}
            />
            {validationErrors.price && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.price}</p>
            )}
          </div>
        </div>

        {/* Capacity and Registration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Capacidad
            </label>
            <Input
              type="number"
              min="1"
              value={formData.capacity || ''}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="Dejar vacío para sin límite"
              className={cn(validationErrors.capacity && "border-red-500")}
            />
            {validationErrors.capacity && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.capacity}</p>
            )}
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.registrationRequired}
                onChange={(e) => setFormData({ ...formData, registrationRequired: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">
                Requiere registro
              </span>
            </label>
          </div>
        </div>

        {/* Participating Businesses Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comercios participantes
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({selectedBusinessIds.size} seleccionados)
            </span>
          </label>

          {/* Search box */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar comercios por nombre, dirección o categoría..."
              value={businessSearchTerm}
              onChange={(e) => setBusinessSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Businesses list */}
          <div className="bg-gray-50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-2">
              {filteredBusinesses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {businessSearchTerm 
                    ? 'No se encontraron comercios que coincidan con tu búsqueda'
                    : 'No hay comercios activos disponibles'
                  }
                </div>
              ) : (
                <>
                  {/* Select/Deselect All */}
                  <div className="flex justify-end gap-2 mb-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSelectedIds = new Set(selectedBusinessIds);
                        filteredBusinesses.forEach(business => {
                          newSelectedIds.add(business.id);
                        });
                        setSelectedBusinessIds(newSelectedIds);
                        setFormData(prev => ({
                          ...prev,
                          participatingBusinesses: Array.from(newSelectedIds)
                        }));
                      }}
                      className="text-xs"
                    >
                      Seleccionar todos
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSelectedIds = new Set(selectedBusinessIds);
                        filteredBusinesses.forEach(business => {
                          newSelectedIds.delete(business.id);
                        });
                        setSelectedBusinessIds(newSelectedIds);
                        setFormData(prev => ({
                          ...prev,
                          participatingBusinesses: Array.from(newSelectedIds)
                        }));
                      }}
                      className="text-xs"
                    >
                      Deseleccionar todos
                    </Button>
                  </div>

                  {/* Businesses */}
                  <div className="space-y-2">
                    {filteredBusinesses.map((business) => (
                      <label
                        key={business.id}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors",
                          selectedBusinessIds.has(business.id) 
                            ? "bg-primary/10 hover:bg-primary/20" 
                            : "hover:bg-gray-100"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBusinessIds.has(business.id)}
                          onChange={() => handleBusinessToggle(business.id)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {business.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="truncate">{business.address}</span>
                            <span className="shrink-0">•</span>
                            <span className="truncate">{business.categories.join(', ')}</span>
                          </div>
                        </div>
                        {selectedBusinessIds.has(business.id) && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
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
            <span className="text-sm font-medium text-gray-700">Evento activo</span>
          </label>
        </div>
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
              {initialData ? 'Guardar cambios' : 'Crear evento'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}