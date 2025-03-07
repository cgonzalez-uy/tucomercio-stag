import type { Timestamp } from 'firebase/firestore';

export interface MessageAttachment {
  url: string;
  type: 'image' | 'document';
  name: string;
  size: number;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  sent: boolean;
  delivered: boolean;
  read: boolean;
  createdAt: Timestamp;
  attachment?: MessageAttachment;
}

export interface Chat {
  id: string;
  businessId: string;
  businessName: string;
  businessPhotoURL?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: Timestamp;
  };
  participants: {
    [userId: string]: {
      unreadCount: number;
      lastRead?: Timestamp;
    }
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}