import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { BusLine } from '../../types/bus';

export function useBusLines() {
  const [lines, setLines] = useState<BusLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLines = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'bus_lines'));
      const linesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as BusLine[];
      setLines(linesData.sort((a, b) => a.name.localeCompare(b.name)));
      setError(null);
    } catch (err) {
      console.error('Error fetching bus lines:', err);
      setError('Error al cargar las líneas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLines();
  }, [fetchLines]);

  const createLine = async (data: Omit<BusLine, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'bus_lines'), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchLines();
      return docRef.id;
    } catch (err) {
      console.error('Error creating line:', err);
      throw new Error('Error al crear la línea');
    }
  };

  const updateLine = async (id: string, data: Partial<BusLine>) => {
    try {
      const lineRef = doc(db, 'bus_lines', id);
      await updateDoc(lineRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      await fetchLines();
    } catch (err) {
      console.error('Error updating line:', err);
      throw new Error('Error al actualizar la línea');
    }
  };

  const deleteLine = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bus_lines', id));
      await fetchLines();
    } catch (err) {
      console.error('Error deleting line:', err);
      throw new Error('Error al eliminar la línea');
    }
  };

  return {
    lines,
    loading,
    error,
    createLine,
    updateLine,
    deleteLine
  };
}