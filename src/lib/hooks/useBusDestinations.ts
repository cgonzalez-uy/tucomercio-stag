import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { BusDestination } from '../../types/bus';

export function useBusDestinations() {
  const [destinations, setDestinations] = useState<BusDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDestinations = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'bus_destinations'));
      const destinationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as BusDestination[];
      setDestinations(destinationsData.sort((a, b) => a.name.localeCompare(b.name)));
      setError(null);
    } catch (err) {
      console.error('Error fetching bus destinations:', err);
      setError('Error al cargar los destinos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const createDestination = async (data: Omit<BusDestination, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'bus_destinations'), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchDestinations();
      return docRef.id;
    } catch (err) {
      console.error('Error creating destination:', err);
      throw new Error('Error al crear el destino');
    }
  };

  const updateDestination = async (id: string, data: Partial<BusDestination>) => {
    try {
      const destinationRef = doc(db, 'bus_destinations', id);
      await updateDoc(destinationRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      await fetchDestinations();
    } catch (err) {
      console.error('Error updating destination:', err);
      throw new Error('Error al actualizar el destino');
    }
  };

  const deleteDestination = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bus_destinations', id));
      await fetchDestinations();
    } catch (err) {
      console.error('Error deleting destination:', err);
      throw new Error('Error al eliminar el destino');
    }
  };

  return {
    destinations,
    loading,
    error,
    createDestination,
    updateDestination,
    deleteDestination
  };
}