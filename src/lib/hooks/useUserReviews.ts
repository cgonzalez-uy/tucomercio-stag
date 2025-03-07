import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Review } from '../../types/user';

export function useUserReviews(userId: string | undefined) {
  const [reviews, setReviews] = useState<(Review & { businessName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserReviews = async () => {
      if (!userId) {
        setReviews([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const businessesSnapshot = await getDocs(collection(db, 'businesses'));
        const businesses = new Map(
          businessesSnapshot.docs.map(doc => [doc.id, doc.data().name])
        );

        const allReviews: (Review & { businessName: string })[] = [];

        // Fetch reviews from each business
        for (const [businessId, businessName] of businesses) {
          const reviewsQuery = query(
            collection(db, `businesses/${businessId}/reviews`),
            where('userId', '==', userId)
          );

          const reviewsSnapshot = await getDocs(reviewsQuery);
          reviewsSnapshot.forEach(doc => {
            allReviews.push({
              id: doc.id,
              businessId,
              businessName,
              ...doc.data()
            } as Review & { businessName: string });
          });
        }

        // Sort reviews by date, newest first
        setReviews(allReviews.sort((a, b) => 
          b.createdAt.seconds - a.createdAt.seconds
        ));
        setError(null);
      } catch (err) {
        console.error('Error fetching user reviews:', err);
        setError('Error al cargar las reseñas');
      } finally {
        setLoading(false);
      }
    };

    fetchUserReviews();
  }, [userId]);

  const deleteReview = async (businessId: string, reviewId: string) => {
    try {
      await deleteDoc(doc(db, `businesses/${businessId}/reviews/${reviewId}`));
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
      throw new Error('Error al eliminar la reseña');
    }
  };

  return {
    reviews,
    loading,
    error,
    deleteReview
  };
}