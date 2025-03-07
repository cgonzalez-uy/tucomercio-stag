import { useState, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface BusinessMetrics {
  businessId: string;
  profileViews: number;
  socialClicks: {
    instagram: number;
    facebook: number;
    whatsapp: number;
    website: number;
  };
  phoneClicks: number;
  hourlyStats: {
    [hour: string]: number;
  };
  lastUpdated: Date;
}

export function useBusinessMetrics(businessId: string) {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const metricsRef = doc(db, 'business_metrics', businessId);
      const metricsDoc = await getDoc(metricsRef);
      
      if (metricsDoc.exists()) {
        const data = metricsDoc.data() as BusinessMetrics;
        setMetrics({
          ...data,
          lastUpdated: data.lastUpdated.toDate()
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Error al cargar las métricas');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const trackEvent = useCallback(async (eventType: 'view' | 'phone' | 'social', data?: { network?: string }) => {
    if (!businessId) return;

    try {
       console.log('Tracking event:', eventType, 'for business:', businessId); // Para debugging
      const metricsRef = doc(db, 'business_metrics', businessId);
     
      const currentHour = new Date().getHours().toString().padStart(2, '0');
     const metricsDoc = await getDoc(metricsRef);
      if (!metricsDoc.exists()) {
        console.log('Creating new metrics document'); // Para debugging
        // Create initial metrics document
        await setDoc(metricsRef, {
          businessId,
          profileViews: eventType === 'view' ? 1 : 0,
          socialClicks: {
            instagram: 0,
            facebook: 0,
            whatsapp: 0,
            website: 0
          },
          phoneClicks: eventType === 'phone' ? 1 : 0,
          hourlyStats: {
            [currentHour]: 1
          },
          lastUpdated: Timestamp.now()
        });
      } else {
        console.log('Updating existing metrics document'); // Para debugging
        // Update existing metrics
        const updateData: any = {
          lastUpdated: Timestamp.now(),
          [`hourlyStats.${currentHour}`]: increment(1)
        };

        if (eventType === 'view') {
          updateData.profileViews = increment(1);
        } else if (eventType === 'phone') {
          updateData.phoneClicks = increment(1);
        } else if (eventType === 'social' && data?.network) {
          updateData[`socialClicks.${data.network}`] = increment(1);
        }

        await updateDoc(metricsRef, updateData);
      }

      // Refresh metrics after tracking
      await getMetrics();
       console.log('Metrics updated successfully'); // Para debugging
    } catch (err) {
      console.error('Error tracking event:', err);
    }
  }, [businessId, getMetrics]);

  return {
    metrics,
    loading,
    error,
    getMetrics,
    trackEvent
  };
}