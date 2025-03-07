import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useEvents } from '../lib/hooks/useEvents';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Clock, MapPin, Users } from 'lucide-react';
import { EVENT_CATEGORIES } from '../types/event';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function UserEventsPage() {
  const [user] = useAuthState(auth);
  const { events, loading, error, unregisterFromEvent } = useEvents();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Get events the user is registered for
  const registeredEvents = events.filter(event => 
    event.registeredUsers?.includes(user?.uid || '')
  ).sort((a, b) => a.startDate.seconds - b.startDate.seconds);

  // Calculate pagination
  const totalPages = Math.ceil(registeredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = registeredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleUnregister = async (eventId: string) => {
    if (!user) return;

    try {
      await unregisterFromEvent(eventId, user.uid);
    } catch (err) {
      console.error('Error unregistering from event:', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Inicia sesión para ver tus eventos
          </h2>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/profile"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a mi perfil</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Mis Eventos
        </h1>

        {registeredEvents.length === 0 ? (
          <div className="text-center max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No estás registrado en ningún evento
            </h2>
            <p className="text-gray-600 mb-6">
              Explora los eventos disponibles y regístrate en los que te interesen
            </p>
            <Button asChild>
              <Link to="/events">Ver eventos</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedEvents.map((event) => (
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
                    {/* Category Badge */}
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
                            {event.registeredUsers?.length || 0} / {event.capacity}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/events/${event.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        Ver detalles
                      </Link>

                      <Button
                        onClick={() => handleUnregister(event.id)}
                        variant="outline"
                        size="sm"
                      >
                        No asistiré
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}