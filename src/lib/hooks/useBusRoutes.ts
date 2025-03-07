import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { BusRoute } from '../../types/bus';

export function useBusRoutes() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const querySnapshot = await getDocs(collection(db, 'bus_routes'));
      const routesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as BusRoute[];
      setRoutes(routesData);
    } catch (err) {
      console.error('Error fetching bus routes:', err);
      setError('Error al cargar los recorridos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const createRoute = async (data: Omit<BusRoute, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const docRef = await addDoc(collection(db, 'bus_routes'), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchRoutes();
      return docRef.id;
    } catch (err) {
      console.error('Error creating route:', err);
      throw new Error('Error al crear el recorrido');
    }
  };

  const updateRoute = async (id: string, data: Partial<BusRoute>) => {
    try {
      setError(null);
      const routeRef = doc(db, 'bus_routes', id);
      await updateDoc(routeRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      await fetchRoutes();
    } catch (err) {
      console.error('Error updating route:', err);
      throw new Error('Error al actualizar el recorrido');
    }
  };

  const deleteRoute = async (id: string) => {
    try {
      setError(null);
      await deleteDoc(doc(db, 'bus_routes', id));
      await fetchRoutes();
    } catch (err) {
      console.error('Error deleting route:', err);
      throw new Error('Error al eliminar el recorrido');
    }
  };

  return {
    routes,
    loading,
    error,
    createRoute,
    updateRoute,
    deleteRoute
  };
}