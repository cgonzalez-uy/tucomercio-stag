import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Plan } from '../../types/subscription';

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'plans'));
      const plansData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Plan[];
      setPlans(plansData.sort((a, b) => a.price - b.price));
      setError(null);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Error al cargar los planes. Por favor, verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const createPlan = useCallback(async (planData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'plans'), {
        ...planData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchPlans();
      return docRef.id;
    } catch (err) {
      console.error('Error creating plan:', err);
      throw new Error('Error al crear el plan. Por favor, verifica tus permisos.');
    }
  }, [fetchPlans]);

  const updatePlan = useCallback(async (id: string, planData: Partial<Plan>) => {
    try {
      const planRef = doc(db, 'plans', id);
      await updateDoc(planRef, {
        ...planData,
        updatedAt: Timestamp.now()
      });
      await fetchPlans();
    } catch (err) {
      console.error('Error updating plan:', err);
      throw new Error('Error al actualizar el plan. Por favor, verifica tus permisos.');
    }
  }, [fetchPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'plans', id));
      await fetchPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
      throw new Error('Error al eliminar el plan. Por favor, verifica tus permisos.');
    }
  }, [fetchPlans]);

  return {
    plans,
    loading,
    error,
    createPlan,
    updatePlan,
    deletePlan
  };
}