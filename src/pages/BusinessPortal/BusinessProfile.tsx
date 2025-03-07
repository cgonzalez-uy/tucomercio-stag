import { useState, useEffect, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, storage } from '../../lib/firebase';
import { useBusinesses } from '../../lib/hooks/useBusinesses';
import { useSettings } from '../../lib/hooks/useSettings';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ScheduleEditor } from '../../components/schedule/ScheduleEditor';
import { DEFAULT_SCHEDULE } from '../../types/business';
import { Loader2, Upload, X, Store, CheckCircle2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export function BusinessProfile() {
  const [user] = useAuthState(auth);
  const { businesses, updateBusiness } = useBusinesses();
  const { settings: paymentMethods } = useSettings('payment-methods');
  const { settings: shippingMethods } = useSettings('shipping-methods');
  const { settings: categories } = useSettings('categories');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimeoutRef = useRef<number>();
  
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
    website: '',
    image: '',
    paymentMethods: [] as string[],
    shippingMethods: [] as string[],
    categories: [] as string[],
    schedule: DEFAULT_SCHEDULE
  });

  // Load business data
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setInitializing(true);
        await user?.getIdToken(true);
        const idTokenResult = await user?.getIdTokenResult();
        const businessId = idTokenResult?.claims?.businessId;

        if (businessId) {
          const business = businesses.find(b => b.id === businessId);
          if (business) {
            setFormData({
              name: business.name || '',
              shortDescription: business.shortDescription || '',
              description: business.description || '',
              address: business.address || '',
              phone: business.phone || '',
              email: business.email || '',
              whatsapp: business.whatsapp || '',
              instagram: business.instagram || '',
              facebook: business.facebook || '',
              website: business.website || '',
              image: business.image || '',
              paymentMethods: business.paymentMethods || [],
              shippingMethods: business.shippingMethods || [],
              categories: business.categories || [],
              schedule: business.schedule || DEFAULT_SCHEDULE
            });
          }
        }
      } catch (err) {
        console.error('Error loading business data:', err);
        setError('Error al cargar los datos del comercio');
      } finally {
        setInitializing(false);
      }
    };

    if (user) {
      loadBusinessData();
    }
  }, [user, businesses]);

  // Clear success message after timeout
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `businesses/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setFormData(prev => ({ ...prev, image: url }));
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!formData.image) return;

    try {
      setUploading(true);
      const imageRef = ref(storage, formData.image);
      await deleteObject(imageRef);
      setFormData(prev => ({ ...prev, image: '' }));
    } catch (err) {
      console.error('Error removing image:', err);
      setError('Error al eliminar la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const idTokenResult = await user?.getIdTokenResult();
      const businessId = idTokenResult?.claims?.businessId;

      if (!businessId) {
        throw new Error('No se encontró el ID del comercio');
      }

      await updateBusiness(businessId, formData);
      
      // Show success message
      setSuccess(true);
      
      // Clear success message after 3 seconds
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = window.setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activePaymentMethods = paymentMethods.filter(method => method.isActive);
  const activeShippingMethods = shippingMethods.filter(method => method.isActive);
  const activeCategories = categories.filter(cat => cat.isActive);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mi Comercio</h1>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-1 bg-green-100 rounded-full">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">
              ¡Cambios guardados correctamente!
            </p>
            <p className="text-sm text-green-700">
              Los cambios se verán reflejados inmediatamente en tu perfil público.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-1 bg-red-100 rounded-full">
            <X className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-medium text-red-800">
              Error al guardar los cambios
            </p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Imagen principal */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Imagen principal</h3>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            {formData.image ? (
              <div className="relative w-48 h-48">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-48 h-48 flex flex-col items-center justify-center gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Store className="h-8 w-8" />
                <span>Subir imagen</span>
              </Button>
            )}
          </div>
        </div>

        {/* Información básica */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre del comercio
            </label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción breve
            </label>
            <Input
              type="text"
              required
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción completa
            </label>
            <textarea
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Dirección
            </label>
            <Input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <Input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-gray-500">
              El email no se puede modificar ya que es tu identificador de inicio de sesión
            </p>
          </div>
        </div>

        {/* Redes sociales */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Redes sociales</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              WhatsApp
            </label>
            <Input
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Instagram
            </label>
            <Input
              type="text"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Facebook
            </label>
            <Input
              type="text"
              value={formData.facebook}
              onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sitio web
            </label>
            <Input
              type="text"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>
        </div>

        {/* Categorías */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Categorías</h3>
          <div className="space-y-2">
            {activeCategories.map((category) => (
              <label key={category.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.categories.includes(category.name)}
                  onChange={(e) => {
                    const newCategories = e.target.checked
                      ? [...formData.categories, category.name]
                      : formData.categories.filter((c) => c !== category.name);
                    
                    if (newCategories.length <= 3) {
                      setFormData({ ...formData, categories: newCategories });
                    }
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  disabled={!formData.categories.includes(category.name) && formData.categories.length >= 3}
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{category.name}</span>
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Métodos de pago */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Métodos de pago</h3>
          <div className="space-y-2">
            {activePaymentMethods.map((method) => (
              <label key={method.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.paymentMethods.includes(method.name)}
                  onChange={(e) => {
                    const newMethods = e.target.checked
                      ? [...formData.paymentMethods, method.name]
                      : formData.paymentMethods.filter((m) => m !== method.name);
                    setFormData({ ...formData, paymentMethods: newMethods });
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{method.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Métodos de envío */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Métodos de envío</h3>
          <div className="space-y-2">
            {activeShippingMethods.map((method) => (
              <label key={method.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.shippingMethods.includes(method.name)}
                  onChange={(e) => {
                    const newMethods = e.target.checked
                      ? [...formData.shippingMethods, method.name]
                      : formData.shippingMethods.filter((m) => m !== method.name);
                    setFormData({ ...formData, shippingMethods: newMethods });
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{method.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Horarios */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Horarios</h3>
          <ScheduleEditor
            value={formData.schedule}
            onChange={(schedule) => setFormData({ ...formData, schedule })}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando cambios...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}