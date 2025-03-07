import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  favorites: string[];
  reviews: {
    [businessId: string]: {
      rating: number;
      comment: string;
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }
  };
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}