import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  getDoc,
  where,
  getDocs,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Review } from '../../types/review';

export function useBusinessReviews(businessId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // Subscribe to reviews
  useEffect(() => {
    if (!businessId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `businesses/${businessId}/reviews`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];

      setReviews(reviewsData);
      
      // Calculate average rating
      if (reviewsData.length > 0) {
        const total = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(total / reviewsData.length);
        setTotalReviews(reviewsData.length);
      } else {
        setAverageRating(0);
        setTotalReviews(0);
      }

      setLoading(false);
    }, (err) => {
      console.error('Error fetching reviews:', err);
      setError('Error al cargar las reseñas');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [businessId]);

  const addReview = async (userId: string, data: { rating: number; comment?: string }) => {
    if (!businessId) {
      throw new Error('ID del comercio no encontrado');
    }

    try {
      // Use transaction to ensure data consistency
      await runTransaction(db, async (transaction) => {
        // Get user data
        const userDoc = await transaction.get(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          throw new Error('Usuario no encontrado');
        }
        const userData = userDoc.data();

        // Create review
        const reviewRef = doc(collection(db, `businesses/${businessId}/reviews`));
        transaction.set(reviewRef, {
          userId,
          rating: data.rating,
          comment: data.comment || '',
          userDisplayName: userData.displayName || 'Usuario',
          userPhotoURL: userData.photoURL || null,
          reported: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Update business average rating
        const businessRef = doc(db, 'businesses', businessId);
        const businessDoc = await transaction.get(businessRef);
        if (!businessDoc.exists()) {
          throw new Error('Comercio no encontrado');
        }

        const reviews = await getDocs(collection(db, `businesses/${businessId}/reviews`));
        const totalRating = reviews.docs.reduce((sum, doc) => sum + doc.data().rating, 0) + data.rating;
        const newAverage = totalRating / (reviews.docs.length + 1);

        transaction.update(businessRef, {
          averageRating: newAverage,
          totalReviews: reviews.docs.length + 1,
          updatedAt: serverTimestamp()
        });

        // Create notification
        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          type: 'new_review',
          businessId,
          businessName: businessDoc.data().name,
          businessPhotoURL: businessDoc.data().image || null,
          userId,
          userDisplayName: userData.displayName || 'Usuario',
          userPhotoURL: userData.photoURL || null,
          reviewId: reviewRef.id,
          reviewRating: data.rating,
          reviewContent: data.comment,
          recipientId: businessId,
          read: false,
          createdAt: serverTimestamp()
        });

        // Create recipient record
        const recipientRef = doc(collection(db, `notifications/${notificationRef.id}/recipients`));
        transaction.set(recipientRef, {
          userId: businessId,
          read: false,
          createdAt: serverTimestamp()
        });
      });
    } catch (err) {
      console.error('Error adding review:', err);
      throw err instanceof Error ? err : new Error('Error al crear la reseña');
    }
  };

  return {
    reviews,
    averageRating,
    totalReviews,
    loading,
    error,
    addReview
  };
}