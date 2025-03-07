import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { PointOfInterest } from '../../types/poi';

export function usePointsOfInterest() {
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPois = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'points_of_interest'));
      const poisData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as PointOfInterest[];
      setPois(poisData.sort((a, b) => a.name.localeCompare(b.name)));
      setError(null);
    } catch (err) {
      console.error('Error fetching POIs:', err);
      setError('Error al cargar los puntos de interés');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPois();
  }, [fetchPois]);

  const createPoi = async (data: Omit<PointOfInterest, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'points_of_interest'), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchPois();
      return docRef.id;
    } catch (err) {
      console.error('Error creating POI:', err);
      throw new Error('Error al crear el punto de interés');
    }
  };

  const updatePoi = async (id: string, data: Partial<PointOfInterest>) => {
    try {
      const poiRef = doc(db, 'points_of_interest', id);
      await updateDoc(poiRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      await fetchPois();
    } catch (err) {
      console.error('Error updating POI:', err);
      throw new Error('Error al actualizar el punto de interés');
    }
  };

  const deletePoi = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'points_of_interest', id));
      await fetchPois();
    } catch (err) {
      console.error('Error deleting POI:', err);
      throw new Error('Error al eliminar el punto de interés');
    }
  };

  return {
    pois,
    loading,
    error,
    createPoi,
    updatePoi,
    deletePoi
  };
}