import { useState } from 'react';
import { Search, MapPin, Filter, Store, ChevronDown, X, ArrowRight, CreditCard, Truck, Clock, Star, Heart, ChevronLeft, Crown } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { BusinessList } from '../components/BusinessList';
import { useSettings } from '../lib/hooks/useSettings';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { UserAuthModal } from '../components/auth/UserAuthModal';
import { cn } from '../lib/utils';
// Import Swiper React components
import { Swiper, SwiperSlide, useSwiper } from 'swiper/react';
import { Navigation } from 'swiper/modules';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import { HeroBannerCarousel } from '../components/HeroBannerCarousel';
import { useBanners } from '../lib/hooks/useBanners';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';

// Atajos rápidos predefinidos
const QUICK_FILTERS = [
  {
    icon: CreditCard,
    label: 'Acepta tarjetas',
    filter: { type: 'payment', value: 'Tarjeta de crédito' }
  },
  {
    icon: Truck,
    label: 'Hace envíos',
    filter: { type: 'shipping', value: 'Delivery' }
  },
  {
    icon: Clock,
    label: 'Abierto ahora',
    filter: { type: 'status', value: 'open' }
  },
  {
    icon: Star,
    label: 'Mejor valorados',
    filter: { type: 'rating', value: 'top' }
  },
  {
    icon: Heart,
    label: 'Más populares',
    filter: { type: 'popularity', value: 'popular' }
  },
  {
    icon: Crown,
    label: 'Destacados',
    filter: { type: 'plan', value: 'premium' }
  }
];

