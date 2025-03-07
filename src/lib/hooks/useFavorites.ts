import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc, serverTimestamp, collection, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from './useUser';

export function useFavorites(userId: string | undefined) {
  const { profile } = useUser(userId);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setFavorites(profile.favorites || []);
      setLoading(false);
    } else if (!userId) {
      setFavorites([]);
      setLoading(false);
    }
  }, [profile, userId]);

  const toggleFavorite = async (businessId: string) => {
    if (!userId) return;

    try {
      const userRef = doc(db, 'users', userId);
      const isFavorite = favorites.includes(businessId);

      // Get user document to ensure it exists
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      if (!userDoc.exists()) {
        // Create user profile if it doesn't exist
        await setDoc(userRef, {
          email: '',
          roles: ['visitor'],
          favorites: [businessId], // Add as first favorite
          reviews: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setFavorites([businessId]);
      } else {
        // Update existing user's favorites
        const currentRoles = userData?.roles || [];
        const newRoles = currentRoles.includes('visitor') ? currentRoles : [...currentRoles, 'visitor'];

        await updateDoc(userRef, {
          favorites: isFavorite ? arrayRemove(businessId) : arrayUnion(businessId),
          roles: newRoles,
          updatedAt: serverTimestamp()
        });

        // Update local state
        setFavorites(prev => 
          isFavorite 
            ? prev.filter(id => id !== businessId)
            : [...prev, businessId]
        );

        // If adding to favorites, create a notification
        if (!isFavorite) {
          // Get business data
          const businessDoc = await getDoc(doc(db, 'businesses', businessId));
          
          if (!businessDoc.exists()) {
            throw new Error('Comercio no encontrado');
          }

          const businessData = businessDoc.data();

          // Create notification with transaction
          const notificationRef = doc(collection(db, 'notifications'));
          
          await runTransaction(db, async (transaction) => {
            // Create notification
            transaction.set(notificationRef, {
              type: 'new_favorite',
              businessId,
              businessName: businessData.name,
              businessPhotoURL: businessData.image || null,
              userId,
              userDisplayName: userData?.displayName || 'Usuario',
              userPhotoURL: userData?.photoURL || null,
              recipientId: businessId,
              read: false,
              createdAt: serverTimestamp()
            });

            // Create recipient record in subcollection
            const recipientRef = doc(collection(db, `notifications/${notificationRef.id}/recipients`));
            transaction.set(recipientRef, {
              userId: businessId, // El comercio es el destinatario
              read: false,
              createdAt: serverTimestamp()
            });
          });
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      throw new Error('Error al actualizar favoritos');
    }
  };

  return {
    favorites,
    toggleFavorite,
    loading
  };
}