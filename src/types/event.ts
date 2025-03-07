import type { Timestamp } from 'firebase/firestore';

export interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  image?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  location: string;
  category: EventCategory;
  organizer: string;
  price: number; // 0 para eventos gratuitos
  capacity?: number; // opcional, para eventos con límite de capacidad
  registrationRequired: boolean;
  registeredUsers?: string[]; // IDs de usuarios registrados
  participatingBusinesses?: string[]; // IDs de comercios participantes
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const EVENT_CATEGORIES = {
  cultural: 'Cultural',
  deportivo: 'Deportivo',
  educativo: 'Educativo',
  familiar: 'Familiar',
  musical: 'Musical',
  gastronomico: 'Gastronómico',
  social: 'Social',
  otro: 'Otro'
} as const;

export type EventCategory = keyof typeof EVENT_CATEGORIES;