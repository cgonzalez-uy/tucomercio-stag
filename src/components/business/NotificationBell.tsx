import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../lib/hooks/useNotifications';
import { Button } from '../ui/button';
import { 
  Bell, 
  Star, 
  Heart, 
  MessageCircle, 
  Percent, 
  Ticket,
  ChevronRight,
  X 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import type { NotificationType } from '../../types/notification';

interface NotificationBellProps {
  businessId: string | null; // null for user and admin portals
}

export function NotificationBell({ businessId }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(businessId);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Show only the 5 most recent notifications in the dropdown
  const recentNotifications = notifications.slice(0, 5);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'new_review':
        return <Star className="h-4 w-4 text-yellow-600" />;
      case 'new_favorite':
        return <Heart className="h-4 w-4 text-red-600" />;
      case 'new_support_chat':
      case 'new_support_message':
      case 'new_business_chat':
      case 'new_business_message':
        return <MessageCircle className="h-4 w-4 text-blue-600" />;
      case 'new_promotion':
        return <Percent className="h-4 w-4 text-green-600" />;
      case 'new_coupon':
        return <Ticket className="h-4 w-4 text-purple-600" />;
      case 'new_review_reply':
        return <MessageCircle className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type: NotificationType) => {
    switch (type) {
      case 'new_review':
        return 'bg-yellow-100';
      case 'new_favorite':
        return 'bg-red-100';
      case 'new_support_chat':
      case 'new_support_message':
      case 'new_business_chat':
      case 'new_business_message':
        return 'bg-blue-100';
      case 'new_promotion':
        return 'bg-green-100';
      case 'new_coupon':
        return 'bg-purple-100';
      case 'new_review_reply':
        return 'bg-primary/10';
      default:
        return 'bg-gray-100';
    }
  };

  const getNotificationContent = (notification: any) => {
    switch (notification.type) {
      case 'new_favorite':
        return (
          <>
            <span className="font-medium">{notification.userDisplayName}</span>{' '}
            agregó tu comercio a favoritos
          </>
        );
      case 'new_review':
        return (
          <>
            <span className="font-medium">{notification.userDisplayName}</span>{' '}
            dejó una reseña
          </>
        );
      case 'new_support_chat':
      case 'new_support_message':
        return (
          <>
            <span className="font-medium">Soporte técnico</span>:{' '}
            {notification.messageContent}
          </>
        );
      case 'new_business_chat':
      case 'new_business_message':
        return (
          <>
            <span className="font-medium">{notification.businessName}</span>:{' '}
            {notification.messageContent}
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
      case 'new_review_reply':
        return (
          <>
            <span className="font-medium">{notification.businessName}</span>{' '}
            ha respondido a tu reseña:{' '}
            <span className="text-gray-600">"{notification.replyContent}"</span>
          </>
        );
      default:
        return null;
    }
  };

  const getNotificationLink = (notification: any) => {
    if (businessId) {
      // Business portal
      switch (notification.type) {
        case 'new_review':
          return '/portal/reviews';
        case 'new_support_chat':
        case 'new_support_message':
          return '/portal/support';
        case 'new_favorite':
          return '/portal/dashboard';
        default:
          return '/portal/dashboard';
      }
    } else if (notification.recipientId === 'admin') {
      // Admin portal
      switch (notification.type) {
        case 'new_business_chat':
        case 'new_business_message':
          return '/superadmin/messages';
        default:
          return '/superadmin';
      }
    } else {
      // User portal
      switch (notification.type) {
        case 'new_promotion':
        case 'new_coupon':
          return `/comercios/${notification.businessId}`;
        case 'new_review_reply':
          return '/reviews';
        default:
          return '/';
      }
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:absolute lg:inset-auto">
          {/* Overlay en móvil */}
          <div className="fixed inset-0 bg-black/20 lg:hidden" onClick={() => setIsOpen(false)} />

          {/* Panel de notificaciones */}
          <div className={cn(
            "fixed right-4 left-4 top-20 lg:absolute lg:top-auto lg:left-auto",
            "lg:right-0 lg:mt-2 lg:w-80",
            "bg-white rounded-lg shadow-lg border",
            "max-h-[80vh] flex flex-col"
          )}>
            {/* Header fijo */}
            <div className="sticky top-0 bg-white border-b z-10">
              <div className="p-4 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Notificaciones</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsRead()}
                    className="text-xs"
                  >
                    Marcar todas como leídas
                  </Button>
                )}
              </div>
            </div>

            {/* Lista de notificaciones con scroll */}
            <div className="overflow-y-auto divide-y">
              {recentNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No hay notificaciones
                </div>
              ) : (
                <>
                  {recentNotifications.map(notification => (
                    <Link
                      key={notification.id}
                      to={getNotificationLink(notification)}
                      className={cn(
                        "block w-full px-4 py-3 hover:bg-gray-50 text-left",
                        !notification.read && "bg-primary/5"
                      )}
                      onClick={() => {
                        markAsRead(notification.id);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-full shrink-0",
                          getNotificationBgColor(notification.type)
                        )}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {getNotificationContent(notification)}
                          </p>
                          {notification.type === 'new_review' && notification.reviewRating && (
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-3 w-3",
                                    i < notification.reviewRating!
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
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
                  {notifications.length > 5 && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        window.location.href = businessId 
                          ? '/portal/notifications' 
                          : notification.recipientId === 'admin'
                            ? '/superadmin/notifications'
                            : '/notifications';
                      }}
                      className="block w-full p-4 text-center text-primary hover:bg-primary/5 font-medium"
                    >
                      Ver todas las notificaciones
                      <ChevronRight className="h-4 w-4 inline-block ml-1" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}