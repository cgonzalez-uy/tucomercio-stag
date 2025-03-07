import { useState } from 'react';
import { ChatList } from '../components/chat/ChatList';
import { ChatWindow } from '../components/chat/ChatWindow';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';

export function AdminMessagesPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="h-full flex bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Lista de chats - siempre visible en desktop, oculta en móvil si hay chat seleccionado */}
        <div className={cn(
          "w-full md:w-80 border-r",
          selectedChatId ? "hidden md:block" : "block"
        )}>
          <ChatList
            selectedChatId={selectedChatId || undefined}
            onSelectChat={handleSelectChat}
          />
        </div>

        {/* Ventana de chat o mensaje de bienvenida */}
        <div className={cn(
          "flex-1",
          selectedChatId ? "block" : "hidden md:block"
        )}>
          {selectedChatId ? (
            <div className="h-full flex flex-col">
              {/* Botón volver en móvil */}
              <div className="md:hidden p-4 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedChatId(null)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a mensajes
                </Button>
              </div>

              <div className="flex-1">
                <ChatWindow
                  chatId={selectedChatId}
                  onClose={() => setSelectedChatId(null)}
                  onSelectChat={handleSelectChat}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-4">
              <div className="text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full inline-block mx-auto">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Centro de mensajes
                  </h3>
                  <p className="text-gray-500">
                    Selecciona una conversación para ver los mensajes
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}