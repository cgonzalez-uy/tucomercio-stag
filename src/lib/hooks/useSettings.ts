import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface Setting {
  id: string;
  name: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type SettingType = 'payment-methods' | 'shipping-methods' | 'categories' | 'site-settings';

export function useSettings(type: SettingType) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const collectionName = type;

  const fetchSettings = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const settingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Setting[];
      setSettings(settingsData);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(`Error al cargar los ${type}. Por favor, verifica tu conexión.`);
    } finally {
      setLoading(false);
    }
  }, [type, collectionName]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const createSetting = useCallback(async (name: string, color?: string) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        name,
        ...(color ? { color } : {}),
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchSettings();
      return docRef.id;
    } catch (err) {
      console.error(`Error creating ${type}:`, err);
      throw new Error(`Error al crear. Por favor, verifica tus permisos.`);
    }
  }, [type, collectionName, fetchSettings]);

  const updateSetting = useCallback(async (id: string, data: Partial<Setting>) => {
    try {
      const settingRef = doc(db, collectionName, id);
      await updateDoc(settingRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      await fetchSettings();
    } catch (err) {
      console.error(`Error updating ${type}:`, err);
      throw new Error(`Error al actualizar. Por favor, verifica tus permisos.`);
    }
  }, [type, collectionName, fetchSettings]);

  const deleteSetting = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      await fetchSettings();
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      throw new Error(`Error al eliminar. Por favor, verifica tus permisos.`);
    }
  }, [type, collectionName, fetchSettings]);

  return {
    settings,
    loading,
    error,
    createSetting,
    updateSetting,
    deleteSetting,
    fetchSettings
  };
}