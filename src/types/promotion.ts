import type { Timestamp } from 'firebase/firestore';

export interface Promotion {
  id: string;
  businessId: string;
  title: string;
  description: string;
  discount: number;
  startDate: Timestamp;
  endDate: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}