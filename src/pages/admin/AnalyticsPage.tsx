import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/button';
import { Calendar } from '../../components/ui/calendar';
import {
  Users,
  Store,
  TrendingUp,
  Star,
  Heart,
  MessageCircle,
  Calendar as CalendarIcon,
  Filter,
  ArrowUp,
  ArrowDown,
  Phone,
  Share2,
  Search,
  Eye,
  CreditCard,
  BarChart
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    to: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalReviews: 0,
    averageRating: 0,
    totalFavorites: 0,
    totalMessages: 0,
    topBusinesses: [] as any[],
    topCategories: [] as any[],
    userGrowth: [] as any[],
    businessGrowth: [] as any[],
    // Analytics metrics
    pageViews: 0,
    uniqueVisitors: 0,
    searchCount: 0,
    contactClicks: 0,
    socialClicks: {
      instagram: 0,
      facebook: 0,
      whatsapp: 0,
      website: 0
    },
    engagementScores: [] as any[],
    popularHours: [] as {hour: number, count: number}[],
    conversionRate: 0,
    bounceRate: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Convert dates to timestamps for Firestore queries
        const fromTimestamp = Timestamp.fromDate(dateRange.from);
        const toTimestamp = Timestamp.fromDate(dateRange.to);

        // Fetch users stats
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(query(
          usersRef,
          where('createdAt', '>=', fromTimestamp),
          where('createdAt', '<=', toTimestamp)
        ));
        const totalUsers = usersSnapshot.size;

        // Fetch businesses stats
        const businessesRef = collection(db, 'businesses');
        const businessesSnapshot = await getDocs(query(
          businessesRef,
          where('createdAt', '>=', fromTimestamp),
          where('createdAt', '<=', toTimestamp)
        ));
        const businesses = businessesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const totalBusinesses = businesses.length;
        const activeBusinesses = businesses.filter(b => b.isActive).length;

        // Fetch business metrics
        const metricsRef = collection(db, 'business_metrics');
        const metricsSnapshot = await getDocs(metricsRef);
        const metrics = metricsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate total views and engagement
        const totalViews = metrics.reduce((sum, m) => sum + (m.profileViews || 0), 0);
        const totalContacts = metrics.reduce((sum, m) => sum + (m.phoneClicks || 0), 0);
        const socialClicks = metrics.reduce((acc, m) => ({
          instagram: acc.instagram + (m.socialClicks?.instagram || 0),
          facebook: acc.facebook + (m.socialClicks?.facebook || 0),
          whatsapp: acc.whatsapp + (m.socialClicks?.whatsapp || 0),
          website: acc.website + (m.socialClicks?.website || 0)
        }), { instagram: 0, facebook: 0, whatsapp: 0, website: 0 });

        // Calculate popular hours
        const hourlyStats = metrics.reduce((acc, m) => {
          Object.entries(m.hourlyStats || {}).forEach(([hour, count]) => {
            acc[hour] = (acc[hour] || 0) + (count as number);
          });
          return acc;
        }, {} as Record<string, number>);

        const popularHours = Object.entries(hourlyStats)
          .map(([hour, count]) => ({
            hour: parseInt(hour),
            count: count as number
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Get top businesses by views
        const topBusinesses = await Promise.all(
          metrics
            .sort((a, b) => (b.profileViews || 0) - (a.profileViews || 0))
            .slice(0, 5)
            .map(async metric => {
              const business = businesses.find(b => b.id === metric.businessId);
              return {
                id: metric.businessId,
                name: business?.name || 'Comercio desconocido',
                views: metric.profileViews || 0,
                contacts: metric.phoneClicks || 0,
                socialEngagement: Object.values(metric.socialClicks || {}).reduce((a, b) => a + b, 0)
              };
            })
        );

        // Calculate conversion rate (contacts / views)
        const conversionRate = totalViews > 0 
          ? (totalContacts / totalViews) * 100 
          : 0;

        setStats({
          ...stats,
          totalUsers,
          activeUsers: totalUsers, // This should be refined with actual active users logic
          totalBusinesses,
          activeBusinesses,
          pageViews: totalViews,
          contactClicks: totalContacts,
          socialClicks,
          popularHours,
          topBusinesses,
          conversionRate
        });

      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Analíticas</h2>
        
        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {format(dateRange.from, "d MMM", { locale: es })} -{' '}
                  {format(dateRange.to, "d MMM", { locale: es })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{
                  from: dateRange.from,
                  to: dateRange.to
                }}
                onSelect={(range) => range && setDateRange(range)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Users}
          label="Usuarios totales"
          value={stats.totalUsers}
        />
        <StatsCard
          icon={Store}
          label="Comercios activos"
          value={stats.activeBusinesses}
        />
        <StatsCard
          icon={Eye}
          label="Vistas totales"
          value={stats.pageViews}
        />
        <StatsCard
          icon={Phone}
          label="Contactos"
          value={stats.contactClicks}
          percentage={stats.conversionRate}
          trend={stats.conversionRate > 2 ? 'up' : 'down'}
        />
      </div>

      {/* Engagement Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Social Engagement */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Engagement en Redes Sociales
          </h3>
          <div className="space-y-4">
            <EngagementBar
              key="instagram"
              label="Instagram"
              value={stats.socialClicks.instagram}
              color="bg-[#E4405F]"
              icon={Share2}
            />
            <EngagementBar
              key="facebook"
              label="Facebook"
              value={stats.socialClicks.facebook}
              color="bg-[#1877F2]"
              icon={Share2}
            />
            <EngagementBar
              key="whatsapp"
              label="WhatsApp"
              value={stats.socialClicks.whatsapp}
              color="bg-[#25D366]"
              icon={MessageCircle}
            />
            <EngagementBar
              key="website"
              label="Sitio Web"
              value={stats.socialClicks.website}
              color="bg-gray-600"
              icon={Share2}
            />
          </div>
        </div>

        {/* Popular Hours */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Horas más activas
          </h3>
          <div className="space-y-4">
            {stats.popularHours.map(({ hour, count }, index) => (
              <div key={`hour-${hour}`} className="flex items-center gap-4">
                <div className="w-16 text-sm text-gray-600">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ 
                      width: `${(count / Math.max(...stats.popularHours.map(h => h.count))) * 100}%` 
                    }}
                  />
                </div>
                <div className="w-16 text-sm text-gray-600 text-right">
                  {count} visitas
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Businesses */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Comercios más activos
        </h3>
        <div className="space-y-6">
          {stats.topBusinesses.map((business, index) => (
            <div key={business.id} className="flex items-center gap-4">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <span className="font-medium text-primary">
                  #{index + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">
                  {business.name}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{business.views} vistas</span>
                  <span>{business.contacts} contactos</span>
                  <span>{business.socialEngagement} interacciones</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  percentage, 
  trend 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  percentage?: number;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {percentage !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm",
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            )}>
              {trend === 'up' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              <span>{percentage.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EngagementBar({ 
  label, 
  value, 
  color, 
  icon: Icon 
}: { 
  label: string; 
  value: number; 
  color: string;
  icon: any;
}) {
  const maxValue = 100; // You can adjust this based on your needs
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", color.replace('bg-', 'text-'))} />
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}