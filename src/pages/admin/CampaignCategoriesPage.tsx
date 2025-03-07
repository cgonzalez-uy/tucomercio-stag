import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CampaignCategoryForm } from '../../components/admin/CampaignCategoryForm';
import type { CampaignCategory } from '../../types/campaign-category';

export function CampaignCategoriesPage() {
  const [categories, setCategories] = useState<CampaignCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CampaignCategory | null>(null);
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>(
    {show: false, message: '', type: 'success'}
  );
  const [confirmDelete, setConfirmDelete] = useState<{show: boolean, category: CampaignCategory | null}>(
    {show: false, category: null}
  );

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
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
    } catch (err) {
      console.error('Error fetching categories:', err);
      showNotification('Error al cargar las categorías', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Show notification function
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({show: true, message, type});
    setTimeout(() => {
      setNotification(prev => ({...prev, show: false}));
    }, 3000);
  };

  // Handle category deletion
  const handleDeleteCategory = async (category: CampaignCategory) => {
    try {
      await deleteDoc(doc(db, 'campaign-categories', category.id));
      showNotification('Categoría eliminada correctamente', 'success');
      fetchCategories();
      setConfirmDelete({show: false, category: null});
    } catch (err) {
      console.error('Error deleting category:', err);
      showNotification('Error al eliminar la categoría', 'error');
    }
  };

  // Handle edit category
  const handleEditCategory = (category: CampaignCategory) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  // Handle form save
  const handleFormSave = () => {
    fetchCategories();
    setShowForm(false);
    setEditingCategory(null);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete.show && confirmDelete.category && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-gray-500 mb-6">
              ¿Estás seguro de que deseas eliminar la categoría <strong>{confirmDelete.category.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete({show: false, category: null})}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteCategory(confirmDelete.category!)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {editingCategory ? 'Editar categoría' : 'Nueva categoría'}
            </h2>
            <button
              onClick={handleFormCancel}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <CampaignCategoryForm 
            category={editingCategory || undefined}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Categorías de campañas</h2>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nueva categoría
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : categories.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <li key={category.id}>
                    <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden">
                          {category.imageUrl ? (
                            <img 
                              src={category.imageUrl} 
                              alt={category.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                            {!category.isActive && (
                              <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Inactiva
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            <span className="mr-3">Slug: /categorias/{category.slug}</span>
                            <span>Orden: {category.order}</span>
                          </div>
                          {category.description && (
                            <p className="mt-1 text-sm text-gray-500 line-clamp-1">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-6 h-6 rounded-full border border-gray-300" 
                          style={{ backgroundColor: category.backgroundColor || '#FFFFFF' }}
                          title="Color de fondo"
                        />
                        <div 
                          className="w-6 h-6 rounded-full border border-gray-300" 
                          style={{ backgroundColor: category.textColor || '#000000' }}
                          title="Color de texto"
                        />
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                          title="Editar categoría"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setConfirmDelete({show: true, category})}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                          title="Eliminar categoría"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white shadow rounded-md p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay categorías</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva categoría para tus campañas.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Crear primera categoría
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}