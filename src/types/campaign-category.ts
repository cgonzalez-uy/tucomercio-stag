import type { Timestamp } from 'firebase/firestore';

export interface CampaignCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  slug: string; // URL-friendly identifier
  backgroundColor?: string; // Optional background color for the category card
  textColor?: string; // Optional text color for better contrast
  isActive: boolean;
  order: number; // For controlling display order
  createdAt: Timestamp;
  updatedAt: Timestamp;
}