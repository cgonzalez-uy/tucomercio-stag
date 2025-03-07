import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { isSuperAdmin } from '../../lib/auth';
import { useChats } from '../../lib/hooks/useChats';
import { Button } from '../ui/button';
import { MessageCircle, X } from 'lucide-react';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';

interface ChatWidgetProps {
  businessId?: string;
}

export function ChatWidget({ businessId }: ChatWidgetProps) {
  const [user] = useAuthState(auth);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { createChat } = useChats();

  // Only show chat for business users and super admins
  const canAccessChat = user && (
    isSuperAdmin(user) || 
    (businessId && user.getIdTokenResult().claims?.businessId === businessId)
  );

  const handleNewChat = async () => {
    if (!businessId) return;

    try {
      const chatId = await createChat(businessId);
      setSelectedChatId(chatId);
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  if (!canAccessChat) return null;

  return (
    <>
      {/* Widget button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 shadow-lg"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </Button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[600px] bg-white rounded-lg shadow-xl border flex flex-col">
          {selectedChatId ? (
            <ChatWindow
              chatId={selectedChatId}
              onClose={() => setSelectedChatId(null)}
              onSelectChat={setSelectedChatId}
            />
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-medium text-gray-900">Mensajes</h2>
                {businessId && (
                  <Button
                    onClick={handleNewChat}
                    size="sm"
                  >
                    Nuevo mensaje
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                <ChatList
                  selectedChatId={selectedChatId || undefined}
                  onSelectChat={setSelectedChatId}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}