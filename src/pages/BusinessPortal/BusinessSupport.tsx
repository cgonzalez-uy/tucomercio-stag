import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useChats } from '../../lib/hooks/useChats';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { MessageCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';

export function BusinessSupport() {
  const [user] = useAuthState(auth);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const { createChat, chats, loading } = useChats();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);

  // Get businessId from user claims
  useEffect(() => {
    const getBusinessId = async () => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult(true);
        if (idTokenResult.claims.businessId) {
          setBusinessId(idTokenResult.claims.businessId as string);
        }
      }
    };

    getBusinessId();
  }, [user]);

  // Initialize chat
  useEffect(() => {
    const initChat = async () => {
      if (!businessId || loading) return;

      try {
        setLoadingChat(true);
        // Check if there's an existing chat
        const existingChat = chats[0]; // Get most recent chat
        if (existingChat) {
          setSelectedChatId(existingChat.id);
        } else {
          // Create new chat
          const chatId = await createChat(businessId);
          setSelectedChatId(chatId);
        }
      } catch (err) {
        console.error('Error initializing support chat:', err);
      } finally {
        setLoadingChat(false);
      }
    };

    initChat();
  }, [businessId, chats, loading]);

  if (loading || loadingChat) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!selectedChatId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full inline-block mx-auto">
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Soporte Técnico
            </h3>
            <p className="text-gray-500 mb-4">
              Estamos aquí para ayudarte con cualquier consulta o problema que tengas
            </p>
            <Button
              onClick={async () => {
                if (!businessId) return;
                setLoadingChat(true);
                try {
                  const chatId = await createChat(businessId);
                  setSelectedChatId(chatId);
                } catch (err) {
                  console.error('Error creating chat:', err);
                } finally {
                  setLoadingChat(false);
                }
              }}
              disabled={loadingChat}
            >
              Iniciar conversación
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm overflow-hidden">
      <ChatWindow
        chatId={selectedChatId}
        onClose={() => setSelectedChatId(null)}
        onSelectChat={setSelectedChatId}
      />
    </div>
  );
}