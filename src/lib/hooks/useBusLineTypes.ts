import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { BusLineType } from '../../types/bus';

export function useBusLineTypes() {
  const [types, setTypes] = useState<BusLineType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'bus_line_types'));
      const typesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as BusLineType[];
      setTypes(typesData.sort((a, b) => a.name.localeCompare(b.name)));
      setError(null);
    } catch (err) {
      console.error('Error fetching bus line types:', err);
      setError('Error al cargar los tipos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const createType = async (data: Omit<BusLineType, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'bus_line_types'), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchTypes();
      return docRef.id;
    } catch (err) {
      console.error('Error creating type:', err);
      throw new Error('Error al crear el tipo');
    }
  };

  const updateType = async (id: string, data: Partial<BusLineType>) => {
    try {
      const typeRef = doc(db, 'bus_line_types', id);
      await updateDoc(typeRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      await fetchTypes();
    } catch (err) {
      console.error('Error updating type:', err);
      throw new Error('Error al actualizar el tipo');
    }
  };

  const deleteType = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bus_line_types', id));
      await fetchTypes();
    } catch (err) {
      console.error('Error deleting type:', err);
      throw new Error('Error al eliminar el tipo');
    }
  };

  return {
    types,
    loading,
    error,
    createType,
    updateType,
    deleteType
  };
}