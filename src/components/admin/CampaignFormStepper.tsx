import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import type { Campaign } from '../../types/campaign';
import type { CampaignCategory } from '../../types/campaign-category';
import type { Business } from '../../types/business';
import { CategoryCard } from './CategoryCard';
import { BusinessSelector } from './BusinessSelector';
import { CategoryCardWithBusinesses } from './CategoryCardWithBusinesses';
import { CampaignCategoryForm } from './CampaignCategoryForm';

interface CampaignFormStepperProps {
  onSubmit: (data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Campaign;
  onCancel: () => void;
}

interface FormData extends Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> {
  startDate: string;
  endDate: string;
  selectedCategory?: CampaignCategory;
  categoryBusinesses: { [categoryId: string]: string[] }; // Map of category IDs to business IDs
}

export function CampaignFormStepper({ onSubmit, initialData, onCancel }: CampaignFormStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState<CampaignCategory[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CampaignCategory | null>(null);
  
  // Get campaign ID from URL if in edit mode
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) {
      return {
        title: initialData.title,
        description: initialData.description,
        imageUrl: initialData.imageUrl || '',
        startDate: new Date(initialData.startDate.seconds * 1000).toISOString().split('T')[0],
        endDate: new Date(initialData.endDate.seconds * 1000).toISOString().split('T')[0],
        isActive: initialData.isActive,
        businesses: initialData.businesses || [],
        pendingRequests: initialData.pendingRequests || [],
        metrics: initialData.metrics || {
          views: 0,
          clicks: 0,
          participantCount: 0
        },
        slug: initialData.slug || '',
        theme: initialData.theme || '',
        categoryBusinesses: {}
      };
    }
    return {
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
      theme: '',
      categoryBusinesses: {}
    };
  });

  const steps = [
    { title: 'Información básica', description: 'Título, descripción y fechas' },
    { title: 'Imagen', description: 'Imagen de portada' },
    { title: 'Comercios', description: 'Selección de comercios participantes' },
    { title: 'Categorías de campaña', description: 'Crear y asignar comercios a categorías' },
    { title: 'Revisión', description: 'Revisar y confirmar' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Fetch categories and businesses
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesQuery = query(
          collection(db, 'campaign-categories'),
          orderBy('order')
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesList = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CampaignCategory[];
        setCategories(categoriesList);
        
        // Fetch businesses
        const businessesQuery = query(collection(db, 'businesses'));
        const businessesSnapshot = await getDocs(businessesQuery);
        const businessesList = businessesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Business[];
        setBusinesses(businessesList);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

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
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        theme: formData.selectedCategory?.slug || ''
      });
    } catch (err) {
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: CampaignCategory) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleSaveCategory = (category: CampaignCategory) => {
    if (editingCategory) {
      // Update existing category
      setCategories(prev => prev.map(c => c.id === category.id ? category : c));
    } else {
      // Add new category
      const newCategory = {
        ...category,
        id: `temp-${Date.now()}`,
        order: categories.length
      };
      setCategories(prev => [...prev, newCategory]);
    }
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <nav aria-label="Progress">
        {/* Mobile stepper - only visible on small screens */}
        <div className="md:hidden">
          <div className="bg-white px-4 py-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <button 
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`p-2 rounded-full ${currentStep === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <div className="text-center">
                <p className="text-xs font-semibold tracking-wide uppercase text-blue-600">
                  PASO {currentStep + 1} DE {steps.length}
                </p>
                <h3 className="text-sm font-medium mt-1">{steps[currentStep].title}</h3>
                <p className="text-xs text-gray-500 mt-1">{steps[currentStep].description}</p>
              </div>
              
              <button 
                type="button"
                onClick={handleNext}
                disabled={currentStep === steps.length - 1}
                className={`p-2 rounded-full ${currentStep === steps.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Desktop stepper - hidden on mobile */}
        <ol role="list" className="hidden md:flex md:space-y-0 md:space-x-8">
          {steps.map((step, index) => (
            <li key={step.title} className="md:flex-1">
              <div className="group pl-4 py-2 flex flex-col border-l-4 hover:border-gray-300 md:pl-0 md:pt-4 md:pb-0 md:border-l-0 md:border-t-4">
                <span className={`text-xs font-semibold tracking-wide uppercase ${index === currentStep ? 'text-blue-600' : index < currentStep ? 'text-gray-900' : 'text-gray-500'}`}>
                  PASO {index + 1}
                </span>
                <span className="text-sm font-medium">{step.title}</span>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* Step content */}
      <div className="mt-8 space-y-6">
        {currentStep === 0 && (
          <div className="space-y-6">
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
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Imagen de portada *
              </label>
              <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {formData.imageUrl ? (
                  <div className="relative w-full sm:w-32 h-32 border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={formData.imageUrl}
                      alt="Portada de campaña"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full sm:w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="flex flex-col space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                    id="campaign-image"
                  />
                  <label
                    htmlFor="campaign-image"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {uploading ? 'Subiendo...' : 'Seleccionar imagen'}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Selecciona los comercios participantes
              </label>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium mb-4">Comercios disponibles</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Selecciona los comercios que participarán en esta campaña. Puedes filtrar por categoría usando el menú desplegable.
                </p>
                <BusinessSelector
                  selectedBusinesses={formData.businesses}
                  onBusinessSelect={(businessId) => {
                    setFormData(prev => ({
                      ...prev,
                      businesses: [...prev.businesses, businessId]
                    }));
                  }}
                  onBusinessDeselect={(businessId) => {
                    setFormData(prev => ({
                      ...prev,
                      businesses: prev.businesses.filter(id => id !== businessId)
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Categorías de la campaña
                </label>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Agregar categoría
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="relative group">
                    <CategoryCardWithBusinesses
                      category={category}
                      selectedBusinesses={formData.categoryBusinesses[category.id] || []}
                      availableBusinesses={formData.businesses.map(businessId => {
                        const business = businesses.find(b => b.id === businessId);
                        return business || { id: businessId, name: 'Comercio no encontrado' };
                      })}
                      onBusinessesAssigned={(businessIds) => {
                        setFormData(prev => ({
                          ...prev,
                          categoryBusinesses: {
                            ...prev.categoryBusinesses,
                            [category.id]: businessIds
                          },
                          selectedCategory: category
                        }));
                      }}
                      onDeleteCategory={(categoryId) => {
                        setCategories(prev => prev.filter(c => c.id !== categoryId));
                        setFormData(prev => {
                          const newCategoryBusinesses = { ...prev.categoryBusinesses };
                          delete newCategoryBusinesses[categoryId];
                          return {
                            ...prev,
                            categoryBusinesses: newCategoryBusinesses,
                            selectedCategory: prev.selectedCategory?.id === categoryId ? undefined : prev.selectedCategory
                          };
                        });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleEditCategory(category)}
                      className="absolute top-2 right-2 p-1 bg-white bg-opacity-80 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Editar categoría"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Category Form Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {editingCategory ? 'Editar categoría' : 'Agregar nueva categoría'}
                      </h3>
                      <div className="mt-4">
                        <CampaignCategoryForm 
                          category={editingCategory || undefined}
                          onSave={() => {
                            setShowCategoryForm(false);
                            setEditingCategory(null);
                          }}
                          onCancel={() => {
                            setShowCategoryForm(false);
                            setEditingCategory(null);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Resumen de la campaña</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Información básica</h4>
                  <p className="text-base font-medium">{formData.title}</p>
                  <p className="text-sm text-gray-600">{formData.description}</p>
                  <div className="flex space-x-4 mt-2">
                    <p className="text-sm"><span className="font-medium">Inicio:</span> {formData.startDate}</p>
                    <p className="text-sm"><span className="font-medium">Fin:</span> {formData.endDate}</p>
                  </div>
                </div>
                
                {formData.imageUrl && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Imagen</h4>
                    <div className="mt-1 w-32 h-32 border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={formData.imageUrl}
                        alt="Portada de campaña"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Comercios seleccionados ({formData.businesses.length})</h4>
                  {formData.businesses.length > 0 ? (
                    <ul className="mt-1 text-sm">
                      {formData.businesses.slice(0, 5).map(businessId => {
                        const business = businesses.find(b => b.id === businessId);
                        return (
                          <li key={businessId}>{business?.name || 'Comercio no encontrado'}</li>
                        );
                      })}
                      {formData.businesses.length > 5 && (
                        <li className="text-gray-500">Y {formData.businesses.length - 5} más...</li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No hay comercios seleccionados</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        
        <div className="flex space-x-2">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Anterior
            </button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar campaña'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}