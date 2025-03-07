import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBusinesses } from '../../lib/hooks/useBusinesses';
import { useSettings } from '../../lib/hooks/useSettings';
import { usePlans } from '../../lib/hooks/usePlans';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ScheduleEditor } from '../schedule/ScheduleEditor';
import { DEFAULT_SCHEDULE } from '../../types/business';
import { Timestamp } from 'firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function BusinessForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBusiness, createBusiness, updateBusiness } = useBusinesses();
  const { settings: categories } = useSettings('categories');
  const { settings: paymentMethods } = useSettings('payment-methods');
  const { settings: shippingMethods } = useSettings('shipping-methods');
  const { plans, loading: loadingPlans } = usePlans();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    address: '',
    categories: [] as string[],
    phone: '',
    email: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
    website: '',
    image: '',
    paymentMethods: [] as string[],
    shippingMethods: [] as string[],
    isActive: true,
    planId: '',
    planStartDate: null as Timestamp | null,
    schedule: DEFAULT_SCHEDULE,
    hasPortalAccess: false
  });

  // Cargar datos del comercio si estamos editando
  useEffect(() => {
    if (id) {
      const business = getBusiness(id);
      if (business) {
        setFormData({
          name: business.name,
          description: business.description,
          shortDescription: business.shortDescription,
          address: business.address,
          categories: business.categories,
          phone: business.phone,
          email: business.email || '',
          whatsapp: business.whatsapp || '',
          instagram: business.instagram || '',
          facebook: business.facebook || '',
          website: business.website || '',
          image: business.image || '',
          paymentMethods: business.paymentMethods,
          shippingMethods: business.shippingMethods,
          isActive: business.isActive,
          planId: business.planId,
          planStartDate: business.planStartDate || null,
          schedule: business.schedule || DEFAULT_SCHEDULE,
          hasPortalAccess: business.hasPortalAccess || false
        });
        if (business.image) {
          setImagePreview(business.image);
        }
      }
    }
  }, [id, getBusiness]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `businesses/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setImagePreview(url);
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
      setImagePreview(null);
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
    setLoading(true);

    try {
      if (formData.categories.length === 0) {
        throw new Error('Debes seleccionar al menos una categoría');
      }

      if (formData.paymentMethods.length === 0) {
        throw new Error('Debes seleccionar al menos un método de pago');
      }

      if (formData.shippingMethods.length === 0) {
        throw new Error('Debes seleccionar al menos un método de envío');
      }

      if (!formData.planId) {
        throw new Error('Debes seleccionar un plan');
      }

      const selectedPlan = plans.find(p => p.id === formData.planId);
      if (!selectedPlan) {
        throw new Error('El plan seleccionado no existe');
      }

      // Verificar si el email ya está en uso
      if (formData.email) {
        const businessesRef = collection(db, 'businesses');
        const q = query(businessesRef, where('email', '==', formData.email.trim()));
        const snapshot = await getDocs(q);

        // Si estamos editando, excluir el comercio actual de la validación
        if (!snapshot.empty && (!id || snapshot.docs[0].id !== id)) {
          throw new Error('Este correo electrónico ya está registrado. Por favor, utiliza otro correo.');
        }
      }

      // Add http:// if website is provided but doesn't start with http:// or https://
      const website = formData.website.trim();
      if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
        formData.website = `https://${website}`;
      }

      // Check if plan has changed
      let planStartDate = formData.planStartDate;
      if (id) {
        const currentBusiness = getBusiness(id);
        if (currentBusiness && currentBusiness.planId !== formData.planId) {
          // Plan changed, update start date
          planStartDate = Timestamp.now();
        }
      } else {
        // New business, set initial plan start date
        planStartDate = Timestamp.now();
      }

      if (id) {
        await updateBusiness(id, {
          ...formData,
          planStartDate
        });
        
        // Verificar si el comercio cumple las condiciones para el portal
        const shouldHavePortalAccess = 
          formData.isActive && 
          formData.email && 
          selectedPlan.price > 0;

        if (shouldHavePortalAccess && !formData.hasPortalAccess) {
          navigate(`/superadmin/businesses/${id}/portal-setup`);
          return;
        }
      } else {
        await createBusiness({
          ...formData,
          planStartDate
        });
      }
      
      navigate('/superadmin/businesses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el comercio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/superadmin/businesses')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold text-gray-900">
          {id ? 'Editar comercio' : 'Nuevo comercio'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre <span className="text-red-500">*</span>
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
              Descripción breve <span className="text-red-500">*</span>
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
              Descripción completa <span className="text-red-500">*</span>
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
              Dirección <span className="text-red-500">*</span>
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
              Plan de suscripción <span className="text-red-500">*</span>
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
              value={formData.planId}
              onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
              required
            >
              <option value="">Selecciona un plan</option>
              {plans
                .filter(plan => plan.isActive)
                .map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price}/{plan.billingPeriod === 'monthly' ? 'mes' : 'año'}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorías (máximo 3) <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {categories
                .filter(cat => cat.isActive)
                .map((category) => (
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
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
                  className="w-full h-48 flex flex-col items-center justify-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-6 w-6" />
                  <span>Subir imagen</span>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono <span className="text-red-500">*</span>
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
                Correo electrónico <span className="text-gray-500">(opcional)</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contacto@comercio.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                WhatsApp <span className="text-gray-500">(opcional)</span>
              </label>
              <Input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Instagram <span className="text-gray-500">(opcional)</span>
              </label>
              <Input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Facebook <span className="text-gray-500">(opcional)</span>
              </label>
              <Input
                type="text"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sitio web <span className="text-gray-500">(opcional)</span>
              </label>
              <Input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Métodos de pago <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {paymentMethods
                .filter(method => method.isActive)
                .map((method) => (
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Métodos de envío <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {shippingMethods
                .filter(method => method.isActive)
                .map((method) => (
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Horarios
            </label>
            <ScheduleEditor
              value={formData.schedule}
              onChange={(schedule) => setFormData({ ...formData, schedule })}
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">Comercio activo</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/superadmin/businesses')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || uploading || loadingPlans}
          >
            {loading ? 'Guardando...' : id ? 'Guardar cambios' : 'Crear comercio'}
          </Button>
        </div>
      </form>
    </div>
  );
}