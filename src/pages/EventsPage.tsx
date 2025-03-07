import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useEvents } from '../lib/hooks/useEvents';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Calendar, ArrowRight, MapPin, Clock, Search, Filter, Users, ChevronDown } from 'lucide-react';
import { EVENT_CATEGORIES } from '../types/event';
import { cn } from '../lib/utils';
import { UserAuthModal } from '../components/auth/UserAuthModal';
import { Navbar } from '../components/Navbar';
const ITEMS_PER_PAGE = 6; // Show 6 events initially (2x3 or 3x2 grid)

export function EventsPage() {
  const [user] = useAuthState(auth);
  const { events, loading, error, registerForEvent, unregisterFromEvent } = useEvents();
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Get active events and apply filters
  const filteredEvents = events
    .filter(event => {
      if (!event.isActive) return false;

      // Search filter
      const searchMatch = !searchTerm || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());

      // Location filter
      const locationMatch = !selectedLocation ||
        event.location.toLowerCase().includes(selectedLocation.toLowerCase());

      // Category filter
      const categoryMatch = selectedCategories.length === 0 ||
        selectedCategories.includes(event.category);

      return searchMatch && locationMatch && categoryMatch;
    })
    .sort((a, b) => a.startDate.seconds - b.startDate.seconds);

  // Get events to display based on current display count
  const displayedEvents = filteredEvents.slice(0, displayCount);
  const hasMore = displayCount < filteredEvents.length;

  const loadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  const handleRegister = async (eventId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const isRegistered = event.registeredUsers?.includes(user.uid);
      
      if (isRegistered) {
        await unregisterFromEvent(eventId, user.uid);
      } else {
        await registerForEvent(eventId, user.uid);
      }
    } catch (err) {
      console.error('Error registering for event:', err);
    }
  };

  // Reset display count when filters change
  const handleFilterChange = () => {
    setDisplayCount(ITEMS_PER_PAGE);
  };

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
      <Navbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#3cbed0] to-[#2193a3] text-white pt-16">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
            <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-full">
                <Calendar className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Eventos en Tu Ciudad
            </h1>
            <p className="text-lg text-white/90 md:text-xl">
              Descubre los mejores eventos culturales, deportivos y sociales cerca de ti
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar eventos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleFilterChange();
                }}
              />
            </div>
            <div className="relative">
              <Input
                type="text"
                placeholder="¿En qué zona?"
                className="pl-10 md:w-[200px]"
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  handleFilterChange();
                }}
              />
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2 md:w-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
          </div>

          {/* Category Filters */}
          {showFilters && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Categorías</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(EVENT_CATEGORIES).map(([value, label]) => (
                  <label
                    key={value}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedCategories.includes(value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, value]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== value));
                        }
                        handleFilterChange();
                      }}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {searchTerm || selectedLocation || selectedCategories.length > 0
                ? 'No se encontraron eventos que coincidan con tu búsqueda'
                : 'No hay eventos próximos'
              }
            </h2>
            <p className="text-gray-600">
              {searchTerm || selectedLocation || selectedCategories.length > 0
                ? 'Intenta ajustando los filtros de búsqueda'
                : 'Vuelve pronto para ver los nuevos eventos'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedEvents.map((event) => {
                const isRegistered = user && event.registeredUsers?.includes(user.uid);
                const isFull = event.capacity && event.registeredUsers?.length === event.capacity;

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 flex flex-col"
                  >
                    {/* Event Image */}
                    {event.image && (
                      <div className="h-48">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover rounded-t-xl"
                        />
                      </div>
                    )}

                    {/* Event Info */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Category and Price Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {EVENT_CATEGORIES[event.category as keyof typeof EVENT_CATEGORIES]}
                        </span>
                        {event.price === 0 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Gratis
                          </span>
                        )}
                      </div>

                      {/* Title and Description */}
                      <Link to={`/events/${event.id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                      </Link>
                      <p className="text-gray-600 text-sm mb-4">
                        {event.shortDescription}
                      </p>

                      {/* Event Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(event.startDate.seconds * 1000).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(event.startDate.seconds * 1000).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>

                        {event.capacity && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {event.registeredUsers?.length || 0} / {event.capacity}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-auto">
                        <Link
                          to={`/events/${event.id}`}
                          className="text-primary font-medium flex items-center gap-1 hover:underline"
                        >
                          Ver más <ArrowRight className="h-4 w-4" />
                        </Link>

                        {event.registrationRequired && (
                          <Button
                            onClick={(e) => handleRegister(event.id, e)}
                            disabled={isFull && !isRegistered}
                            variant={isRegistered ? 'outline' : 'default'}
                            size="sm"
                          >
                            {isFull && !isRegistered ? (
                              'Cupos agotados'
                            ) : isRegistered ? (
                              'No asistiré'
                            ) : (
                              'Asistiré'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={loadMore}
                  className="group"
                >
                  <ChevronDown className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                  Mostrar más eventos
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <UserAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}