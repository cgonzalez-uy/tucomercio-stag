import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Event } from '../../types/event';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('startDate', 'asc'));
      const snapshot = await getDocs(q);
      
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      setEvents(eventsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Error al cargar los eventos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registeredUsers'>) => {
    try {
      const docRef = await addDoc(collection(db, 'events'), {
        ...data,
        registeredUsers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await fetchEvents();
      return docRef.id;
    } catch (err) {
      console.error('Error creating event:', err);
      throw new Error('Error al crear el evento');
    }
  };

  const updateEvent = async (id: string, data: Partial<Event>) => {
    try {
      const eventRef = doc(db, 'events', id);
      await updateDoc(eventRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      await fetchEvents();
    } catch (err) {
      console.error('Error updating event:', err);
      throw new Error('Error al actualizar el evento');
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
      await fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      throw new Error('Error al eliminar el evento');
    }
  };

  const registerForEvent = async (eventId: string, userId: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        registeredUsers: [...(events.find(e => e.id === eventId)?.registeredUsers || []), userId],
        updatedAt: serverTimestamp()
      });
      await fetchEvents();
    } catch (err) {
      console.error('Error registering for event:', err);
      throw new Error('Error al registrarse para el evento');
    }
  };

  const unregisterFromEvent = async (eventId: string, userId: string) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) throw new Error('Evento no encontrado');

      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        registeredUsers: event.registeredUsers?.filter(id => id !== userId) || [],
        updatedAt: serverTimestamp()
      });
      await fetchEvents();
    } catch (err) {
      console.error('Error unregistering from event:', err);
      throw new Error('Error al cancelar la registración del evento');
    }
  };

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    unregisterFromEvent
  };
}