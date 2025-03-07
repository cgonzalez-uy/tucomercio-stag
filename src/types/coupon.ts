import type { Timestamp } from 'firebase/firestore';

export interface Coupon {
  id: string;
  businessId: string;
  code: string;
  title: string;
  description: string;
  discount: number;
  maxUses: number;
  currentUses: number;
  startDate: Timestamp;
  endDate: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UsedCoupon {
  id: string;
  userId: string;
  couponId: string;
  businessId: string;
  code: string;
  title: string;
  discount: number;
  usedAt: Timestamp;
}