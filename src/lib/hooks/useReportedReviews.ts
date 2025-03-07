import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  Timestamp,
  deleteDoc,
  getDoc,
  addDoc,
  writeBatch,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { isSuperAdmin } from '../auth';

export function useReportedReviews() {
  const [user] = useAuthState(auth);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportedReviews = async () => {
      try {
        // Verify superadmin permissions
        if (!user || !isSuperAdmin(user)) {
          setError('No tienes permisos para ver los reportes');
          setLoading(false);
          return;
        }

        // Get all businesses first
        const businessesRef = collection(db, 'businesses');
        const businessesSnapshot = await getDocs(businessesRef);
        const reportedReviews: any[] = [];

        // Process businesses in parallel
        const promises = businessesSnapshot.docs.map(async (businessDoc) => {
          const businessId = businessDoc.id;
          const businessName = businessDoc.data().name;

          // Get only reported reviews for this business
          const reviewsRef = collection(db, `businesses/${businessId}/reviews`);
          const reviewsQuery = query(
            reviewsRef,
            where('reported', '==', true),
            orderBy('createdAt', 'desc'),
            limit(100) // Limit to last 100 reported reviews per business
          );

          const reviewsSnapshot = await getDocs(reviewsQuery);

          // Process reviews in parallel
          const reviewPromises = reviewsSnapshot.docs.map(async (reviewDoc) => {
            const reviewData = reviewDoc.data();

            // Get pending reports for this review
            const reportsRef = collection(reviewDoc.ref, 'reports');
            const reportsQuery = query(
              reportsRef,
              where('status', '==', 'pending'),
              limit(1) // We only need one pending report
            );

            const reportsSnapshot = await getDocs(reportsQuery);
            
            // Only add if there are pending reports
            if (!reportsSnapshot.empty) {
              const reportDoc = reportsSnapshot.docs[0];
              const reportData = reportDoc.data();

              reportedReviews.push({
                businessId,
                businessName,
                reviewId: reviewDoc.id,
                reportId: reportDoc.id,
                userDisplayName: reviewData.userDisplayName,
                userId: reviewData.userId,
                rating: reviewData.rating,
                comment: reviewData.comment,
                reportReason: reportData.reason,
                reportDetails: reportData.details,
                reportDate: reportData.createdAt,
                ...reviewData
              });
            }
          });

          await Promise.all(reviewPromises);
        });

        await Promise.all(promises);

        // Sort by report date, newest first
        setReviews(reportedReviews.sort((a, b) => 
          b.reportDate.seconds - a.reportDate.seconds
        ));
        setError(null);
      } catch (err) {
        console.error('Error fetching reported reviews:', err);
        setError('Error al cargar las reseñas reportadas');
      } finally {
        setLoading(false);
      }
    };

    fetchReportedReviews();
  }, [user]);

  const resolveReport = async (businessId: string, reviewId: string, reportId: string) => {
    try {
      if (!user || !isSuperAdmin(user)) {
        throw new Error('No tienes permisos para resolver reportes');
      }

      // Get review data first
      const reviewRef = doc(db, `businesses/${businessId}/reviews/${reviewId}`);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }
      
      const reviewData = reviewDoc.data();

      // Get business data
      const businessRef = doc(db, 'businesses', businessId);
      const businessDoc = await getDoc(businessRef);
      
      if (!businessDoc.exists()) {
        throw new Error('Business not found');
      }

      const businessName = businessDoc.data().name;

      // Create batch
      const batch = writeBatch(db);

      // Update report status
      const reportRef = doc(db, `businesses/${businessId}/reviews/${reviewId}/reports/${reportId}`);
      batch.update(reportRef, {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        resolvedBy: user.uid
      });

      // Delete the review
      batch.delete(reviewRef);

      // Remove the review from user's reviews
      if (reviewData.userId) {
        const userRef = doc(db, 'users', reviewData.userId);
        batch.update(userRef, {
          [`reviews.${businessId}`]: null
        });

        // Create notification for the user
        const notificationRef = doc(collection(db, 'notifications'));
        batch.set(notificationRef, {
          userId: reviewData.userId,
          type: 'review_deleted',
          businessId,
          businessName,
          message: 'Tu reseña ha sido eliminada por violar nuestras políticas.',
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Commit all changes
      await batch.commit();

      // Update local state
      setReviews(prev => prev.filter(r => r.reportId !== reportId));
    } catch (err) {
      console.error('Error resolving report:', err);
      throw err;
    }
  };

  const rejectReport = async (businessId: string, reviewId: string, reportId: string) => {
    try {
      if (!user || !isSuperAdmin(user)) {
        throw new Error('No tienes permisos para rechazar reportes');
      }

      // Create batch
      const batch = writeBatch(db);

      // Update report status
      const reportRef = doc(db, `businesses/${businessId}/reviews/${reviewId}/reports/${reportId}`);
      batch.update(reportRef, {
        status: 'rejected',
        resolvedAt: serverTimestamp(),
        resolvedBy: user.uid
      });

      // Update review to remove reported flag
      const reviewRef = doc(db, `businesses/${businessId}/reviews/${reviewId}`);
      batch.update(reviewRef, {
        reported: false
      });

      // Create notification for the business owner
      const notificationRef = doc(collection(db, 'notifications'));
      batch.set(notificationRef, {
        businessId,
        type: 'report_rejected',
        message: 'El reporte de la reseña ha sido rechazado.',
        read: false,
        createdAt: serverTimestamp()
      });

      // Commit all changes
      await batch.commit();

      // Update local state
      setReviews(prev => prev.filter(r => r.reportId !== reportId));
    } catch (err) {
      console.error('Error rejecting report:', err);
      throw err;
    }
  };

  return {
    reviews,
    loading,
    error,
    resolveReport,
    rejectReport
  };
}