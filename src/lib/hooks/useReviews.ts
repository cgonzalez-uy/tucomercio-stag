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
import type { Review } from '../../types/user';

interface AddReviewData {
  rating: number;
  comment?: string;
}

export function useReviews(businessId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to reviews
  useEffect(() => {
    const q = query(
      collection(db, `businesses/${businessId}/reviews`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[]
      );
      setLoading(false);
    }, (err) => {
      console.error('Error fetching reviews:', err);
      setError('Error al cargar las reseñas');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [businessId]);

  const addReview = async (userId: string, data: AddReviewData) => {
    try {
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado');
      }
      const userData = userDoc.data();

      // Get business data
      const businessDoc = await getDoc(doc(db, 'businesses', businessId));
      if (!businessDoc.exists()) {
        throw new Error('Comercio no encontrado');
      }
      const businessData = businessDoc.data();

      // Use transaction to ensure consistency
      await runTransaction(db, async (transaction) => {
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

        // Create notification
        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          type: 'new_review',
          businessId,
          businessName: businessData.name,
          businessPhotoURL: businessData.image || null,
          userId,
          userDisplayName: userData.displayName || 'Usuario',
          userPhotoURL: userData.photoURL || null,
          reviewId: reviewRef.id,
          reviewRating: data.rating,
          reviewContent: data.comment,
          recipientId: businessId,
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

  const deleteReview = async (reviewId: string) => {
    try {
      await deleteDoc(doc(db, `businesses/${businessId}/reviews/${reviewId}`));
    } catch (err) {
      console.error('Error deleting review:', err);
      throw new Error('Error al eliminar la reseña');
    }
  };

  const reportReview = async (reviewId: string, reason: string, details?: string) => {
    try {
      // Create report
      await addDoc(
        collection(db, 'businesses', businessId, 'reviews', reviewId, 'reports'),
        {
          reason,
          details,
          createdAt: serverTimestamp(),
          status: 'pending'
        }
      );

      // Update review to mark it as reported
      await updateDoc(
        doc(db, 'businesses', businessId, 'reviews', reviewId),
        { reported: true }
      );
    } catch (err) {
      console.error('Error reporting review:', err);
      throw new Error('Error al reportar la reseña');
    }
  };

  return {
    reviews,
    loading,
    error,
    addReview,
    deleteReview,
    reportReview
  };
}