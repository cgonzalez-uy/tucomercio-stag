import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useEvents } from '../lib/hooks/useEvents';
import { useBusinesses } from '../lib/hooks/useBusinesses';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Calendar, CalendarDays, Clock, MapPin, Users, ArrowLeft, Share2, AlertCircle, Facebook, Twitter, MessageCircle as WhatsApp, Link as LinkIcon, Store, ChevronRight, Search, ChevronLeft } from 'lucide-react';
import { EVENT_CATEGORIES } from '../types/event';
import { UserAuthModal } from '../components/auth/UserAuthModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';

export function EventDetailsPage() {
  const { id } = useParams();
  const [user] = useAuthState(auth);
  const { events, loading, error, registerForEvent, unregisterFromEvent } = useEvents();
  const { businesses } = useBusinesses();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participantSearchTerm, setParticipantSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const event = events.find(e => e.id === id);
  const isRegistered = user && event?.registeredUsers?.includes(user.uid);
  const isFull = event?.capacity && event.registeredUsers?.length === event.capacity;

  // Get participating businesses
  const participatingBusinesses = event?.participatingBusinesses
    ? businesses
        .filter(b => event.participatingBusinesses?.includes(b.id))
        // Filter by search term
        .filter(b => {
          if (!participantSearchTerm) return true;
          const searchTermLower = participantSearchTerm.toLowerCase();
          return (
            b.name.toLowerCase().includes(searchTermLower) ||
            b.address.toLowerCase().includes(searchTermLower) ||
            b.categories.some(cat => cat.toLowerCase().includes(searchTermLower))
          );
        })
    : [];

  // Calculate pagination
  const totalPages = Math.ceil(participatingBusinesses.length / ITEMS_PER_PAGE);
  const paginatedParticipants = participatingBusinesses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleRegister = async () => {
    if (!user || !event) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (isRegistered) {
        await unregisterFromEvent(event.id, user.uid);
      } else {
        await registerForEvent(event.id, user.uid);
      }
    } catch (err) {
      console.error('Error registering for event:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
      setShowSharePopover(false);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const handleShare = async (platform: string) => {
    if (!event) return;

    const url = window.location.href;
    const text = `${event.title}\n${event.shortDescription}`;

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
        break;
      case 'native':
        try {
          await navigator.share({
            title: event.title,
            text: event.shortDescription,
            url: url
          });
          setShowSharePopover(false);
          return;
        } catch (err) {
          // If native sharing fails, fall back to copying the link
          if (err instanceof Error && err.name === 'NotSupportedError') {
            handleCopyLink();
          }
          return;
        }
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      setShowSharePopover(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            {error || 'Evento no encontrado'}
          </h2>
          <Button asChild>
            <Link to="/events">Volver a eventos</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative w-full h-[300px] bg-gray-100">
        {event.image ? (
          <img 
            src={event.image} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="h-24 w-24 text-gray-300" />
          </div>
        )}
        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Link to="/events">
            <Button variant="outline" className="bg-white/90 backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-6 -mt-20 relative z-10">
          {/* Category and Actions */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
              {EVENT_CATEGORIES[event.category as keyof typeof EVENT_CATEGORIES]}
            </span>

            <div className="flex items-center gap-2">
              <Popover open={showSharePopover} onOpenChange={setShowSharePopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  <div className="space-y-2">
                    {/* Native Share - only shown if supported */}
                    {navigator.share && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleShare('native')}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartir
                      </Button>
                    )}

                    {/* Social Media Buttons */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-[#1877F2] hover:text-[#1877F2] hover:bg-[#1877F2]/10"
                      onClick={() => handleShare('facebook')}
                    >
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-[#1DA1F2] hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10"
                      onClick={() => handleShare('twitter')}
                    >
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10"
                      onClick={() => handleShare('whatsapp')}
                    >
                      <WhatsApp className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>

                    {/* Copy Link Button */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start relative"
                      onClick={handleCopyLink}
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Copiar enlace
                      {showShareTooltip && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          ¡Enlace copiado!
                        </span>
                      )}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {event.registrationRequired && (
                <Button
                  onClick={handleRegister}
                  disabled={isFull && !isRegistered}
                  variant={isRegistered ? 'outline' : 'default'}
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

          {/* Title and Description */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {event.title}
          </h1>
          <p className="text-gray-600 mb-8 whitespace-pre-line">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Fecha</p>
                  <p className="text-gray-600">
                    {format(new Date(event.startDate.seconds * 1000), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Hora</p>
                  <p className="text-gray-600">
                    {format(new Date(event.startDate.seconds * 1000), "HH:mm", { locale: es })} hs
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Ubicación</p>
                  <p className="text-gray-600">{event.location}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Organizador</p>
                  <p className="text-gray-600">{event.organizer}</p>
                </div>
              </div>

              {event.capacity && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Capacidad</p>
                    <p className="text-gray-600">
                      {event.registeredUsers?.length || 0} / {event.capacity} asistentes
                    </p>
                  </div>
                </div>
              )}

              {event.price > 0 && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Precio</p>
                    <p className="text-gray-600">${event.price}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Participating Businesses */}
          {event?.participatingBusinesses?.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium text-gray-900">
                    ¿Quiénes Participan? ({event.participatingBusinesses.length})
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowParticipants(!showParticipants)}
                >
                  {showParticipants ? 'Ocultar' : 'Ver todos'}
                </Button>
              </div>

              {/* Search box - only show when viewing all participants */}
              {showParticipants && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, dirección o categoría..."
                    value={participantSearchTerm}
                    onChange={(e) => {
                      setParticipantSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page when searching
                    }}
                    className="pl-10"
                  />
                </div>
              )}

              <div className={cn(
                "grid gap-4",
                showParticipants ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              )}>
                {paginatedParticipants.length === 0 && participantSearchTerm ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No se encontraron participantes que coincidan con tu búsqueda
                  </div>
                ) : (
                  paginatedParticipants.map(business => (
                    <Link
                      key={business.id}
                      to={`/comercios/${business.id}`}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {business.image ? (
                        <img
                          src={business.image}
                          alt={business.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Store className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {business.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="truncate">{business.address}</span>
                          <span className="shrink-0">•</span>
                          <span className="truncate">{business.categories.join(', ')}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </Link>
                  ))
                )}
              </div>

              {/* Pagination - only show when viewing all participants */}
              {showParticipants && totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
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

              {!showParticipants && participatingBusinesses.length > 4 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="link"
                    onClick={() => setShowParticipants(true)}
                    className="text-primary"
                  >
                    Ver todos los participantes
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <UserAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}