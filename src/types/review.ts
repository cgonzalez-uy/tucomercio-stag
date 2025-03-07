import type { Timestamp } from 'firebase/firestore';

export interface ReviewReply {
  id: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Review {
  id: string;
  businessId: string;
  userId: string;
  rating: number;
  comment: string;
  userDisplayName: string;
  userPhotoURL?: string;
  reply?: ReviewReply;
  reported: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}