// Componente de botones de navegación
function SwiperNavButtons() {
  const swiper = useSwiper();
  return (
    <div className="flex items-center justify-between absolute -left-4 -right-4 top-1/2 -translate-y-1/2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => swiper.slidePrev()}
        className="bg-white shadow-sm hover:bg-gray-50 z-10"
        disabled={swiper.isBeginning}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => swiper.slideNext()}
        className="bg-white shadow-sm hover:bg-gray-50 z-10"
        disabled={swiper.isEnd}
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { settings: categories } = useSettings('categories');
  const { settings: siteSettings } = useSettings('site-settings');
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set());
  const { getActiveBanners } = useBanners();
  const activeBanners = getActiveBanners();
  const activeCategories = categories.filter(cat => cat.isActive);
  const heroTitle = siteSettings.find(s => s.key === 'hero-title')?.value || 'Conecta con los mejores comercios de Tu Ciudad';
  const heroSubtitle = siteSettings.find(s => s.key === 'hero-subtitle')?.value || 'Descubre y apoya los comercios locales. Todo lo que necesitas, cerca de ti.';

  // Limpiar todos los filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLocation('');
    setSelectedCategories([]);
    setActiveQuickFilters(new Set());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-white border-b pt-14">
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-7xl">
          {/* Carrusel de banners o Hero title/subtitle */}
          <HeroBannerCarousel />
          
          {/* Si no hay banners activos, mostrar el hero title/subtitle */}
          {!activeBanners || activeBanners.length === 0 ? (
            <div className="py-12 md:py-20">
              <h1 className="text-3xl md:text-5xl font-bold text-center text-gray-900 mb-4 tracking-tight">
                {heroTitle}
              </h1>
              <p className="text-lg md:text-xl text-center text-gray-600 mb-8 max-w-2xl mx-auto">
                {heroSubtitle}
              </p>
            </div>
          ) : null}
          
          {/* Búsqueda y Filtros */}
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Barra de búsqueda principal */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="¿Qué estás buscando?"
                  className="pl-10 h-12 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Category Filter Button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 shrink-0"
                  >
                    <Filter className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[300px] p-0 sm:w-[300px] w-screen" 
                  align="end"
                  sideOffset={8}
                >
                  <div className="bg-gray-900 text-white">
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Categorías</h3>
                        {selectedCategories.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCategories([])}
                            className="text-sm text-gray-300 hover:text-white hover:bg-gray-800"
                          >
                            Limpiar ({selectedCategories.length})
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="py-1 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                      {activeCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            const isSelected = selectedCategories.includes(category.name);
                            setSelectedCategories(
                              isSelected
                                ? selectedCategories.filter(c => c !== category.name)
                                : [...selectedCategories, category.name]
                            );
                          }}
                          className={cn(
                            "flex items-center gap-3 w-full px-4 py-4 text-left transition-colors",
                            selectedCategories.includes(category.name)
                              ? "bg-primary text-white"
                              : "text-gray-100 hover:bg-gray-800"
                          )}
                        >
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium">{category.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Atajos rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => {
                    setActiveQuickFilters(prev => {
                      const newFilters = new Set(prev);
                      if (newFilters.has(filter.filter.value)) {
                        newFilters.delete(filter.filter.value);
                      } else {
                        newFilters.add(filter.filter.value);
                      }
                      return newFilters;
                    });
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                    "text-sm font-medium",
                    activeQuickFilters.has(filter.filter.value)
                      ? "bg-primary text-white shadow-sm"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  <filter.icon className="h-5 w-5" />
                  <span className="text-xs">{filter.label}</span>
                </button>
              ))}
            </div>

            {/* Carrusel de categorías con navegación */}
            <div className="relative bg-white rounded-xl shadow-md p-4">
              <div className="relative px-8">
                <Swiper
                  modules={[Navigation]}
                  slidesPerView="auto"
                  spaceBetween={8}
                  className="!static"
                  breakpoints={{
                    320: { slidesPerView: 'auto' },
                    640: { slidesPerView: 'auto' },
                    768: { slidesPerView: 'auto' },
                  }}
                >
                  <SwiperNavButtons />
                  {activeCategories.map((category) => (
                    <SwiperSlide 
                      key={category.id} 
                      className="!w-auto"
                    >
                      <button
                        onClick={() => {
                          const isSelected = selectedCategories.includes(category.name);
                          setSelectedCategories(
                            isSelected
                              ? selectedCategories.filter(c => c !== category.name)
                              : [...selectedCategories, category.name]
                          );
                        }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                          "border text-sm font-medium whitespace-nowrap",
                          selectedCategories.includes(category.name)
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        )}
                        style={{
                          borderColor: selectedCategories.includes(category.name) ? category.color : undefined,
                          backgroundColor: selectedCategories.includes(category.name) ? `${category.color}15` : undefined,
                          color: selectedCategories.includes(category.name) ? category.color : undefined
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </button>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>

            {/* Filtros activos */}
            {(selectedCategories.length > 0 || selectedLocation || searchTerm || activeQuickFilters.size > 0) && (
              <div className="flex flex-wrap gap-2 py-2">
                {selectedCategories.map(category => (
                  <div
                    key={category}
                    className="flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary rounded-full text-sm"
                  >
                    <span>{category}</span>
                    <button
                      onClick={() => setSelectedCategories(
                        selectedCategories.filter(c => c !== category)
                      )}
                      className="hover:text-primary/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {selectedLocation && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary rounded-full text-sm">
                    <MapPin className="h-3 w-3" />
                    <span>{selectedLocation}</span>
                    <button
                      onClick={() => setSelectedLocation('')}
                      className="hover:text-primary/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {searchTerm && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary rounded-full text-sm">
                    <Search className="h-3 w-3" />
                    <span>{searchTerm}</span>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="hover:text-primary/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {Array.from(activeQuickFilters).map(filter => {
                  const filterConfig = QUICK_FILTERS.find(f => f.filter.value === filter);
                  if (!filterConfig) return null;
                  return (
                    <div
                      key={filter}
                      className="flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary rounded-full text-sm"
                    >
                      <filterConfig.icon className="h-3 w-3" />
                      <span>{filterConfig.label}</span>
                      <button
                        onClick={() => setActiveQuickFilters(prev => {
                          const newFilters = new Set(prev);
                          newFilters.delete(filter);
                          return newFilters;
                        })}
                        className="hover:text-primary/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Lista de Comercios */}
      <section className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <BusinessList
          searchTerm={searchTerm}
          location={selectedLocation}
          categories={selectedCategories}
          quickFilters={Array.from(activeQuickFilters)}
        />
      </section>

      <Footer />

      {/* Auth Modal */}
      <UserAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

export { HomePage }