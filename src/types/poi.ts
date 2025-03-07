export interface PointOfInterest {
  id: string;
  name: string;
  type: string; // police, hospital, bank, etc.
  description?: string;
  address: string;
  phones: string[];
  schedule: {
    monday: { isOpen: boolean; hours: string; };
    tuesday: { isOpen: boolean; hours: string; };
    wednesday: { isOpen: boolean; hours: string; };
    thursday: { isOpen: boolean; hours: string; };
    friday: { isOpen: boolean; hours: string; };
    saturday: { isOpen: boolean; hours: string; };
    sunday: { isOpen: boolean; hours: string; };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const POI_TYPES = {
  police: 'Policía',
  fireStation: 'Bomberos',
  hospital: 'Hospital',
  bank: 'Banco',
  postOffice: 'Correo',
  library: 'Biblioteca',
  townHall: 'Municipalidad',
  other: 'Otro'
} as const;

export type PoiType = keyof typeof POI_TYPES;