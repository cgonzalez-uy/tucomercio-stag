import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp, query, where, orderBy } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, deleteObject } from 'firebase/storage';
import type { Banner } from '../../types/banner';

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const bannersRef = collection(db, 'banners');
      const q = query(bannersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const bannersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Banner[];

      setBanners(bannersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError('Error al cargar los banners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const createBanner = async (data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'banners'), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchBanners();
      return docRef.id;
    } catch (err) {
      console.error('Error creating banner:', err);
      throw new Error('Error al crear el banner');
    }
  };

  const updateBanner = async (id: string, data: Partial<Banner>) => {
    try {
      const bannerRef = doc(db, 'banners', id);
      await updateDoc(bannerRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      await fetchBanners();
    } catch (err) {
      console.error('Error updating banner:', err);
      throw new Error('Error al actualizar el banner');
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      const banner = banners.find(b => b.id === id);
      if (banner?.image) {
        try {
          const imageRef = ref(storage, banner.image);
          await deleteObject(imageRef);
        } catch (err) {
          console.error('Error deleting banner image:', err);
        }
      }
      await deleteDoc(doc(db, 'banners', id));
      await fetchBanners();
    } catch (err) {
      console.error('Error deleting banner:', err);
      throw new Error('Error al eliminar el banner');
    }
  };

  // Get active banners for the current date
  const getActiveBanners = useCallback(() => {
    const now = new Date();
    return banners.filter(banner => 
      banner.isActive &&
      new Date(banner.startDate.seconds * 1000) <= now &&
      new Date(banner.endDate.seconds * 1000) >= now
    );
  }, [banners]);

  return {
    banners,
    loading,
    error,
    createBanner,
    updateBanner,
    deleteBanner,
    getActiveBanners
  };
}