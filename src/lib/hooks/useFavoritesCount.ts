import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function useFavoritesCount(businessId: string | null) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavoritesCount = async () => {
      if (!businessId) {
        setCount(0);
        setLoading(false);
        return;
      }

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('favorites', 'array-contains', businessId));
        const snapshot = await getDocs(q);
        setCount(snapshot.size);
        setError(null);
      } catch (err) {
        console.error('Error fetching favorites count:', err);
        setError('Error al cargar los favoritos');
      } finally {
        setLoading(false);
      }
    };

    fetchFavoritesCount();
  }, [businessId]);

  return {
    count,
    loading,
    error
  };
}