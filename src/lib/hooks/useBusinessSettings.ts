import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { PaymentAccount } from '../types/payment';

const PAYMENT_METHODS = [
  {
    bank: "Mi Dinero",
    accountNumber: "123456789",
    accountName: "TuComercio.uy",
    accountType: "Caja de Ahorros"
  },
  {
    bank: "Prex",
    accountNumber: "987654321",
    accountName: "TuComercio.uy",
    accountType: "Cuenta Prex"
  },
  {
    bank: "Itaú",
    accountNumber: "456789123",
    accountName: "TuComercio.uy",
    accountType: "Cuenta Corriente"
  }
];

export function useBusinessSettings() {
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentAccounts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'payment_accounts'));
        const accounts = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          }))
          .filter(account => account.isActive) as PaymentAccount[];

        // If no accounts in database, use default ones
        if (accounts.length === 0) {
          setPaymentAccounts(PAYMENT_METHODS as PaymentAccount[]);
        } else {
          setPaymentAccounts(accounts);
        }
      } catch (err) {
        console.error('Error fetching payment accounts:', err);
        // Fallback to default payment methods if there's an error
        setPaymentAccounts(PAYMENT_METHODS as PaymentAccount[]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentAccounts();
  }, []);

  return {
    paymentAccounts,
    loading,
    error
  };
}