import type { Timestamp } from 'firebase/firestore';

export interface BusDestination {
  id: string;
  name: string;
  terminal: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BusLine {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BusLineType {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BusRoute {
  id: string;
  lineId: string;
  typeId: string;
  originId: string;
  destinationId: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BusSchedule {
  id: string;
  routeId: string;
  departureTime: string;
  daysOfWeek: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}