import { useBusinesses } from '../lib/hooks/useBusinesses';
import { usePlans } from '../lib/hooks/usePlans';
import { useReportedReviews } from '../lib/hooks/useReportedReviews';
import { useChats } from '../lib/hooks/useChats';
import { usePlanExpirations } from '../lib/hooks/usePlanExpirations';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { Store, Users, CreditCard, Star, MessageCircle, Crown, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

export function DashboardPage() {
  const [user] = useAuthState(auth);
  const { businesses } = useBusinesses();
  const { plans } = usePlans();
  const { reviews: reportedReviews, loading: loadingReviews } = useReportedReviews();
  const { chats, loading: loadingChats } = useChats();
  const { expiringBusinesses } = usePlanExpirations();

  // Calculate statistics
  const totalBusinesses = businesses.length;
  const activeBusinesses = businesses.filter(b => b.isActive).length;
  const pendingBusinesses = businesses.filter(b => !b.isActive).length;
  const totalPlans = plans.filter(p => p.isActive).length;
  const pendingReports = reportedReviews.length;
  const expiringPlans = expiringBusinesses.length;

  // Calculate total unread messages
  const unreadMessages = chats.reduce((total, chat) => {
    const adminUnread = chat.participants[user?.uid || '']?.unreadCount || 0;
    return total + adminUnread;
  }, 0);

  const stats = [
    {
      name: 'Total de comercios',
      value: totalBusinesses,
      icon: Store,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      name: 'Comercios activos',
      value: activeBusinesses,
      icon: Store,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      name: 'Solicitudes pendientes',
      value: pendingBusinesses,
      icon: Users,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      link: '/superadmin/requests'
    },
    {
      name: 'Planes activos',
      value: totalPlans,
      icon: CreditCard,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      link: '/superadmin/plans'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div 
            key={stat.name} 
            className={cn(
              "bg-white p-4 sm:p-6 rounded-lg shadow-sm",
              "hover:shadow-md transition-shadow",
              stat.link && "cursor-pointer"
            )}
            onClick={() => stat.link && window.location.assign(stat.link)}
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", `${stat.color}/10`)}>
                <stat.icon className={cn("h-6 w-6", stat.textColor)} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expiring Plans */}
        {expiringPlans > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Crown className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Planes próximos a vencer
                  </h3>
                  <p className="text-sm text-gray-500">
                    {expiringPlans} {expiringPlans === 1 ? 'comercio' : 'comercios'} con plan próximo a vencer
                  </p>
                </div>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link to="/superadmin/plan-expirations">Ver planes</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Unread Messages */}
        {unreadMessages > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Mensajes sin leer
                  </h3>
                  <p className="text-sm text-gray-500">
                    Tienes {unreadMessages} {unreadMessages === 1 ? 'mensaje pendiente' : 'mensajes pendientes'} de respuesta
                  </p>
                </div>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link to="/superadmin/messages">Ver mensajes</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Reported Reviews */}
        {pendingReports > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Star className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Reseñas reportadas pendientes
                  </h3>
                  <p className="text-sm text-gray-500">
                    Hay {pendingReports} {pendingReports === 1 ? 'reporte pendiente' : 'reportes pendientes'} de revisión
                  </p>
                </div>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link to="/superadmin/reviews">Ver reportes</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}