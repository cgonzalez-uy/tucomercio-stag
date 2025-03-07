import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { PaymentAccount } from '../types/payment';

export function usePaymentAccounts() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'payment_accounts'));
      const accountsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as PaymentAccount[];
      setAccounts(accountsData.sort((a, b) => a.bank.localeCompare(b.bank)));
      setError(null);
    } catch (err) {
      console.error('Error fetching payment accounts:', err);
      setError('Error al cargar las cuentas bancarias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (data: Omit<PaymentAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'payment_accounts'), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchAccounts();
      return docRef.id;
    } catch (err) {
      console.error('Error creating payment account:', err);
      throw new Error('Error al crear la cuenta bancaria');
    }
  };

  const updateAccount = async (id: string, data: Partial<PaymentAccount>) => {
    try {
      const accountRef = doc(db, 'payment_accounts', id);
      await updateDoc(accountRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      await fetchAccounts();
    } catch (err) {
      console.error('Error updating payment account:', err);
      throw new Error('Error al actualizar la cuenta bancaria');
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'payment_accounts', id));
      await fetchAccounts();
    } catch (err) {
      console.error('Error deleting payment account:', err);
      throw new Error('Error al eliminar la cuenta bancaria');
    }
  };

  return {
    accounts,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount
  };
}