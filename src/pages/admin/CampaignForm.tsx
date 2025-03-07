import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import type { Campaign } from '../../types/campaign';

export function CampaignForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(id ? true : false);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    startDate: '',
    endDate: '',
    isActive: true,
    businesses: [] as string[],
    pendingRequests: [] as string[],
    metrics: {
      views: 0,
      clicks: 0,
      participantCount: 0
    },
    slug: '',
    theme: ''
  });
  
  // State for business selection
  const [availableBusinesses, setAvailableBusinesses] = useState<{id: string, name: string}[]>([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);
  const [searchBusiness, setSearchBusiness] = useState('');

  // Fetch campaign if editing
  useEffect(() => {
    if (id) {
      const fetchCampaign = async () => {
        try {
          setLoading(true);
          const campaignDoc = await getDocs(query(collection(db, 'campaigns')));
          const campaign = campaignDoc.docs.find(doc => doc.id === id);
          
          if (campaign) {
            const campaignData = { id: campaign.id, ...campaign.data() } as Campaign;
            setEditingCampaign(campaignData);
            setFormData({
              title: campaignData.title,
              description: campaignData.description,
              imageUrl: campaignData.imageUrl || '',
              startDate: new Date(campaignData.startDate.seconds * 1000).toISOString().split('T')[0],
              endDate: new Date(campaignData.endDate.seconds * 1000).toISOString().split('T')[0],
              isActive: campaignData.isActive,
              businesses: campaignData.businesses || [],
              pendingRequests: campaignData.pendingRequests || [],
              metrics: campaignData.metrics || {
                views: 0,
                clicks: 0,
                participantCount: 0
              },
              slug: campaignData.slug || '',
              theme: campaignData.theme || ''
            });
            setSelectedBusinesses(campaignData.businesses || []);
          }
        } catch (err) {
          console.error('Error fetching campaign:', err);
          showNotification('Error al cargar la campaña', 'error');
        } finally {
          setLoading(false);
        }
      };
      
      fetchCampaign();
    }
  }, [id]);

  // Show notification function
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({show: true, message, type});
    setTimeout(() => {
      setNotification(prev => ({...prev, show: false}));
    }, 3000);
  };

  // Fetch businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const businessesQuery = query(
          collection(db, 'businesses'),
          orderBy('name')
        );
        
        const businessesSnapshot = await getDocs(businessesQuery);
        const businessesList = businessesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        
        setAvailableBusinesses(businessesList);
      } catch (err) {
        console.error('Error fetching businesses:', err);
        showNotification('Error al cargar los comercios', 'error');
      }
    };
    
    fetchBusinesses();
  }, []);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `campaigns/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (err) {
      console.error('Error uploading image:', err);
      showNotification('Error al subir la imagen', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Handle image removal
  const handleRemoveImage = async () => {
    if (!formData.imageUrl) return;

    try {
      setUploading(true);
      const imageRef = ref(storage, formData.imageUrl);
      await deleteObject(imageRef);
      setFormData(prev => ({ ...prev, imageUrl: '' }));
    } catch (err) {
      console.error('Error removing image:', err);
      showNotification('Error al eliminar la imagen', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.title.trim()) {
      errors.title = 'El título es requerido';
    }

    if (!formData.description.trim()) {
      errors.description = 'La descripción es requerida';
    }

    if (!formData.startDate) {
      errors.startDate = 'La fecha de inicio es requerida';
    } else {
      const startDate = new Date(formData.startDate);
      if (startDate < today) {
        errors.startDate = 'La fecha de inicio no puede ser anterior a hoy';
      }
    }

    if (!formData.endDate) {
      errors.endDate = 'La fecha de fin es requerida';
    } else {
      const endDate = new Date(formData.endDate);
      const startDate = new Date(formData.startDate);
      if (endDate <= startDate) {
        errors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Por favor, corrija los errores en el formulario', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use the custom slug if provided, otherwise generate from title
      const slug = formData.slug.trim() ? 
        formData.slug.toLowerCase().replace(/\s+/g, '-') : 
        formData.title.toLowerCase().replace(/\s+/g, '-');
      
      const campaignData = {
        ...formData,
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: Timestamp.fromDate(new Date(formData.endDate)),
        slug,
        businesses: selectedBusinesses
      };

      if (editingCampaign) {
        // Update existing campaign
        await updateDoc(doc(db, 'campaigns', editingCampaign.id), campaignData);
        showNotification('La campaña ha sido actualizada correctamente', 'success');
      } else {
        // Create new campaign
        const newCampaignRef = doc(collection(db, 'campaigns'));
        await setDoc(newCampaignRef, campaignData);
        showNotification('La campaña ha sido creada correctamente', 'success');
      }

      // Navigate back to campaigns list after a short delay
      setTimeout(() => {
        navigate('/superadmin/campaigns');
      }, 1500);

    } catch (err) {
      console.error('Error saving campaign:', err);
      showNotification('Error al guardar la campaña', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle business selection
  const handleBusinessSelection = (businessId: string) => {
    if (selectedBusinesses.includes(businessId)) {
      setSelectedBusinesses(prev => prev.filter(id => id !== businessId));
    } else {
      setSelectedBusinesses(prev => [...prev, businessId]);
    }
  };

  // Filter businesses based on search
  const filteredBusinesses = availableBusinesses.filter(business =>
    business.name.toLowerCase().includes(searchBusiness.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/superadmin/campaigns')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900">
          {editingCampaign ? 'Editar campaña' : 'Nueva campaña'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Título *
          </label>
          <input
            id="title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, title: e.target.value }));
              setFormErrors(prev => ({ ...prev, title: '' }));
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.title ? 'border-red-500' : 'border-gray-300'}`}
          />
          {formErrors.title && (
            <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            Slug URL
          </label>
          <div className="flex items-center">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              /campanas/
            </span>
            <input
              id="slug"
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() }))}
              placeholder={formData.title ? formData.title.toLowerCase().replace(/\s+/g, '-') : 'url-amigable'}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500">Identificador único para la URL de la campaña. Si se deja vacío, se generará automáticamente a partir del título.</p>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
            Tema/Categoría
          </label>
          <input
            id="theme"
            type="text"
            value={formData.theme}
            onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
            placeholder="Ej: Verano, Navidad, Descuentos"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descripción *
          </label>
          <textarea
            id="description"
            required
            value={formData.description}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, description: e.target.value }));
              setFormErrors(prev => ({ ...prev, description: '' }));
            }}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`}
          />
          {formErrors.description && (
            <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
          )}
          <p className="text-xs text-gray-500">Describe los detalles de la campaña, beneficios y condiciones.</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Imagen de portada
          </label>
          <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {formData.imageUrl ? (
              <div className="relative w-full sm:w-32 h-32 border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={formData.imageUrl}
                  alt="Portada de campaña"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={uploading}
                  className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Eliminar imagen"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="w-full sm:w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
            )}
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Subiendo...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Subir imagen
                  </span>
                )}
              </label>
              <p className="text-xs text-gray-500">Recomendado: 1200 x 630 px. Formato JPG o PNG.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Fecha de inicio *
            </label>
            <input
              id="startDate"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, startDate: e.target.value }));
                setFormErrors(prev => ({ ...prev, startDate: '' }));
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.startDate ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.startDate && (
              <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              Fecha de fin *
            </label>
            <input
              id="endDate"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, endDate: e.target.value }));
                setFormErrors(prev => ({ ...prev, endDate: '' }));
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.endDate ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.endDate && (
              <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Comercios participantes
          </label>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar comercios..."
                value={searchBusiness}
                onChange={(e) => setSearchBusiness(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
              {filteredBusinesses.length > 0 ? (
                filteredBusinesses.map(business => (
                  <label
                    key={business.id}
                    className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${selectedBusinesses.includes(business.id) ? 'bg-blue-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBusinesses.includes(business.id)}
                      onChange={() => handleBusinessSelection(business.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 flex-1">{business.name}</span>
                    {selectedBusinesses.includes(business.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                ))
              ) : (
                <div className="p-3 text-center text-gray-500">
                  No se encontraron comercios
                </div>
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{selectedBusinesses.length} comercios seleccionados</span>
              {selectedBusinesses.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => setSelectedBusinesses([])} 
                  className="text-blue-600 hover:text-blue-800"
                >
                  Limpiar selección
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/superadmin/campaigns')}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {editingCampaign ? 'Guardando...' : 'Creando...'}
              </span>
            ) : (
              editingCampaign ? 'Guardar cambios' : 'Crear campaña'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}