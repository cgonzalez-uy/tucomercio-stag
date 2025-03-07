import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { isSuperAdmin } from '../lib/auth';
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
  Bus,
  Landmark,
  Calendar,
  Crown,
  CreditCard,
  Truck,
  Tags,
  Users,
  ChevronDown,
  ChevronUp,
  BarChart,
  Image,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { NotificationBell } from './business/NotificationBell';

const sidebarSections = [
  {
    title: 'Principal',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin' },
      { icon: BarChart, label: 'Analíticas', path: '/superadmin/analytics' },
      { icon: Store, label: 'Comercios', path: '/superadmin/businesses' },
      { icon: Users, label: 'Solicitudes', path: '/superadmin/requests' },
      { icon: Star, label: 'Reseñas', path: '/superadmin/reviews' },
      { icon: MessageCircle, label: 'Mensajes', path: '/superadmin/messages' },
      { icon: Crown, label: 'Vencimientos', path: '/superadmin/plan-expirations' },
      { icon: Landmark, label: 'Puntos de Interés', path: '/superadmin/points-of-interest' },
      { icon: Calendar, label: 'Eventos', path: '/superadmin/events' }
    ]
  },
  {
    title: 'Transporte',
    items: [
      { icon: Bus, label: 'Líneas', path: '/superadmin/bus/lines' },
      { icon: Bus, label: 'Tipos de Línea', path: '/superadmin/bus/types' },
      { icon: Bus, label: 'Destinos', path: '/superadmin/bus/destinations' },
      { icon: Bus, label: 'Recorridos', path: '/superadmin/bus/routes' },
      { icon: Bus, label: 'Horarios', path: '/superadmin/bus/schedules' }
    ]
  },
  {
    title: 'Contenido',
    items: [
      { icon: Image, label: 'Banners', path: '/superadmin/banners' },
      { icon: Sparkles, label: 'Campañas', path: '/superadmin/campaigns' }
    ]
  },
  {
    title: 'Configuración',
    items: [
      { icon: CreditCard, label: 'Métodos de Pago', path: '/superadmin/payment-methods' },
      { icon: Truck, label: 'Métodos de Envío', path: '/superadmin/shipping-methods' },
      { icon: Tags, label: 'Categorías', path: '/superadmin/categories' },
      { icon: Crown, label: 'Planes', path: '/superadmin/plans' },
      { icon: CreditCard, label: 'Cuentas Bancarias', path: '/superadmin/payment-accounts' }
    ]
  },
  {
    title: 'Sistema',
    items: [
      { icon: Settings, label: 'Configuración', path: '/superadmin/settings' },
    ]
  }
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['Principal']);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileView(isMobile);
      if (!isMobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user || !isSuperAdmin(user)) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobileView) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobileView]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileView) {
      document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, isMobileView]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  if (loading || !user || !isSuperAdmin(user)) {
    return null;
  }

  // Get current page title
  const currentPage = sidebarSections
    .flatMap(section => section.items)
    .find(item => item.path === location.pathname);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transition-transform duration-300 lg:translate-x-0 lg:static",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-16 p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Panel de Control</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          {sidebarSections.map((section, index) => (
            <div key={section.title} className={cn("space-y-1", index > 0 && "mt-6")}>
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-900"
              >
                <span>{section.title}</span>
                {expandedSections.includes(section.title) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              <div className={cn(
                "space-y-1 overflow-hidden transition-all duration-200",
                expandedSections.includes(section.title) ? "max-h-96" : "max-h-0"
              )}>
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location.pathname === item.path
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{user.email}</span>
            <button
              onClick={() => auth.signOut()}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && isMobileView && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-bold text-gray-900">Panel de Control</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell businessId={null} />
              <button
                onClick={() => auth.signOut()}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden lg:block bg-white border-b sticky top-0 z-40">
          <div className="flex items-center justify-end px-4 h-16">
            <div className="flex items-center gap-4">
              <NotificationBell businessId={null} />
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-sm">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => auth.signOut()}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}