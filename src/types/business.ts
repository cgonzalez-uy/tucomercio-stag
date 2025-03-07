export interface TimeRange {
  open: string;    // Formato "HH:mm"
  close: string;   // Formato "HH:mm"
}

export interface DaySchedule {
  isOpen: boolean;
  ranges: TimeRange[];
}

export interface BusinessSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface BusinessReview {
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  address: string;
  categories: string[];
  phone: string;
  email?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  image?: string;
  gallery?: string[];
  paymentMethods: string[];
  shippingMethods: string[];
  isActive: boolean;
  planId: string;
  hasPortalAccess: boolean;
  schedule: BusinessSchedule;
  reviews: { [userId: string]: BusinessReview };  // Map of user IDs to their reviews
  favorites: string[];  // Array of user IDs who favorited this business
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SCHEDULE: BusinessSchedule = {
  monday: { isOpen: true, ranges: [{ open: "09:00", close: "18:00" }] },
  tuesday: { isOpen: true, ranges: [{ open: "09:00", close: "18:00" }] },
  wednesday: { isOpen: true, ranges: [{ open: "09:00", close: "18:00" }] },
  thursday: { isOpen: true, ranges: [{ open: "09:00", close: "18:00" }] },
  friday: { isOpen: true, ranges: [{ open: "09:00", close: "18:00" }] },
  saturday: { isOpen: true, ranges: [{ open: "09:00", close: "13:00" }] },
  sunday: { isOpen: false, ranges: [] }
};