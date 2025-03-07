import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp, getDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { isSuperAdmin } from '../auth';
import { ref, deleteObject } from 'firebase/storage';
import type { Business } from '../../types/business';

export function useBusinesses() {
  const [user] = useAuthState(auth);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async () => {
    try {
      setIsLoading(true);
      const querySnapshot = await getDocs(collection(db, 'businesses'));
      const businessesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Business[];

      // Si no es admin, solo mostrar comercios activos
      const filteredBusinesses = user && isSuperAdmin(user)
        ? businessesData
        : businessesData.filter(b => b.isActive);

      setBusinesses(filteredBusinesses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setError(null);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Error al cargar los comercios.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const getBusiness = useCallback((id: string) => {
    return businesses.find(business => business.id === id);
  }, [businesses]);

  const createBusiness = useCallback(async (businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'businesses'), {
        ...businessData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchBusinesses();
      return docRef.id;
    } catch (err) {
      console.error('Error creating business:', err);
      throw new Error('Error al crear el comercio.');
    }
  }, [fetchBusinesses]);

  const updateBusiness = useCallback(async (id: string, businessData: Partial<Business>) => {
    try {
      // Get current business data
      const businessRef = doc(db, 'businesses', id);
      const businessDoc = await getDoc(businessRef);
      
      if (!businessDoc.exists()) {
        throw new Error('Comercio no encontrado');
      }

      const currentData = businessDoc.data();

      // If updating gallery and removing images, delete them from storage
      if (businessData.gallery && currentData.gallery) {
        const removedImages = currentData.gallery.filter(img => !businessData.gallery?.includes(img));
        
        // Delete removed images from storage
        for (const imageUrl of removedImages) {
          try {
            // Extract the path from the URL
            const path = decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0]);
            const imageRef = ref(storage, path);
            await deleteObject(imageRef);
          } catch (err) {
            console.error('Error deleting image from storage:', err);
          }
        }
      }

      // Update business document
      await updateDoc(businessRef, {
        ...businessData,
        updatedAt: Timestamp.now()
      });

      await fetchBusinesses();
    } catch (err) {
      console.error('Error updating business:', err);
      throw err instanceof Error ? err : new Error('Error al actualizar el comercio.');
    }
  }, [fetchBusinesses]);

  const deleteBusiness = useCallback(async (id: string) => {
    if (!user || !isSuperAdmin(user)) {
      throw new Error('No tienes permisos para eliminar comercios.');
    }

    try {
      // Get business data to delete images
      const businessRef = doc(db, 'businesses', id);
      const businessDoc = await getDoc(businessRef);
      
      if (businessDoc.exists()) {
        const businessData = businessDoc.data();

        // Delete main image if exists
        if (businessData.image) {
          try {
            const path = decodeURIComponent(businessData.image.split('/o/')[1].split('?')[0]);
            const imageRef = ref(storage, path);
            await deleteObject(imageRef);
          } catch (err) {
            console.error('Error deleting main image:', err);
          }
        }

        // Delete gallery images if exist
        if (businessData.gallery) {
          for (const imageUrl of businessData.gallery) {
            try {
              const path = decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0]);
              const imageRef = ref(storage, path);
              await deleteObject(imageRef);
            } catch (err) {
              console.error('Error deleting gallery image:', err);
            }
          }
        }
      }

      // Delete business document
      await deleteDoc(businessRef);
      await fetchBusinesses();
    } catch (err) {
      console.error('Error deleting business:', err);
      throw new Error('Error al eliminar el comercio.');
    }
  }, [user, fetchBusinesses]);

  return {
    businesses,
    loading: isLoading,
    error,
    getBusiness,
    createBusiness,
    updateBusiness,
    deleteBusiness
  };
}