import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useBusinessMetrics } from '../../lib/hooks/useBusinessMetrics';
import { useFavoritesCount } from '../../lib/hooks/useFavoritesCount';
import { useEvents } from '../../lib/hooks/useEvents';
import { useBusinesses } from '../../lib/hooks/useBusinesses';
import { usePlans } from '../../lib/hooks/usePlans';
import { Store, Phone, Globe, Instagram, Facebook, MessageCircle, Users, Clock, Heart, Calendar, Crown, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../../components/ui/button';

export function BusinessDashboard() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const { businesses } = useBusinesses();
  const { plans } = usePlans();
  const { metrics, loading, error, getMetrics } = useBusinessMetrics(businessId || '');
  const { count: favoritesCount, loading: loadingFavorites } = useFavoritesCount(businessId);
  const { events, loading: loadingEvents } = useEvents();

  // Get businessId and plan info
  useEffect(() => {
    const getBusinessInfo = async () => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.businessId) {
          setBusinessId(idTokenResult.claims.businessId);
        }
      }
    };

    getBusinessInfo();
  }, [user]);

  // Load metrics when businessId is available
  useEffect(() => {
    if (businessId) {
      getMetrics();
    }
  }, [businessId, getMetrics]);

  // Get business and plan info
  const business = businesses.find(b => b.id === businessId);
  const plan = business ? plans.find(p => p.id === business.planId) : null;
  const planStartDate = business?.planStartDate?.toDate();
  const planEndDate = planStartDate ? new Date(planStartDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
  const daysUntilExpiration = planEndDate ? Math.ceil((planEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 7;

  // Get upcoming events count
  const upcomingEventsCount = events.filter(event => {
    const now = new Date();
    const eventDate = new Date(event.startDate.seconds * 1000);
    return event.isActive && eventDate > now;
  }).length;

  // Get top 2 most active hours
  const getTopHours = () => {
    if (!metrics?.hourlyStats) return [];

    return Object.entries(metrics.hourlyStats)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([hour, visits]) => ({
        hour: parseInt(hour),
        visits: visits as number
      }));
  };

  if (loading || loadingFavorites || loadingEvents) {
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

  const topHours = getTopHours();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Plan Expiration Warning */}
      {planStartDate && (
        <div className={cn(
          "bg-white p-6 rounded-lg shadow-sm",
          isExpiringSoon && "bg-yellow-50 border border-yellow-200"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isExpiringSoon ? "bg-yellow-100" : "bg-primary/10"
            )}>
              <Crown className={cn(
                "h-5 w-5",
                isExpiringSoon ? "text-yellow-600" : "text-primary"
              )} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Plan actual</p>
              <p className="text-lg font-semibold text-gray-900">
                {plan?.name || 'Plan Básico'}
              </p>
              <p className={cn(
                "text-sm",
                isExpiringSoon ? "text-yellow-600 font-medium" : "text-gray-500"
              )}>
                Vence el {planEndDate?.toLocaleDateString('es-UY', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
                {isExpiringSoon && ` (en ${daysUntilExpiration} días)`}
              </p>
            </div>
            {isExpiringSoon && (
              <div className="ml-auto">
                <Button
                  onClick={() => navigate('/portal/settings')}
                  className="flex items-center gap-2"
                >
                  Renovar plan
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Visitas totales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.profileViews || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">En favoritos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {favoritesCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Clicks en teléfono</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.phoneClicks || 0}
              </p>
            </div>
          </div>
        </div>

        <Link 
          to="/portal/events"
          className={cn(
            "bg-white p-6 rounded-lg shadow-sm",
            "hover:shadow-md transition-shadow",
            "group cursor-pointer"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Nuevos Eventos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {upcomingEventsCount}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Redes sociales y horarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Clicks en redes sociales</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E4405F]/10 rounded-lg">
                <Instagram className="h-5 w-5 text-[#E4405F]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-700">Instagram</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {metrics?.socialClicks?.instagram || 0}
                  </p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#E4405F] rounded-full"
                    style={{ width: `${metrics?.socialClicks?.instagram || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#1877F2]/10 rounded-lg">
                <Facebook className="h-5 w-5 text-[#1877F2]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-700">Facebook</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {metrics?.socialClicks?.facebook || 0}
                  </p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1877F2] rounded-full"
                    style={{ width: `${metrics?.socialClicks?.facebook || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#25D366]/10 rounded-lg">
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-700">WhatsApp</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {metrics?.socialClicks?.whatsapp || 0}
                  </p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#25D366] rounded-full"
                    style={{ width: `${metrics?.socialClicks?.whatsapp || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Globe className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-700">Sitio web</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {metrics?.socialClicks?.website || 0}
                  </p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-600 rounded-full"
                    style={{ width: `${metrics?.socialClicks?.website || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Horarios más activos */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Horarios más activos</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {topHours.map(({ hour, visits }, index) => (
              <div key={hour} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {hour.toString().padStart(2, '0')}:00 - {hour.toString().padStart(2, '0')}:59
                  </p>
                  <p className="text-xl font-semibold text-gray-900">
                    {visits} visitas
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}