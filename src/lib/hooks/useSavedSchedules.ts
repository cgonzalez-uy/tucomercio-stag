import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, doc, addDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { BusSchedule } from '../../types/bus';

export function useSavedSchedules(userId: string | undefined) {
  const [savedSchedules, setSavedSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to user's saved schedules
  useEffect(() => {
    if (!userId) {
      setSavedSchedules([]);
      setLoading(false);
      return;
    }

    const fetchSavedSchedules = async () => {
      try {
        const q = query(
          collection(db, 'saved_schedules'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const schedules = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSavedSchedules(schedules);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching saved schedules:', err);
        setError('Error al cargar los horarios guardados');
        setLoading(false);
      }
    };

    fetchSavedSchedules();
  }, [userId]);

  const saveSchedule = async (schedule: BusSchedule, routeData: any) => {
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // Check if already saved
      const q = query(
        collection(db, 'saved_schedules'),
        where('userId', '==', userId),
        where('scheduleId', '==', schedule.id)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        throw new Error('Este horario ya está guardado');
      }

      // Save schedule
      await addDoc(collection(db, 'saved_schedules'), {
        userId,
        scheduleId: schedule.id,
        routeId: schedule.routeId,
        departureTime: schedule.departureTime,
        daysOfWeek: schedule.daysOfWeek,
        routeData: {
          lineId: routeData.line.id,
          lineName: routeData.line.name,
          lineCode: routeData.line.code,
          typeId: routeData.type.id,
          typeName: routeData.type.name,
          originId: routeData.origin.id,
          originName: routeData.origin.name,
          destinationId: routeData.destination.id,
          destinationName: routeData.destination.name
        },
        createdAt: serverTimestamp()
      });

      // Update local state
      const savedSchedule = {
        id: schedule.id,
        scheduleId: schedule.id,
        departureTime: schedule.departureTime,
        daysOfWeek: schedule.daysOfWeek,
        routeData: routeData
      };
      setSavedSchedules(prev => [savedSchedule, ...prev]);

    } catch (err) {
      console.error('Error saving schedule:', err);
      throw err instanceof Error ? err : new Error('Error al guardar el horario');
    }
  };

  const unsaveSchedule = async (scheduleId: string) => {
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // Find the saved schedule document
      const q = query(
        collection(db, 'saved_schedules'),
        where('userId', '==', userId),
        where('scheduleId', '==', scheduleId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Horario no encontrado');
      }

      // Delete the document
      await deleteDoc(doc(db, 'saved_schedules', snapshot.docs[0].id));

      // Update local state
      setSavedSchedules(prev => prev.filter(s => s.scheduleId !== scheduleId));

    } catch (err) {
      console.error('Error unsaving schedule:', err);
      throw err instanceof Error ? err : new Error('Error al eliminar el horario guardado');
    }
  };

  const isScheduleSaved = (scheduleId: string) => {
    return savedSchedules.some(s => s.scheduleId === scheduleId);
  };

  return {
    savedSchedules,
    loading,
    error,
    saveSchedule,
    unsaveSchedule,
    isScheduleSaved
  };
}