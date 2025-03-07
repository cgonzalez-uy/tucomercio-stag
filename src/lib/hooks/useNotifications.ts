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
  getDocs,
  getDoc,
  runTransaction,
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

    // Crear la consulta base
    const notificationsRef = collection(db, 'notifications');
    let q;

    if (businessId) {
      // Para el portal de comercio
      q = query(
        notificationsRef,
        where('recipientId', '==', businessId),
        orderBy('createdAt', 'desc')
      );
    } else if (isAdmin) {
      // Para el portal de admin
      q = query(
        notificationsRef,
        where('recipientId', '==', 'admin'),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Para usuarios normales - incluir notificaciones directas y de comercios favoritos
      q = query(
        notificationsRef,
        or(
          where('recipientId', '==', userId),
          where('type', 'in', ['new_promotion', 'new_coupon'])
        ),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const notificationsData = await Promise.all(
          snapshot.docs.map(async (notificationDoc) => {
            const data = notificationDoc.data();

            // Para promociones/cupones, verificar si el usuario tiene el comercio en favoritos
            if (!businessId && !isAdmin && 
                ['new_promotion', 'new_coupon'].includes(data.type)) {
              const userDoc = await getDoc(doc(db, 'users', userId));
              if (!userDoc.exists() || !userDoc.data().favorites?.includes(data.businessId)) {
                return null;
              }
            }

            // Obtener el estado de lectura del recipient
            const recipientsRef = collection(notificationDoc.ref, 'recipients');
            const recipientId = businessId || (isAdmin ? 'admin' : userId);
            const recipientQuery = query(recipientsRef, where('userId', '==', recipientId));
            const recipientSnapshot = await getDocs(recipientQuery);

            let read = false;
            if (!recipientSnapshot.empty) {
              read = recipientSnapshot.docs[0].data().read;
            } else {
              // Crear el recipient si no existe
              await addDoc(recipientsRef, {
                userId: recipientId,
                read: false,
                createdAt: serverTimestamp()
              });
            }

            return {
              id: notificationDoc.id,
              ...data,
              read
            } as Notification;
          })
        );

        // Filtrar nulos y ordenar por fecha
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
      const recipientQuery = query(recipientsRef, where('userId', '==', recipientId));
      const recipientSnapshot = await getDocs(recipientQuery);

      if (!recipientSnapshot.empty) {
        const recipientDoc = recipientSnapshot.docs[0];
        await updateDoc(recipientDoc.ref, { 
          read: true,
          updatedAt: serverTimestamp()
        });

        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
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

      await runTransaction(db, async (transaction) => {
        for (const notification of notifications.filter(n => !n.read)) {
          const recipientsRef = collection(db, `notifications/${notification.id}/recipients`);
          const recipientQuery = query(recipientsRef, where('userId', '==', recipientId));
          const recipientSnapshot = await getDocs(recipientQuery);

          if (!recipientSnapshot.empty) {
            const recipientDoc = recipientSnapshot.docs[0];
            transaction.update(recipientDoc.ref, {
              read: true,
              updatedAt: serverTimestamp()
            });
          }
        }
      });

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