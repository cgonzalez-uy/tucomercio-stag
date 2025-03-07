import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { BusSchedule } from '../../types/bus';

export function useBusSchedules() {
  const [schedules, setSchedules] = useState<BusSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'bus_schedules'));
      const schedulesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as BusSchedule[];
      setSchedules(schedulesData.sort((a, b) => a.departureTime.localeCompare(b.departureTime)));
      setError(null);
    } catch (err) {
      console.error('Error fetching bus schedules:', err);
      setError('Error al cargar los horarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const createSchedule = async (data: Omit<BusSchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'bus_schedules'), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchSchedules();
      return docRef.id;
    } catch (err) {
      console.error('Error creating schedule:', err);
      throw new Error('Error al crear el horario');
    }
  };

  const updateSchedule = async (id: string, data: Partial<BusSchedule>) => {
    try {
      const scheduleRef = doc(db, 'bus_schedules', id);
      await updateDoc(scheduleRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      await fetchSchedules();
    } catch (err) {
      console.error('Error updating schedule:', err);
      throw new Error('Error al actualizar el horario');
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bus_schedules', id));
      await fetchSchedules();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      throw new Error('Error al eliminar el horario');
    }
  };

  return {
    schedules,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule
  };
}