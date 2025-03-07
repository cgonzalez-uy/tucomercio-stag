import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { UsedCoupon } from '../../types/coupon';

export function useUsedCoupons(userId: string | undefined) {
  const [usedCoupons, setUsedCoupons] = useState<UsedCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setUsedCoupons([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'used_coupons'),
      where('userId', '==', userId),
      orderBy('usedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coupons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UsedCoupon[];

      setUsedCoupons(coupons);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching used coupons:', err);
      setError('Error al cargar los cupones utilizados');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return {
    usedCoupons,
    loading,
    error
  };
}