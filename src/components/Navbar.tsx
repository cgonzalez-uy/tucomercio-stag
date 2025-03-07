import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Store, Menu, X, Calendar, Bus, Landmark, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { UserMenu } from './UserMenu';
import { cn } from '../lib/utils';

const MENU_ITEMS = [
  { 
    path: '/', 
    label: 'Inicio',
    description: 'Volver a la página principal'
  },
  { 
    path: '/help', 
    label: 'Ayuda',
    description: 'Centro de ayuda y soporte'
  },
  { 
    path: '/events', 
    label: 'Eventos',
    description: 'Descubre eventos en tu ciudad',
    icon: Calendar,
    style: 'bg-[#ffe76f]/10 text-[#b3a14d] hover:bg-[#ffe76f]/20'
  },
  { 
    path: '/schedules', 
    label: 'Horarios de ómnibus',
    description: 'Consulta los horarios de transporte',
    icon: Bus,
    style: 'bg-[#d103d1]/10 text-[#d103d1] hover:bg-[#d103d1]/20'
  },
  {
    path: '/points-of-interest',
    label: 'Puntos de Interés',
    description: 'Encuentra servicios importantes en tu ciudad',
    icon: Landmark,
    style: 'bg-[#3cbed0]/10 text-[#3cbed0] hover:bg-[#3cbed0]/20'
  }
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Main Header */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 w-full transition-all duration-200 z-50",
          isScrolled 
            ? "bg-white/95 backdrop-blur-sm shadow-sm" 
            : "bg-white",
          "border-b border-gray-200"
        )}
      >
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
            >
              <Store className="h-6 w-6" />
              <span className="font-semibold">TuComercio.uy</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {/* Regular menu items */}
              <div className="flex items-center gap-4">
                {MENU_ITEMS.map(item => (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    className={cn(
                      "px-3 py-2 rounded-lg transition-all duration-200",
                      "text-sm font-medium",
                      item.style || (
                        location.pathname === item.path
                          ? "text-primary bg-primary/5"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Register Business Button */}
              <Button asChild className="bg-primary text-white">
                <Link to="/register">
                  Registrar comercio
                </Link>
              </Button>

              {/* User Menu */}
              <UserMenu />
            </nav>

            {/* Mobile Menu Controls */}
            <div className="flex items-center gap-3 lg:hidden">
              <UserMenu />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative z-50"
                aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-white" style={{ top: '64px' }}>
          <nav className="container mx-auto px-4 py-6">
            {/* Menu Items */}
            <div className="space-y-3">
              {MENU_ITEMS.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
                    item.style || (
                      location.pathname === item.path
                        ? "bg-primary/5"
                        : "hover:bg-gray-50"
                    )
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    item.style ? item.style : "bg-primary/10"
                  )}>
                    {item.icon ? (
                      <item.icon className="h-5 w-5" />
                    ) : (
                      <Store className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.label}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-500">{item.description}</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
              ))}
            </div>

            {/* Register Business Button */}
            <div className="mt-6">
              <Button asChild className="w-full bg-primary text-white">
                <Link to="/register" className="flex items-center justify-center gap-2">
                  <Store className="h-5 w-5" />
                  Registrar comercio
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}