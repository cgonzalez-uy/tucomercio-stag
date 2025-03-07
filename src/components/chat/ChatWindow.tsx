import { useEffect, useRef, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useChat } from '../../lib/hooks/useChat';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send, User, X, Search, ArrowLeft, Check, CheckCheck, Loader2, Paperclip, Image, File } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { isSuperAdmin } from '../../lib/auth';
import { cn } from '../../lib/utils';

// Add supported file types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const SUPPORTED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ChatWindowProps {
  chatId: string;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
}

export function ChatWindow({ chatId, onClose, onSelectChat }: ChatWindowProps) {
  const [user] = useAuthState(auth);
  const { 
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
  } = useChat(chatId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const isAdmin = user ? isSuperAdmin(user) : false;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !loadingMore) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMore]);

  // Handle infinite scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMore && !loadingMore) {
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, loadMoreMessages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert('El archivo no puede superar los 5MB');
      return;
    }

    // Validate file type
    if (![...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_DOC_TYPES].includes(file.type)) {
      alert('Tipo de archivo no soportado');
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.current?.value.trim() && !selectedFile) return;

    try {
      setSending(true);
      await sendMessage(inputRef.current?.value || '', selectedFile || undefined);
      
      // Clear input and file
      if (inputRef.current) inputRef.current.value = '';
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return '';
    
    try {
      return formatDistanceToNow(
        new Date(timestamp.seconds * 1000),
        { addSuffix: true, locale: es }
      );
    } catch (err) {
      console.error('Error formatting time:', err);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-red-500 text-center mb-4">
          {error || 'Chat no encontrado'}
        </p>
        <Button onClick={onClose}>Cerrar</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {chat.businessPhotoURL ? (
            <img
              src={chat.businessPhotoURL}
              alt={chat.businessName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
          )}

          <div>
            <h3 className="font-medium text-gray-900">{chat.businessName}</h3>
            <p className="text-sm text-gray-500">
              {isAdmin ? 'Soporte técnico' : 'Administrador'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hidden md:flex"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="p-4 border-b bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar en la conversación..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value) {
                  searchMessages(e.target.value);
                }
              }}
              className="pl-10"
            />
          </div>
          {searching && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-2">
              {searchResults.map((message) => (
                <div
                  key={message.id}
                  className="p-2 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    // TODO: Scroll to message
                    setShowSearch(false);
                    setSearchTerm('');
                  }}
                >
                  <p className="text-sm text-gray-900">{message.content}</p>
                  <p className="text-xs text-gray-500">
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === user?.uid;
          const showSender = index === 0 || messages[index - 1]?.senderId !== message.senderId;

          return (
            <div
              key={message.id}
              className={cn(
                "flex items-end gap-2",
                isOwnMessage ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[70%] group",
                isOwnMessage ? "items-end" : "items-start"
              )}>
                {showSender && (
                  <p className="text-xs text-gray-500 mb-1 px-1">
                    {message.senderName}
                  </p>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2",
                    isOwnMessage 
                      ? "bg-primary text-white rounded-br-none" 
                      : "bg-white text-gray-900 rounded-bl-none shadow-sm"
                  )}
                >
                  {/* Message content */}
                  {message.content && (
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}

                  {/* Attachment */}
                  {message.attachment && (
                    <div className="mt-2">
                      {message.attachment.type === 'image' ? (
                        <a 
                          href={message.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img 
                            src={message.attachment.url} 
                            alt={message.attachment.name}
                            className="max-w-[200px] rounded-lg"
                          />
                        </a>
                      ) : (
                        <a 
                          href={message.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer" 
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg transition-colors",
                            isOwnMessage 
                              ? "bg-white/10 hover:bg-white/20" 
                              : "bg-gray-100 hover:bg-gray-200"
                          )}
                        >
                          <File className="h-4 w-4" />
                          <span className="text-sm truncate">{message.attachment.name}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 px-1">
                  <span className="text-xs text-gray-500">
                    {formatMessageTime(message.createdAt)}
                  </span>
                  {isOwnMessage && (
                    <div className="text-xs text-gray-500">
                      {message.read ? (
                        <CheckCheck className="h-3 w-3 text-primary" />
                      ) : message.delivered ? (
                        <CheckCheck className="h-3 w-3" />
                      ) : message.sent ? (
                        <Check className="h-3 w-3" />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        {selectedFile && (
          <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center gap-2">
            {SUPPORTED_IMAGE_TYPES.includes(selectedFile.type) ? (
              <Image className="h-4 w-4" />
            ) : (
              <File className="h-4 w-4" />
            )}
            <span className="text-sm truncate flex-1">{selectedFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={[...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_DOC_TYPES].join(',')}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0"
            disabled={sending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            disabled={sending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full shrink-0"
            disabled={sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}