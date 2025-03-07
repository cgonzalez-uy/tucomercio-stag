export interface PaymentAccount {
  id: string;
  bank: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}