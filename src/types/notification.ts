import type { Timestamp } from 'firebase/firestore';

export type NotificationType = 
  // Business notifications
  | 'new_favorite'      // When a user adds the business to favorites
  | 'new_review'        // When a user writes a review
  | 'new_support_chat'  // When support starts a new chat
  | 'new_support_message' // When support sends a new message
  
  // User notifications
  | 'new_promotion'     // When a favorite business adds a promotion
  | 'new_coupon'       // When a favorite business adds a coupon
  | 'new_review_reply' // When a business replies to user's review
  
  // Admin notifications
  | 'new_business_chat'    // When a business starts a new chat
  | 'new_business_message'; // When a business sends a new message

export interface Notification {
  id: string;
  type: NotificationType;
  
  // Business info (required for all notifications)
  businessId: string;
  businessName: string;
  businessPhotoURL?: string | null;

  // User info (for business notifications)
  userId?: string;
  userDisplayName?: string;
  userPhotoURL?: string | null;

  // Chat info
  chatId?: string;
  messageContent?: string;

  // Review info
  reviewId?: string;
  reviewRating?: number;
  reviewContent?: string;
  replyContent?: string;

  // Promotion/Coupon info
  promotionId?: string;
  promotionTitle?: string;
  promotionDiscount?: number;
  couponId?: string;
  couponCode?: string;
  couponDiscount?: number;

  // Common fields
  read: boolean;
  recipientId: string; // Can be: businessId, userId, or 'admin'
  createdAt: Timestamp;
}

export interface NotificationRecipient {
  userId: string;
  read: boolean;
  createdAt: Timestamp;
}