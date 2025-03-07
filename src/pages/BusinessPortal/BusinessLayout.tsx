import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useBusinesses } from '../../lib/hooks/useBusinesses';
import { usePlans } from '../../lib/hooks/usePlans';
import { 
  Store, 
  LogOut, 
  Settings,
  LayoutDashboard,
  Menu,
  X,
  Star,
  MessageCircle,
  ChevronRight,
  Percent,
  Ticket,
  HeadphonesIcon,
  Bell,
  Image,
  Calendar,
  User,
  Crown,
  Lock,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { NotificationBell } from '../../components/business/NotificationBell';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/portal/dashboard', restrictedInFree: true },
  { icon: Store, label: 'Mi Comercio', path: '/portal/profile', restrictedInFree: true },
  { icon: Image, label: 'Galería', path: '/portal/gallery', premium: true, restrictedInFree: true },
  { icon: Star, label: 'Reseñas', path: '/portal/reviews' },
  { icon: Percent, label: 'Promociones', path: '/portal/promotions', premium: true, restrictedInFree: true },
  { icon: Ticket, label: 'Cupones', path: '/portal/coupons', premium: true, restrictedInFree: true },
  { icon: Calendar, label: 'Eventos', path: '/portal/events' },
  { icon: HeadphonesIcon, label: 'Soporte Técnico', path: '/portal/support' },
  { icon: Bell, label: 'Notificaciones', path: '/portal/notifications', restrictedInFree: true },
  { icon: Settings, label: 'Configuración', path: '/portal/settings' }
];

interface BusinessLayoutProps {
  children: React.ReactNode;
}

export function BusinessLayout({ children }: BusinessLayoutProps) {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const { businesses } = useBusinesses();
  const { plans } = usePlans();
  const [planName, setPlanName] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/portal/login');
      return;
    }

    // Get businessId from user claims
    const getBusinessId = async () => {
      try {
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.businessId) {
          const businessId = idTokenResult.claims.businessId;
          setBusinessId(businessId);

          // Get business plan
          const business = businesses.find(b => b.id === businessId);
          if (business) {
            const plan = plans.find(p => p.id === business.planId);
            setPlanName(plan?.name || 'Gratis');
          }
        } else {
          navigate('/portal/login');
        }
      } catch (err) {
        console.error('Error getting business ID:', err);
        navigate('/portal/login');
      }
    };

    getBusinessId();
  }, [user, navigate, businesses, plans]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (!user || !businessId) {
    return null;
  }

  // Get current page title
  const currentPage = menuItems.find(item => item.path === location.pathname);

  // Check if menu item is restricted
  const isItemRestricted = (item: typeof menuItems[0]) => {
    if (planName === 'Gratis' && item.restrictedInFree) {
      return true;
    }
    if (planName === 'Básico' && item.premium) {
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r lg:static lg:block",
        isSidebarOpen ? "block" : "hidden"
      )}>
        {/* Logo */}
        <div className="h-16 p-4 border-b flex items-center">
          <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80">
            <Store className="h-6 w-6" />
            <span className="font-semibold">TuComercio.uy</span>
          </Link>
        </div>

        {/* Plan Info */}
        <div className="px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {planName !== 'Gratis' && planName !== 'Básico' ? (
                <Crown className="h-4 w-4 text-yellow-500" />
              ) : (
                <Crown className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-900">
                {planName}
              </span>
            </div>
            {(planName === 'Gratis' || planName === 'Básico') && (
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/portal/settings')}
                className="text-xs text-primary hover:text-primary/80"
              >
                Actualizar
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Close button (mobile only) */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          {/* Main Menu Items */}
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isRestricted = isItemRestricted(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    "hover:bg-gray-100 active:bg-gray-200",
                    location.pathname === item.path
                      ? "bg-primary text-white hover:bg-primary/90 active:bg-primary/80"
                      : "text-gray-700",
                    isRestricted && "opacity-50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {isRestricted ? (
                    <Lock className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <ChevronRight className={cn(
                      "h-4 w-4 opacity-0 -translate-x-2 transition-all",
                      location.pathname === item.path && "opacity-100 translate-x-0"
                    )} />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200" />

          {/* User Portal Link */}
          <Link
            to="/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
              "text-primary hover:bg-primary/5 transition-colors",
              "border border-primary/20"
            )}
          >
            <User className="h-5 w-5" />
            <span className="flex-1">Gestionar Usuario</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </nav>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 h-16">
            {/* Left section */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {currentPage?.label || 'Panel de Control'}
                </h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Gestiona tu comercio desde un solo lugar
                </p>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4">
              {planName !== 'Gratis' && <NotificationBell businessId={businessId} />}
              <Button
                variant="outline"
                size="sm"
                onClick={() => auth.signOut()}
                className="hidden sm:flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => auth.signOut()}
                className="sm:hidden"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}