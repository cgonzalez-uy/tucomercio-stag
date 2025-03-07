import type { Timestamp } from 'firebase/firestore';

export interface Banner {
  id: string;
  title: string;
  description?: string;
  image: string;
  altText: string; // Added alt text field
  buttonText: string;
  buttonColor: string;
  buttonLink: string;
  startDate: Timestamp;
  endDate: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}