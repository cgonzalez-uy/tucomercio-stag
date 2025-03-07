import { useState } from 'react';
import { useChats } from '../../lib/hooks/useChats';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { MessageCircle, Search, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';

interface ChatListProps {
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
}

export function ChatList({ selectedChatId, onSelectChat }: ChatListProps) {
  const { chats, loading, error } = useChats();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter chats based on search term
  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      chat.businessName.toLowerCase().includes(term) ||
      (chat.lastMessage?.content || '').toLowerCase().includes(term)
    );
  });

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return '';
    
    try {
      return formatDistanceToNow(new Date(timestamp.seconds * 1000), {
        addSuffix: true,
        locale: es
      });
    } catch (err) {
      console.error('Error formatting time:', err);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-red-500 text-center mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <p className="text-gray-500 text-center">
              {searchTerm ? 'No se encontraron chats' : 'No hay chats activos'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "w-full p-4 text-left hover:bg-gray-50 transition-colors",
                  selectedChatId === chat.id && "bg-primary/5"
                )}
              >
                <div className="flex items-center gap-3">
                  {chat.businessPhotoURL ? (
                    <img
                      src={chat.businessPhotoURL}
                      alt={chat.businessName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {chat.businessName}
                      </p>
                      {chat.lastMessage?.createdAt && (
                        <p className="text-xs text-gray-500 whitespace-nowrap">
                          {formatMessageTime(chat.lastMessage.createdAt)}
                        </p>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {chat.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}