import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import type { Campaign } from '../../types/campaign';

export function CampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
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

  // Show notification function
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({show: true, message, type});
    setTimeout(() => {
      setNotification(prev => ({...prev, show: false}));
    }, 3000);
  };

  // Fetch campaigns and businesses
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch campaigns
        const campaignsQuery = query(
          collection(db, 'campaigns'),
          orderBy('startDate', 'desc')
        );
        
        const snapshot = await getDocs(campaignsQuery);
        const campaignsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Campaign[];
        
        setCampaigns(campaignsList);
        
        // Fetch businesses for selection
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
        console.error('Error fetching data:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      // Reset form and refresh list
      setShowDialog(false);
      setEditingCampaign(null);
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        startDate: '',
        endDate: '',
        isActive: true,
        businesses: [],
        pendingRequests: [],
        metrics: {
          views: 0,
          clicks: 0,
          participantCount: 0
        },
        slug: '',
        theme: ''
      });
      setSelectedBusinesses([]);
      
      // Refresh campaigns list
      const campaignsQuery = query(
        collection(db, 'campaigns'),
        orderBy('startDate', 'desc')
      );
      const snapshot = await getDocs(campaignsQuery);
      const campaignsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[];
      setCampaigns(campaignsList);

    } catch (err) {
      console.error('Error saving campaign:', err);
      showNotification('Error al guardar la campaña', 'error');
    }
  };

  // Handle campaign deletion
  const handleDelete = async (campaignId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta campaña?')) return;

    try {
      await deleteDoc(doc(db, 'campaigns', campaignId));
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      showNotification('La campaña ha sido eliminada correctamente', 'success');
    } catch (err) {
      console.error('Error deleting campaign:', err);
      showNotification('Error al eliminar la campaña', 'error');
    }
  };

  // Filter campaigns based on search term
  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              <path d="M5 3v4" />
              <path d="M19 17v4" />
              <path d="M3 5h4" />
              <path d="M17 19h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Campañas Promocionales</h2>
            <p className="text-sm text-gray-500">
              {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'campaña' : 'campañas'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/superadmin/campaigns/new')}
          className="w-full sm:w-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Nueva campaña
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Buscar campañas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {/* Campaigns List */}
      <div className="grid gap-4">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron campañas
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega una nueva campaña para empezar'}
            </p>
          </div>
        ) : (
          filteredCampaigns.map(campaign => (
            <div
              key={campaign.id}
              className="bg-white border rounded-lg overflow-hidden shadow-sm"
            >
              <div className="flex flex-col sm:flex-row">
                {campaign.imageUrl ? (
                  <div className="sm:w-48 h-48 shrink-0">
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="sm:w-48 h-48 bg-primary/5 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/40">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                  </div>
                )}
                
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{campaign.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{campaign.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/superadmin/campaigns/edit/${campaign.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" x2="10" y1="11" y2="17" />
                          <line x1="14" x2="14" y1="11" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                      <span className={campaign.isActive ? 'text-green-600' : 'text-red-600'}>●</span>
                      {campaign.isActive ? 'Activa' : 'Inactiva'}
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                      {new Date(campaign.startDate.seconds * 1000).toLocaleDateString()} - {new Date(campaign.endDate.seconds * 1000).toLocaleDateString()}
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                      {campaign.businesses.length} comercios
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-500">Vistas</p>
                      <p className="font-medium">{campaign.metrics?.views || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-500">Clics</p>
                      <p className="font-medium">{campaign.metrics?.clicks || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-500">Solicitudes</p>
                      <p className="font-medium">{campaign.pendingRequests?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Campaign Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCampaign ? 'Editar campaña' : 'Nueva campaña'}
                </h3>
                <button 
                  onClick={() => setShowDialog(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Título *
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                  <label className="block text-sm font-medium text-gray-700">
                    Comercios participantes
                  </label>
                  <div className="border border-gray-300 rounded-md p-2 space-y-2">
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Buscar comercios..."
                        value={searchBusiness}
                        onChange={(e) => setSearchBusiness(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="max-h-40 overflow-y-auto">
                      {availableBusinesses
                        .filter(business => business.name.toLowerCase().includes(searchBusiness.toLowerCase()))
                        .map(business => (
                          <div key={business.id} className="flex items-center p-2 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              id={`business-${business.id}`}
                              checked={selectedBusinesses.includes(business.id)}
                              onChange={() => {
                                if (selectedBusinesses.includes(business.id)) {
                                  setSelectedBusinesses(prev => prev.filter(id => id !== business.id));
                                } else {
                                  setSelectedBusinesses(prev => [...prev, business.id]);
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`business-${business.id}`} className="ml-2 block text-sm text-gray-900">
                              {business.name}
                            </label>
                          </div>
                        ))}
                      
                      {availableBusinesses.filter(business => 
                        business.name.toLowerCase().includes(searchBusiness.toLowerCase())
                      ).length === 0 && (
                        <div className="p-3 text-center text-sm text-gray-500">
                          No se encontraron comercios
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2">
                        {selectedBusinesses.length > 0 ? (
                          availableBusinesses
                            .filter(business => selectedBusinesses.includes(business.id))
                            .map(business => (
                              <div key={business.id} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                                {business.name}
                                <button
                                  type="button"
                                  onClick={() => setSelectedBusinesses(prev => prev.filter(id => id !== business.id))}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))
                        ) : (
                          <p className="text-xs text-gray-500">No hay comercios seleccionados</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{selectedBusinesses.length} comercios seleccionados</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Descripción *
                  </label>
                  <textarea
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Fecha de inicio *
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={formData.isActive}
                        onChange={() => setFormData(prev => ({ ...prev, isActive: true }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">Activa</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={!formData.isActive}
                        onChange={() => setFormData(prev => ({ ...prev, isActive: false }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">Inactiva</span>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Imagen de la campaña
                  </label>
                  {formData.imageUrl ? (
                    <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        disabled={uploading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-3">
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                            <line x1="16" x2="22" y1="5" y2="5" />
                            <line x1="19" x2="19" y1="2" y2="8" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 2MB)</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  )}
                  {uploading && (
                    <div className="mt-2 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-500">Subiendo imagen...</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowDialog(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editingCampaign ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}