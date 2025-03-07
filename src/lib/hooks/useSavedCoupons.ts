import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, doc, onSnapshot, Timestamp, runTransaction, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { SavedCoupon } from '../../types/coupon';

export function useSavedCoupons(userId: string | undefined) {
  const [savedCoupons, setSavedCoupons] = useState<SavedCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to user's saved coupons
  useEffect(() => {
    if (!userId) {
      setSavedCoupons([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'saved_coupons'),
      where('userId', '==', userId),
      orderBy('savedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coupons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedCoupon[];

      setSavedCoupons(coupons);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching saved coupons:', err);
      setError('Error al cargar los cupones guardados');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const useCoupon = async (coupon: any) => {
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    if (!coupon?.id) {
      throw new Error('Cupón inválido');
    }

    try {
      // Use a transaction to ensure data consistency
      await runTransaction(db, async (transaction) => {
        // Get coupon to check availability
        const couponRef = doc(db, 'coupons', coupon.id);
        const couponDoc = await transaction.get(couponRef);

        if (!couponDoc.exists()) {
          throw new Error('El cupón ya no está disponible');
        }

        const couponData = couponDoc.data();
        if (!couponData) {
          throw new Error('Error al obtener los datos del cupón');
        }

        const now = Timestamp.now();

        // Validate coupon
        if (!couponData.isActive) {
          throw new Error('El cupón ya no está activo');
        }

        if (couponData.currentUses >= couponData.maxUses) {
          throw new Error(`El cupón ha alcanzado el máximo de usos (${couponData.maxUses})`);
        }

        if (couponData.startDate.seconds > now.seconds) {
          throw new Error('El cupón aún no está disponible');
        }

        if (couponData.endDate.seconds < now.seconds) {
          throw new Error('El cupón ha expirado');
        }

        // Check if user has already used this coupon
        const savedCouponsRef = collection(db, 'saved_coupons');
        const savedCouponsQuery = query(
          savedCouponsRef,
          where('userId', '==', userId),
          where('couponId', '==', coupon.id),
          where('used', '==', true)
        );
        const savedCouponsSnapshot = await transaction.get(savedCouponsQuery);

        if (!savedCouponsSnapshot.empty) {
          throw new Error('Ya has usado este cupón');
        }

        // Create a record of the coupon use
        const savedCouponRef = doc(collection(db, 'saved_coupons'));
        transaction.set(savedCouponRef, {
          userId,
          couponId: coupon.id,
          businessId: coupon.businessId,
          code: coupon.code,
          title: coupon.title,
          discount: coupon.discount,
          used: true,
          usedAt: now,
          expiresAt: coupon.endDate,
          savedAt: now
        });

        // Increment coupon usage
        transaction.update(couponRef, {
          currentUses: (couponData.currentUses || 0) + 1,
          updatedAt: now
        });
      });

      // Show success message with the coupon code
      alert(`¡Cupón aplicado con éxito!\n\nCódigo: ${coupon.code}\nDescuento: ${coupon.discount}%\n\nMuestra este código al comercio para obtener tu descuento.`);
    } catch (err) {
      // Ensure we always throw an Error object with a message
      if (err instanceof Error) {
        throw new Error(err.message || 'Error al usar el cupón');
      } else if (typeof err === 'string') {
        throw new Error(err);
      } else {
        throw new Error('Error al usar el cupón');
      }
    }
  };

  return {
    savedCoupons,
    loading,
    error,
    useCoupon
  };
}