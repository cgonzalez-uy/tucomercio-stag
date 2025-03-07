import { useEffect, useRef, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { isSuperAdmin } from '../auth';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  getDoc,
  where,
  limit,
  getDocs,
  startAfter,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import type { Chat, Message, MessageAttachment } from '../../types/chat';

const MESSAGES_PER_PAGE = 50;

export function useChat(chatId: string | undefined) {
  const [user] = useAuthState(auth);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  // Subscribe to chat document
  useEffect(() => {
    if (!chatId || !user) return;

    const unsubscribe = onSnapshot(
      doc(db, 'chats', chatId),
      async (doc) => {
        if (doc.exists()) {
          const chatData = doc.data() as Chat;
          setChat({ id: doc.id, ...chatData });
          setError(null);
        } else {
          setChat(null);
          setError('Chat no encontrado');
        }
      },
      (err) => {
        console.error('Error fetching chat:', err);
        setError('Error al cargar el chat');
      }
    );

    return () => unsubscribe();
  }, [chatId, user]);

  // Subscribe to messages
  useEffect(() => {
    if (!chatId || !user) return;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(MESSAGES_PER_PAGE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      setMessages(newMessages.reverse());
      setLastMessage(snapshot.docs[snapshot.docs.length - 1]);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching messages:', err);
      setError('Error al cargar los mensajes');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  // Load more messages
  const loadMoreMessages = async () => {
    if (!chatId || !lastMessage || !hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const q = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'desc'),
        startAfter(lastMessage),
        limit(MESSAGES_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setHasMore(false);
        return;
      }

      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      setMessages(prev => [...prev, ...newMessages.reverse()]);
      setLastMessage(snapshot.docs[snapshot.docs.length - 1]);
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Search messages
  const searchMessages = async (term: string) => {
    if (!chatId || !term) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const q = query(
        collection(db, 'chats', chatId, 'messages'),
        where('content', '>=', term),
        where('content', '<=', term + '\uf8ff'),
        orderBy('content'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      setSearchResults(results);
    } catch (err) {
      console.error('Error searching messages:', err);
    } finally {
      setSearching(false);
    }
  };

  const sendMessage = async (content: string, attachment?: File) => {
    if (!user || !chatId) {
      throw new Error('No se puede enviar el mensaje: falta información requerida');
    }

    // Get chat data first
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (!chatDoc.exists()) {
      throw new Error('Chat no encontrado');
    }
    const chatData = chatDoc.data() as Chat;

    try {
      const isAdmin = isSuperAdmin(user);
      
      // Upload attachment if present
      let messageAttachment: MessageAttachment | undefined;
      if (attachment) {
        const storageRef = ref(storage, `chats/${chatId}/files/${attachment.name}`);
        const snapshot = await uploadBytes(storageRef, attachment);
        const url = await getDownloadURL(snapshot.ref);

        messageAttachment = {
          url,
          type: attachment.type.startsWith('image/') ? 'image' : 'document',
          name: attachment.name,
          size: attachment.size
        };
      }

      // Create message document data
      const messageData: Omit<Message, 'id'> = {
        content: content.trim(),
        senderId: user.uid,
        senderName: isAdmin ? 'Soporte' : chatData.businessName,
        senderPhotoURL: user.photoURL || null,
        sent: true,
        delivered: false,
        read: false,
        createdAt: serverTimestamp() as any
      };

      // Only add attachment if it exists
      if (messageAttachment) {
        messageData.attachment = messageAttachment;
      }

      // Create message with transaction
      const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
      
      await runTransaction(db, async (transaction) => {
        // Create message
        transaction.set(messageRef, messageData);

        // Update chat
        transaction.update(doc(db, 'chats', chatId), {
          lastMessage: {
            content: messageAttachment 
              ? `[${messageAttachment.type === 'image' ? 'Imagen' : 'Documento'}] ${content.trim()}`
              : content.trim(),
            senderId: user.uid,
            createdAt: serverTimestamp()
          },
          updatedAt: serverTimestamp(),
          [`participants.${user.uid}.unreadCount`]: 0,
          [`participants.${user.uid}.lastRead`]: serverTimestamp()
        });

        // Create notification
        const notificationRef = doc(collection(db, 'notifications'));
        const notificationData = {
          type: isAdmin ? 'new_support_message' : 'new_business_message',
          businessId: chatData.businessId,
          businessName: chatData.businessName,
          businessPhotoURL: chatData.businessPhotoURL,
          chatId,
          messageContent: messageAttachment 
            ? `[${messageAttachment.type === 'image' ? 'Imagen' : 'Documento'}] ${content.trim()}`
            : content.trim(),
          recipientId: isAdmin ? chatData.businessId : 'admin',
          read: false,
          createdAt: serverTimestamp()
        };

        transaction.set(notificationRef, notificationData);

        // Create recipient record in subcollection
        const recipientRef = doc(collection(db, `notifications/${notificationRef.id}/recipients`));
        transaction.set(recipientRef, {
          userId: isAdmin ? chatData.businessId : 'admin',
          read: false,
          createdAt: serverTimestamp()
        });
      });

      return messageRef.id;
    } catch (err) {
      console.error('Error sending message:', err);
      throw new Error('Error al enviar el mensaje');
    }
  };

  return {
    chat,
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    searchTerm,
    searchResults,
    searching,
    loadMoreMessages,
    searchMessages,
    setSearchTerm,
    sendMessage
  };
}