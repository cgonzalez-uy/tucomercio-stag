import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  where, 
  Timestamp,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { isSuperAdmin } from '../auth';
import type { Chat } from '../../types/chat';

export function useChats() {
  const [user] = useAuthState(auth);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const isAdmin = isSuperAdmin(user);
    let q;

    if (isAdmin) {
      // Admins see all chats
      q = query(
        collection(db, 'chats'),
        orderBy('updatedAt', 'desc')
      );
    } else {
      // Business users only see their chat
      const idTokenResult = user.getIdTokenResult();
      const businessId = idTokenResult.claims?.businessId;
      
      if (!businessId) {
        setChats([]);
        setLoading(false);
        return;
      }

      q = query(
        collection(db, 'chats'),
        where('businessId', '==', businessId),
        orderBy('updatedAt', 'desc'),
        limit(1)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[]);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching chats:', err);
      setError('Error al cargar los chats');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createChat = async (businessId: string) => {
    if (!user) return;

    try {
      // Check if chat already exists for this business
      const existingChats = await getDocs(
        query(
          collection(db, 'chats'),
          where('businessId', '==', businessId),
          limit(1)
        )
      );

      if (!existingChats.empty) {
        return existingChats.docs[0].id;
      }

      // Get business info
      const businessDoc = await getDoc(doc(db, 'businesses', businessId));
      if (!businessDoc.exists()) {
        throw new Error('Comercio no encontrado');
      }

      const businessData = businessDoc.data();

      // Create chat
      const chatRef = await addDoc(collection(db, 'chats'), {
        businessId,
        businessName: businessData.name,
        businessPhotoURL: businessData.image || null,
        participants: {
          [user.uid]: {
            unreadCount: 0,
            lastRead: serverTimestamp()
          }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return chatRef.id;
    } catch (err) {
      console.error('Error creating chat:', err);
      throw new Error('Error al crear el chat');
    }
  };

  const markAllAsRead = async (chatId: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'chats', chatId), {
        [`participants.${user.uid}.unreadCount`]: 0,
        [`participants.${user.uid}.lastRead`]: serverTimestamp()
      });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  return {
    chats,
    loading,
    error,
    createChat,
    markAllAsRead
  };
}