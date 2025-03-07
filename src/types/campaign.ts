import type { Timestamp } from 'firebase/firestore';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  slug: string; // URL-friendly identifier for the campaign
  startDate: Timestamp;
  endDate: Timestamp;
  isActive: boolean;
  imageUrl?: string; // Optional banner image for the campaign
  theme?: string; // Optional theme/category identifier
  businesses: string[]; // Array of business IDs participating in the campaign
  pendingRequests: string[]; // Array of business IDs that requested to join
  metrics: {
    views: number;
    clicks: number;
    participantCount: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CampaignParticipation {
  businessId: string;
  campaignId: string;
  joinedAt: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  requestNote?: string; // Optional note from business when requesting to join
  rejectionReason?: string; // Optional reason if rejected
}