import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useNotifications } from '../lib/hooks/useNotifications';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Star, Heart, Percent, ArrowLeft, MessageCircle, Ticket } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function UserNotificationsPage() {
  const [user] = useAuthState(auth);
  const { notifications, loading, error, markAsRead, markAllAsRead } = useNotifications(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Calculate total pages
  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);

  // Get notifications for current page
  const paginatedNotifications = notifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_review_reply':
        return <MessageCircle className="h-5 w-5 text-primary" />;
      case 'new_promotion':
        return <Percent className="h-5 w-5 text-green-600" />;
      case 'new_coupon':
        return <Ticket className="h-5 w-5 text-purple-600" />;
      default:
        return null;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'new_review_reply':
        return 'bg-primary/10';
      case 'new_promotion':
        return 'bg-green-100';
      case 'new_coupon':
        return 'bg-purple-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getNotificationContent = (notification: any) => {
    switch (notification.type) {
      case 'new_review_reply':
        return (
          <>
            <span className="font-medium">{notification.businessName}</span>{' '}
            ha respondido a tu reseña:{' '}
            <span className="text-gray-600">"{notification.replyContent}"</span>
          </>
        );
      case 'new_promotion':
        return (
          <>
            <span className="font-medium">{notification.businessName}</span>{' '}
            tiene una nueva promoción: {notification.promotionDiscount}% de descuento en {notification.promotionTitle}
          </>
        );
      case 'new_coupon':
        return (
          <>
            <span className="font-medium">{notification.businessName}</span>{' '}
            ha creado un nuevo cupón de {notification.couponDiscount}% de descuento
          </>
        );
      default:
        return null;
    }
  };

  const getNotificationLink = (notification: any) => {
    switch (notification.type) {
      case 'new_review_reply':
        return '/reviews';
      case 'new_promotion':
      case 'new_coupon':
        return `/comercios/${notification.businessId}`;
      default:
        return '/';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Inicia sesión para ver tus notificaciones
          </h2>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/profile"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a mi perfil</span>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          {notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsRead()}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No tienes notificaciones
            </h2>
            <p className="text-gray-600 mb-6">
              Aquí verás las notificaciones de tus comercios favoritos
            </p>
            <Button asChild>
              <Link to="/">Explorar comercios</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedNotifications.map((notification) => (
              <Link
                key={notification.id}
                to={getNotificationLink(notification)}
                onClick={() => markAsRead(notification.id)}
                className={cn(
                  "block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow",
                  !notification.read && "bg-primary/5"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-2 rounded-full shrink-0",
                    getNotificationBgColor(notification.type)
                  )}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900">
                      {getNotificationContent(notification)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDistanceToNow(
                        new Date(notification.createdAt.seconds * 1000),
                        { addSuffix: true, locale: es }
                      )}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              </Link>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}