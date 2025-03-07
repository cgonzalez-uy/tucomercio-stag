import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Business } from '../types/business';

export function usePlanExpirations() {
  const [expiringBusinesses, setExpiringBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch businesses with expiring plans
  const fetchExpiringBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const businessesRef = collection(db, 'businesses');
      const snapshot = await getDocs(businessesRef);
      
      const expiring = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          planStartDate: doc.data().planStartDate?.toDate() || new Date()
        }))
        .filter(business => {
          // Only include businesses with paid plans
          const planEndDate = new Date(business.planStartDate);
          planEndDate.setMonth(planEndDate.getMonth() + 1); // Add 1 month
          return planEndDate <= sevenDaysFromNow && business.planId !== 'SsziYy1lsmwlineVK8hy';
        }) as Business[];

      setExpiringBusinesses(expiring);
      setError(null);
    } catch (err) {
      console.error('Error fetching expiring businesses:', err);
      setError('Error al cargar los comercios próximos a vencer');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpiringBusinesses();
  }, [fetchExpiringBusinesses]);

  // Renew business plan
  const renewPlan = async (businessId: string) => {
    try {
      const businessRef = doc(db, 'businesses', businessId);
      await updateDoc(businessRef, {
        planStartDate: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Refresh data
      await fetchExpiringBusinesses();
    } catch (err) {
      console.error('Error renewing plan:', err);
      throw new Error('Error al renovar el plan');
    }
  };

  // Downgrade to free plan
  const downgradeToFree = async (businessId: string) => {
    try {
      const businessRef = doc(db, 'businesses', businessId);
      await updateDoc(businessRef, {
        planId: 'SsziYy1lsmwlineVK8hy', // ID of the free plan
        updatedAt: Timestamp.now()
      });

      // Refresh data
      await fetchExpiringBusinesses();
    } catch (err) {
      console.error('Error downgrading plan:', err);
      throw new Error('Error al cambiar al plan gratuito');
    }
  };

  return {
    expiringBusinesses,
    loading,
    error,
    renewPlan,
    downgradeToFree,
    refresh: fetchExpiringBusinesses // Export refresh function
  };
}