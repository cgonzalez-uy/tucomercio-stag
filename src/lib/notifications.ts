import { collection, addDoc, getDocs, query, where, serverTimestamp, runTransaction, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { NotificationType } from '../types/notification';

export async function createNotification({
  type,
  businessId,
  businessName,
  businessPhotoURL,
  userId,
  userDisplayName,
  userPhotoURL,
  chatId,
  messageContent,
  reviewId,
  reviewRating,
  reviewContent,
  promotionId,
  promotionTitle,
  promotionDiscount,
  couponId,
  couponCode,
  couponDiscount,
  recipientId
}: {
  type: NotificationType;
  businessId: string;
  businessName: string;
  businessPhotoURL?: string | null;
  userId?: string;
  userDisplayName?: string;
  userPhotoURL?: string | null;
  chatId?: string;
  messageContent?: string;
  reviewId?: string;
  reviewRating?: number;
  reviewContent?: string;
  promotionId?: string;
  promotionTitle?: string;
  promotionDiscount?: number;
  couponId?: string;
  couponCode?: string;
  couponDiscount?: number;
  recipientId: string;
}) {
  try {
    await runTransaction(db, async (transaction) => {
      // Crear la notificación
      const notificationRef = doc(collection(db, 'notifications'));
      
      // Datos base de la notificación
      const notificationData = {
        type,
        businessId,
        businessName,
        businessPhotoURL: businessPhotoURL || null,
        userId,
        userDisplayName,
        userPhotoURL,
        chatId,
        messageContent,
        reviewId,
        reviewRating,
        reviewContent,
        promotionId,
        promotionTitle,
        promotionDiscount,
        couponId,
        couponCode,
        couponDiscount,
        createdAt: serverTimestamp()
      };

      // Crear la notificación
      transaction.set(notificationRef, notificationData);

      // Crear el recipient
      const recipientRef = doc(collection(db, `notifications/${notificationRef.id}/recipients`));
      transaction.set(recipientRef, {
        userId: recipientId,
        read: false,
        createdAt: serverTimestamp()
      });

      // Para promociones y cupones, notificar a todos los usuarios que tienen el comercio en favoritos
      if (type === 'new_promotion' || type === 'new_coupon') {
        const usersWithFavorites = await getDocs(
          query(collection(db, 'users'), where('favorites', 'array-contains', businessId))
        );

        for (const userDoc of usersWithFavorites.docs) {
          const userRecipientRef = doc(collection(db, `notifications/${notificationRef.id}/recipients`));
          transaction.set(userRecipientRef, {
            userId: userDoc.id,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    throw new Error('Error al crear la notificación');
  }
}