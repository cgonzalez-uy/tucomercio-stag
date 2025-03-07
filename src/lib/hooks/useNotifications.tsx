import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  collectionGroup,
  getDocs,
  getDoc,
  or
} from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import { isSuperAdmin } from '../auth';
import type { Notification } from '../../types/notification';

export function useNotifications(businessId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const isAdmin = isSuperAdmin(auth.currentUser);

    // Determine the recipient ID based on the context
    let recipientId: string;
    if (businessId) {
      // For business portal
      recipientId = businessId;
    } else if (isAdmin) {
      // For admin portal
      recipientId = 'admin';
    } else {
      // For user portal
      recipientId = userId;
    }

    // Create a query that matches notifications for this recipient
    const notificationsRef = collection(db, 'notifications');
    let q;

    if (businessId) {
      // For business portal - show all notifications
      q = query(
        notificationsRef,
        where('recipientId', '==', businessId),
        orderBy('createdAt', 'desc')
      );
    } else if (isAdmin) {
      // For admin portal
      q = query(
        notificationsRef,
        where('recipientId', '==', 'admin'),
        orderBy('createdAt', 'desc')
      );
    } else {
      // For user portal - show promotions, coupons, and review replies
      // We need to handle two cases:
      // 1. Notifications where the user is directly the recipient (review replies)
      // 2. Notifications for promotions/coupons where the user has the business in favorites
      q = query(
        notificationsRef,
        or(
          where('recipientId', '==', userId),
          where('type', 'in', ['new_promotion', 'new_coupon', 'new_review_reply'])
        ),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const notificationsData = await Promise.all(
          snapshot.docs.map(async (notificationDoc) => {
            const notificationData = notificationDoc.data();
            
            // For promotions/coupons, check if user has the business in favorites
            if (['new_promotion', 'new_coupon'].includes(notificationData.type)) {
              const userDoc = await getDoc(doc(db, 'users', userId));
              if (!userDoc.exists() || !userDoc.data().favorites?.includes(notificationData.businessId)) {
                return null;
              }
            }
            
            // Get the recipient document from subcollection
            const recipientsRef = collection(notificationDoc.ref, 'recipients');
            const recipientQuery = query(
              recipientsRef,
              where('userId', '==', recipientId)
            );
            const recipientSnapshot = await getDocs(recipientQuery);

            // If no recipient document exists, create one
            let recipientData;
            if (recipientSnapshot.empty) {
              const newRecipientRef = doc(recipientsRef);
              const newRecipientData = {
                userId: recipientId,
                read: false,
                createdAt: serverTimestamp()
              };
              await addDoc(recipientsRef, newRecipientData);
              recipientData = newRecipientData;
            } else {
              recipientData = recipientSnapshot.docs[0].data();
            }

            // Return notification with read status
            return {
              id: notificationDoc.id,
              ...notificationData,
              read: recipientData.read
            } as Notification;
          })
        );

        // Sort notifications by date and filter out any nulls
        const validNotifications = notificationsData
          .filter((n): n is Notification => n !== null)
          .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

        setNotifications(validNotifications);
        setUnreadCount(validNotifications.filter(n => !n.read).length);
        setError(null);
      } catch (err) {
        console.error('Error processing notifications:', err);
        setError('Error al cargar las notificaciones');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [businessId]);

  const markAsRead = async (notificationId: string) => {
    if (!auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      const isAdmin = isSuperAdmin(auth.currentUser);
      const recipientId = businessId || (isAdmin ? 'admin' : userId);

      // Find and update the recipient document
      const recipientsRef = collection(db, `notifications/${notificationId}/recipients`);
      const recipientQuery = query(
        recipientsRef,
        where('userId', '==', recipientId)
      );
      const recipientSnapshot = await getDocs(recipientQuery);

      if (!recipientSnapshot.empty) {
        const recipientDoc = recipientSnapshot.docs[0];
        await updateDoc(recipientDoc.ref, { 
          read: true,
          updatedAt: serverTimestamp()
        });

        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw new Error('Error al marcar la notificación como leída');
    }
  };

  const markAllAsRead = async () => {
    if (!auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      const isAdmin = isSuperAdmin(auth.currentUser);
      const recipientId = businessId || (isAdmin ? 'admin' : userId);

      // Update all unread notifications for this recipient
      const updatePromises = notifications
        .filter(n => !n.read)
        .map(async (notification) => {
          const recipientsRef = collection(db, `notifications/${notification.id}/recipients`);
          const recipientQuery = query(
            recipientsRef,
            where('userId', '==', recipientId)
          );
          const recipientSnapshot = await getDocs(recipientQuery);

          if (!recipientSnapshot.empty) {
            const recipientDoc = recipientSnapshot.docs[0];
            return updateDoc(recipientDoc.ref, { 
              read: true,
              updatedAt: serverTimestamp()
            });
          }
        });

      await Promise.all(updatePromises);

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw new Error('Error al marcar las notificaciones como leídas');
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead
  };
}