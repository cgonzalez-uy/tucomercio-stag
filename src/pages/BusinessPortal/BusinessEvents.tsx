import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useEvents } from '../../lib/hooks/useEvents';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Calendar, MapPin, Clock, Users, ChevronLeft, ChevronRight, Search, Filter, AlertCircle } from 'lucide-react';
import { EVENT_CATEGORIES } from '../../types/event';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';

const ITEMS_PER_PAGE = 10;

export function BusinessEvents() {
  const [user] = useAuthState(auth);
  const { events, loading, error, updateEvent } = useEvents();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Get businessId from user claims
  useEffect(() => {
    const getBusinessId = async () => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          if (idTokenResult.claims.businessId) {
            setBusinessId(idTokenResult.claims.businessId as string);
          }
        } catch (err) {
          console.error('Error getting business ID:', err);
          setOperationError('Error al obtener la información del comercio');
        }
      }
    };

    getBusinessId();
  }, [user]);

  // Filter active events based on search and filters
  const filteredEvents = events
    .filter(event => {
      if (!event.isActive) return false;

      // Search filter
      const searchMatch = !searchTerm || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const categoryMatch = selectedCategories.length === 0 ||
        selectedCategories.includes(event.category);

      return searchMatch && categoryMatch;
    })
    .sort((a, b) => a.startDate.seconds - b.startDate.seconds);

  // Calculate pagination
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleParticipation = async (eventId: string) => {
    if (!user || !businessId) return;

    try {
      setOperationError(null);
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const isParticipating = event.participatingBusinesses?.includes(businessId);
      const updatedBusinesses = isParticipating
        ? event.participatingBusinesses?.filter(id => id !== businessId)
        : [...(event.participatingBusinesses || []), businessId];

      await updateEvent(eventId, {
        participatingBusinesses: updatedBusinesses
      });
    } catch (err) {
      console.error('Error updating event participation:', err);
      setOperationError('Error al actualizar la participación. Por favor, intenta nuevamente.');
    }
  };

  if (loading) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Eventos de la Ciudad</h1>
        <div className="w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:w-auto"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-900 mb-3">Categorías</h3>
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
                    }}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Operation Error */}
      {operationError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{operationError}</p>
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || selectedCategories.length > 0
              ? 'No se encontraron eventos que coincidan con tu búsqueda'
              : 'No hay eventos disponibles'
            }
          </h2>
          <p className="text-gray-600">
            {searchTerm || selectedCategories.length > 0
              ? 'Intenta con otros términos de búsqueda o filtros'
              : 'Vuelve más tarde para ver los próximos eventos'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {paginatedEvents.map((event) => {
              const isParticipating = event.participatingBusinesses?.includes(businessId || '');

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Event Image */}
                    {event.image && (
                      <div className="sm:w-48 h-48 shrink-0">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover rounded-t-xl sm:rounded-l-xl sm:rounded-t-none"
                        />
                      </div>
                    )}

                    {/* Event Info */}
                    <div className="p-6 flex-1">
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {event.shortDescription}
                      </p>

                      {/* Event Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(event.startDate.seconds * 1000), "d 'de' MMMM", { locale: es })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(event.startDate.seconds * 1000), "HH:mm")}
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
                              {event.participatingBusinesses?.length || 0} / {event.capacity} comercios
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Organiza: {event.organizer}
                        </p>

                        <Button
                          onClick={() => handleParticipation(event.id)}
                          variant={isParticipating ? 'outline' : 'default'}
                          size="sm"
                          disabled={!businessId}
                        >
                          {isParticipating ? 'No participaré' : 'Participaré'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}