import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  getDocs,
  getDoc,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Promotion } from '../../types/promotion';

export function usePromotions(businessId: string | undefined) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to promotions
  useEffect(() => {
    if (!businessId) {
      setPromotions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'promotions'),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPromotions(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Promotion[]);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching promotions:', err);
      setError('Error al cargar las promociones');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [businessId]);

  const createPromotion = async (data: Omit<Promotion, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>) => {
    if (!businessId) {
      throw new Error('No se encontró el ID del comercio');
    }

    try {
      // Use a transaction to ensure atomicity
      const promotionRef = doc(collection(db, 'promotions'));
      
      await runTransaction(db, async (transaction) => {
        // Get business info for notifications
        const businessDoc = await transaction.get(doc(db, 'businesses', businessId));
        if (!businessDoc.exists()) {
          throw new Error('Comercio no encontrado');
        }

        const businessData = businessDoc.data();

        // Create promotion
        transaction.set(promotionRef, {
          ...data,
          id: promotionRef.id,
          businessId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Get users who have this business in favorites
        const usersWithFavorites = await getDocs(
          query(collection(db, 'users'), where('favorites', 'array-contains', businessId))
        );

        // Create notification
        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          type: 'new_promotion',
          businessId,
          businessName: businessData.name,
          businessPhotoURL: businessData.image || null,
          promotionId: promotionRef.id,
          promotionTitle: data.title,
          promotionDiscount: data.discount,
          read: false,
          recipientId: businessId,
          createdAt: serverTimestamp()
        });

        // Create recipient records in subcollection for each user
        usersWithFavorites.docs.forEach(userDoc => {
          const recipientRef = doc(collection(db, `notifications/${notificationRef.id}/recipients`));
          transaction.set(recipientRef, {
            userId: userDoc.id,
            read: false,
            createdAt: serverTimestamp()
          });
        });
      });

      return promotionRef.id;
    } catch (err) {
      console.error('Error creating promotion:', err);
      throw err instanceof Error ? err : new Error('Error al crear la promoción');
    }
  };

  const updatePromotion = async (id: string, data: Partial<Promotion>) => {
    if (!businessId) {
      throw new Error('No se encontró el ID del comercio');
    }

    try {
      const promotionRef = doc(db, 'promotions', id);
      await updateDoc(promotionRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating promotion:', err);
      throw err instanceof Error ? err : new Error('Error al actualizar la promoción');
    }
  };

  const deletePromotion = async (id: string) => {
    if (!businessId) {
      throw new Error('No se encontró el ID del comercio');
    }

    try {
      await deleteDoc(doc(db, 'promotions', id));
    } catch (err) {
      console.error('Error deleting promotion:', err);
      throw err instanceof Error ? err : new Error('Error al eliminar la promoción');
    }
  };

  return {
    promotions,
    loading,
    error,
    createPromotion,
    updatePromotion,
    deletePromotion
  };
}