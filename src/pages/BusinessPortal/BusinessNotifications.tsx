import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useNotifications } from '../../lib/hooks/useNotifications';
import { Button } from '../../components/ui/button';
import { Star, Heart, Percent, MessageCircle, Ticket, Search, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '../../components/ui/input';

const ITEMS_PER_PAGE = 10;

export function BusinessNotifications() {
  const [user] = useAuthState(auth);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const { notifications, loading, error, markAsRead, markAllAsRead } = useNotifications(businessId);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Get businessId from user claims
  useEffect(() => {
    const getBusinessId = async () => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.businessId) {
          setBusinessId(idTokenResult.claims.businessId as string);
        }
      }
    };

    getBusinessId();
  }, [user]);

  // Filter notifications based on search term
  const filteredNotifications = notifications.filter(notification => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    // Search in different notification fields based on type
    switch (notification.type) {
      case 'new_favorite':
        return notification.userDisplayName?.toLowerCase().includes(term);
      case 'new_review':
        return (
          notification.userDisplayName?.toLowerCase().includes(term) ||
          notification.reviewContent?.toLowerCase().includes(term)
        );
      case 'new_support_message':
        return notification.messageContent?.toLowerCase().includes(term);
      default:
        return false;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_favorite':
        return <Heart className="h-5 w-5 text-red-600" />;
      case 'new_review':
        return <Star className="h-5 w-5 text-yellow-600" />;
      case 'new_support_message':
        return <MessageCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'new_favorite':
        return 'bg-red-100';
      case 'new_review':
        return 'bg-yellow-100';
      case 'new_support_message':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getNotificationContent = (notification: any) => {
    switch (notification.type) {
      case 'new_favorite':
        return (
          <div>
            <span className="font-medium">{notification.userDisplayName}</span>{' '}
            agregó tu comercio a favoritos
          </div>
        );
      case 'new_review':
        return (
          <div>
            <div>
              <span className="font-medium">{notification.userDisplayName}</span>{' '}
              dejó una reseña
            </div>
            {notification.reviewContent && (
              <div className="mt-1 text-gray-600 text-sm">
                "{notification.reviewContent}"
              </div>
            )}
            {notification.reviewRating && (
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < notification.reviewRating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        );
      case 'new_support_message':
        return (
          <div>
            <span className="font-medium">Soporte técnico</span>:{' '}
            {notification.messageContent}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
            <div className="text-sm text-gray-500">
              {notifications.length} {notifications.length === 1 ? 'notificación' : 'notificaciones'}
            </div>
          </div>
        </div>

        {notifications.length > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsRead()}
            className="w-full sm:w-auto"
          >
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar en notificaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron notificaciones' : 'No hay notificaciones'}
          </h3>
          <div className="text-gray-500">
            {searchTerm 
              ? 'Intenta con otros términos de búsqueda'
              : 'Las notificaciones aparecerán aquí'
            }
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow",
                !notification.read && "bg-primary/5 ring-1 ring-primary/10"
              )}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-2 rounded-full shrink-0",
                  getNotificationBgColor(notification.type)
                )}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      {getNotificationContent(notification)}
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDistanceToNow(
                          new Date(notification.createdAt.seconds * 1000),
                          { addSuffix: true, locale: es }
                        )}
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}