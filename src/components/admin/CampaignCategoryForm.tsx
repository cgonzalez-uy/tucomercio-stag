import { useState, useEffect } from 'react';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import type { CampaignCategory } from '../../types/campaign-category';

interface CampaignCategoryFormProps {
  category?: CampaignCategory;
  onSave?: () => void;
  onCancel?: () => void;
}

export function CampaignCategoryForm({ category, onSave, onCancel }: CampaignCategoryFormProps) {
  const [formData, setFormData] = useState<Omit<CampaignCategory, 'id' | 'createdAt' | 'updatedAt'>>(() => {
    if (category) {
      return {
        name: category.name,
        description: category.description || '',
        imageUrl: category.imageUrl,
        slug: category.slug,
        backgroundColor: category.backgroundColor || '#FFFFFF',
        textColor: category.textColor || '#000000',
        isActive: category.isActive,
        order: category.order
      };
    }
    return {
      name: '',
      description: '',
      imageUrl: '',
      slug: '',
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      isActive: true,
      order: 0
    };
  });

  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>(
    {show: false, message: '', type: 'success'}
  );

  // Show notification function
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({show: true, message, type});
    setTimeout(() => {
      setNotification(prev => ({...prev, show: false}));
    }, 3000);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `campaign-categories/${file.name}`);
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

    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (!formData.imageUrl) {
      errors.imageUrl = 'La imagen es requerida';
    }

    if (!formData.slug.trim()) {
      errors.slug = 'El slug es requerido';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'El slug solo puede contener letras minúsculas, números y guiones';
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
      const categoryData = {
        ...formData,
        updatedAt: Timestamp.now()
      };

      if (category) {
        // Update existing category
        await updateDoc(doc(db, 'campaign-categories', category.id), categoryData);
        showNotification('La categoría ha sido actualizada correctamente', 'success');
      } else {
        // Create new category
        const newCategoryRef = doc(collection(db, 'campaign-categories'));
        await setDoc(newCategoryRef, {
          ...categoryData,
          createdAt: Timestamp.now()
        });
        showNotification('La categoría ha sido creada correctamente', 'success');
      }

      if (onSave) {
        setTimeout(() => {
          onSave();
        }, 1500);
      }

    } catch (err) {
      console.error('Error saving category:', err);
      showNotification('Error al guardar la categoría', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre *
          </label>
          <div className="relative">
            <input
              id="name"
              type="text"
              required
              placeholder="Ej: Restaurantes, Tiendas de ropa, etc."
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                setFormErrors(prev => ({ ...prev, name: '' }));
                
                // Auto-generate slug if empty
                if (!formData.slug) {
                  setFormData(prev => ({
                    ...prev,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
                  }));
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-300'}`}
            />
            {formData.name && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {formErrors.name}
            </p>
          )}
          <p className="text-xs text-gray-500">Nombre descriptivo para la categoría de campaña.</p>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            Slug URL *
          </label>
          <div className="flex items-center">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              /categorias/
            </span>
            <input
              id="slug"
              type="text"
              required
              value={formData.slug}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  slug: e.target.value.replace(/\s+/g, '-').toLowerCase()
                }));
                setFormErrors(prev => ({ ...prev, slug: '' }));
              }}
              className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formErrors.slug ? 'border-red-500' : 'border-gray-300'}`}
            />
          </div>
          {formErrors.slug && (
            <p className="mt-1 text-sm text-red-600">{formErrors.slug}</p>
          )}
          <p className="text-xs text-gray-500">Identificador único para la URL de la categoría.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500">Breve descripción de la categoría (opcional).</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Imagen *
          </label>
          <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {formData.imageUrl ? (
              <div className="relative w-full sm:w-40 h-40 border border-gray-200 rounded-lg overflow-hidden shadow-md">
                <img
                  src={formData.imageUrl}
                  alt="Imagen de categoría"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200"></div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={uploading}
                  className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm transition-all duration-200 transform hover:scale-105"
                  aria-label="Eliminar imagen"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div 
                className={`w-full sm:w-40 h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-gray-50 transition-colors duration-200 ${formErrors.imageUrl ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'}`}
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${formErrors.imageUrl ? 'text-red-400' : 'text-gray-400'} mb-2`}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span className={`text-sm font-medium ${formErrors.imageUrl ? 'text-red-500' : 'text-gray-500'}`}>Haz clic para subir</span>
                <span className="text-xs mt-1 text-gray-400">o arrastra una imagen aquí</span>
              </div>
            )}
            <div className="flex flex-col gap-3 w-full sm:w-auto">
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
                className={`inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow'}`}
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
                    Seleccionar imagen
                  </span>
                )}
              </label>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Recomendado: 400 x 400 px</p>
                <p className="text-xs text-gray-500">Formatos: JPG, PNG, WebP</p>
                <p className="text-xs text-gray-500">Tamaño máximo: 2MB</p>
              </div>
            </div>
          </div>
          {formErrors.imageUrl && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {formErrors.imageUrl}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700">
              Color de fondo
            </label>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-md border border-gray-300" 
                style={{ backgroundColor: formData.backgroundColor }}
              />
              <input
                id="backgroundColor"
                type="color"
                value={formData.backgroundColor}
                onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                className="w-full h-10"
              />
            </div>
            <p className="text-xs text-gray-500">Color de fondo para la tarjeta de categoría.</p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="textColor" className="block text-sm font-medium text-gray-700">
              Color de texto
            </label>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-md border border-gray-300" 
                style={{ backgroundColor: formData.textColor }}
              />
              <input
                id="textColor"
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                className="w-full h-10"
              />
            </div>
            <p className="text-xs text-gray-500">Color del texto para mejor contraste.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="order" className="block text-sm font-medium text-gray-700">
            Orden de visualización
          </label>
          <input
            id="order"
            type="number"
            min="0"
            value={formData.order}
            onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500">Orden de visualización (menor número = mayor prioridad).</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Categoría activa
            </label>
          </div>
          <p className="text-xs text-gray-500">Las categorías inactivas no se mostrarán en el sitio.</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {category ? 'Guardando...' : 'Creando...'}
              </span>
            ) : (
              category ? 'Guardar cambios' : 'Crear categoría'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}