export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  features: string[];
  mercadoPagoLink?: string; // Optional MercadoPago payment link
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}