import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import type { CampaignCategory } from '../../types/campaign-category';
import { CategoryCard } from './CategoryCard';

export function CategoryManager() {
  const [categories, setCategories] = useState<CampaignCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    backgroundColor: '#f3f4f6',
    textColor: '#1f2937',
    isActive: true,
    order: 0
  });
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesQuery = query(
        collection(db, 'campaign-categories'),
        orderBy('order')
      );
      const snapshot = await getDocs(categoriesQuery);
      const categoriesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CampaignCategory[];
      setCategories(categoriesList);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `category-images/${file.name}`);
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
      const categoryData = {
        ...formData,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
        createdAt: editingId ? undefined : Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (editingId) {
        await updateDoc(doc(db, 'campaign-categories', editingId), categoryData);
      } else {
        const newCategoryRef = doc(collection(db, 'campaign-categories'));
        await setDoc(newCategoryRef, categoryData);
      }

      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        backgroundColor: '#f3f4f6',
        textColor: '#1f2937',
        isActive: true,
        order: categories.length
      });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  const handleEdit = (category: CampaignCategory) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl,
      backgroundColor: category.backgroundColor || '#f3f4f6',
      textColor: category.textColor || '#1f2937',
      isActive: category.isActive,
      order: category.order
    });
    setEditingId(category.id);
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'campaign-categories', categoryId));
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
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
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold">
          {editingId ? 'Editar categoría' : 'Nueva categoría'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700">
              Color de fondo
            </label>
            <input
              id="backgroundColor"
              type="color"
              value={formData.backgroundColor}
              onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
              className="h-10 w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="textColor" className="block text-sm font-medium text-gray-700">
              Color de texto
            </label>
            <input
              id="textColor"
              type="color"
              value={formData.textColor}
              onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
              className="h-10 w-full"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Imagen *
            </label>
            <div className="flex items-center gap-4">
              {formData.imageUrl && (
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="h-20 w-20 object-cover rounded-lg"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
                required={!formData.imageUrl}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Categoría activa</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: '',
                  description: '',
                  imageUrl: '',
                  backgroundColor: '#f3f4f6',
                  textColor: '#1f2937',
                  isActive: true,
                  order: categories.length
                });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : editingId ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="relative group">
            <CategoryCard category={category} />
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEdit(category)}
                className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}