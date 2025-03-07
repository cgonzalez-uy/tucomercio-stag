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
import { db, auth } from '../firebase';
import type { Coupon } from '../../types/coupon';

export function useCoupons(businessId: string | undefined) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to coupons
  useEffect(() => {
    if (!businessId) {
      setCoupons([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'coupons'),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Coupon[]);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching coupons:', err);
      setError('Error al cargar los cupones');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [businessId]);

  const createCoupon = async (data: Omit<Coupon, 'id' | 'businessId' | 'currentUses' | 'createdAt' | 'updatedAt'>) => {
    if (!businessId) {
      throw new Error('No se encontró el ID del comercio');
    }

    try {
      // Use a transaction to ensure atomicity
      const couponRef = doc(collection(db, 'coupons'));
      
      await runTransaction(db, async (transaction) => {
        // Get business info for notifications
        const businessDoc = await transaction.get(doc(db, 'businesses', businessId));
        if (!businessDoc.exists()) {
          throw new Error('Comercio no encontrado');
        }

        const businessData = businessDoc.data();

        // Create coupon
        transaction.set(couponRef, {
          ...data,
          id: couponRef.id,
          businessId,
          currentUses: 0,
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
          type: 'new_coupon',
          businessId,
          businessName: businessData.name,
          businessPhotoURL: businessData.image || null,
          couponId: couponRef.id,
          couponCode: data.code,
          couponDiscount: data.discount,
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

      return couponRef.id;
    } catch (err) {
      console.error('Error creating coupon:', err);
      throw err instanceof Error ? err : new Error('Error al crear el cupón');
    }
  };

  const updateCoupon = async (id: string, data: Partial<Coupon>) => {
    if (!businessId) {
      throw new Error('No se encontró el ID del comercio');
    }

    try {
      const couponRef = doc(db, 'coupons', id);
      await updateDoc(couponRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating coupon:', err);
      throw err instanceof Error ? err : new Error('Error al actualizar el cupón');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!businessId) {
      throw new Error('No se encontró el ID del comercio');
    }

    try {
      await deleteDoc(doc(db, 'coupons', id));
    } catch (err) {
      console.error('Error deleting coupon:', err);
      throw err instanceof Error ? err : new Error('Error al eliminar el cupón');
    }
  };

  const useCoupon = async (coupon: Coupon) => {
    if (!businessId || !auth.currentUser) {
      throw new Error('No se encontró el ID del comercio o el usuario no está autenticado');
    }

    try {
      // Use a transaction to ensure atomicity
      await runTransaction(db, async (transaction) => {
        // Get current coupon data
        const couponRef = doc(db, 'coupons', coupon.id);
        const couponDoc = await transaction.get(couponRef);

        if (!couponDoc.exists()) {
          throw new Error('El cupón ya no está disponible');
        }

        const couponData = couponDoc.data();
        const now = serverTimestamp();

        // Validate coupon
        if (!couponData.isActive) {
          throw new Error('El cupón ya no está activo');
        }

        if (couponData.currentUses >= couponData.maxUses) {
          throw new Error(`El cupón ha alcanzado el máximo de usos (${couponData.maxUses})`);
        }

        // Check if user has already used this coupon
        const usedCouponsRef = collection(db, 'used_coupons');
        const usedCouponQuery = query(
          usedCouponsRef,
          where('userId', '==', auth.currentUser.uid),
          where('couponId', '==', coupon.id)
        );
        const usedCouponSnapshot = await getDocs(usedCouponQuery);

        if (!usedCouponSnapshot.empty) {
          throw new Error('Ya has usado este cupón');
        }

        // Update coupon usage
        transaction.update(couponRef, {
          currentUses: (couponData.currentUses || 0) + 1,
          updatedAt: now
        });

        // Create used coupon record
        const usedCouponRef = doc(collection(db, 'used_coupons'));
        transaction.set(usedCouponRef, {
          userId: auth.currentUser.uid,
          couponId: coupon.id,
          businessId,
          code: coupon.code,
          title: coupon.title,
          discount: coupon.discount,
          usedAt: now,
          expiresAt: coupon.endDate
        });
      });
    } catch (err) {
      console.error('Error using coupon:', err);
      throw err instanceof Error ? err : new Error('Error al usar el cupón');
    }
  };

  return {
    coupons,
    loading,
    error,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    useCoupon
  };
}