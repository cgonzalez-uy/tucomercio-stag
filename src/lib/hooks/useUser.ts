import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { UserProfile } from '../../types/user';

export function useUser(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // Crear perfil si no existe
          const newProfile: Omit<UserProfile, 'id'> = {
            email: '',
            favorites: [],
            reviews: {},
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };
          await setDoc(doc(db, 'users', userId), newProfile);
          setProfile({ id: userId, ...newProfile });
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!userId || !profile) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (err) {
      console.error('Error updating profile:', err);
      throw new Error('Error al actualizar el perfil');
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile
  };
}