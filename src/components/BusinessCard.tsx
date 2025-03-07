import { Link } from 'react-router-dom';
import { Store, MapPin, Globe, Instagram, Facebook, MessageCircle, Truck, ChevronRight, Phone, Heart, BadgeCheck, Star } from 'lucide-react';
import { formatWhatsAppNumber, getBusinessStatus } from '../lib/utils';
import { useBusinessMetrics } from '../lib/hooks/useBusinessMetrics';
import { useBusinessReviews } from '../lib/hooks/useBusinessReviews';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useFavorites } from '../lib/hooks/useFavorites';
import { usePlans } from '../lib/hooks/usePlans';
import { UserAuthModal } from './auth/UserAuthModal';
import { useState, useEffect } from 'react';
import type { BusinessSchedule } from '../types/business';
import { DEFAULT_SCHEDULE } from '../types/business';
import { trackBusinessInteraction, trackSocialInteraction } from '../lib/analytics';

interface BusinessCardProps {
  id: string;
  name: string;
  shortDescription: string;
  categories: Array<{
    name: string;
    color: string;
  }>;
  address: string;
  phone: string;
  image?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  shippingMethods: string[];
  schedule?: BusinessSchedule;
  planId: string;
}

export function BusinessCard({
  id,
  name,
  shortDescription,
  categories,
  address,
  phone,
  image,
  website,
  instagram,
  facebook,
  whatsapp,
  shippingMethods,
  schedule = DEFAULT_SCHEDULE,
  planId
}: BusinessCardProps) {
  const [user] = useAuthState(auth);
  const { favorites, toggleFavorite, loading: loadingFavorites } = useFavorites(user?.uid);
  const { reviews, averageRating, totalReviews } = useBusinessReviews(id);
  const status = getBusinessStatus(schedule);
  const { trackEvent } = useBusinessMetrics(id);
  const isFavorite = !loadingFavorites && favorites.includes(id);
  const { plans } = usePlans();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Track view on mount
  useEffect(() => {
    trackBusinessInteraction(id, 'view');
  }, [id]);

  // Check if business has Premium plan
  const plan = plans.find(p => p.id === planId);
  const isPremium = plan?.name === 'Premium';

  // Track social clicks
  const handleSocialClick = async (e: React.MouseEvent, network: string, url: string) => {
    e.preventDefault(); // Prevent card click
    await trackEvent('social', { network });
    trackSocialInteraction(id, network as any);
    window.open(url, '_blank');
  };

  // Track phone clicks
  const handlePhoneClick = async (e: React.MouseEvent, phone: string) => {
    e.preventDefault(); // Prevent card click
    await trackEvent('phone');
    trackBusinessInteraction(id, 'contact', { contact_type: 'phone' });
    window.location.href = `tel:${phone}`;
  };

  // Handle favorite toggle
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card click
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    toggleFavorite(id);
    trackBusinessInteraction(id, isFavorite ? 'unfavorite' : 'favorite');
  };

  const statusConfig = {
    open: {
      text: 'Ahora abierto',
      className: 'bg-green-100 text-green-800 border border-green-200'
    },
    'opening-soon': {
      text: 'Abre pronto',
      className: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    },
    closed: {
      text: 'Ahora cerrado',
      className: 'bg-red-100 text-red-800 border border-red-200'
    }
  };

  return (
    <>
      <Link 
        to={`/comercios/${id}`} 
        className="block group"
        onClick={() => trackBusinessInteraction(id, 'view')}
      >
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 flex flex-col h-full relative">
          {/* Imagen del comercio - altura fija */}
          <div className="h-48 relative">
            {image ? (
              <img 
                src={image} 
                alt={name}
                className="w-full h-full object-cover rounded-t-xl"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-t-xl flex items-center justify-center">
                <Store className="h-16 w-16 text-gray-400" />
              </div>
            )}
            
            {/* Badge de estado */}
            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[status].className}`}>
              {statusConfig[status].text}
            </div>

            {/* Rating */}
            {totalReviews > 0 && (
              <div className="absolute top-3 right-14 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs font-medium text-gray-900">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({totalReviews})
                </span>
              </div>
            )}

            {/* Botón de favorito */}
            {!loadingFavorites && (
              <button
                onClick={handleFavoriteClick}
                className={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 backdrop-blur-sm ${
                  isFavorite 
                    ? 'bg-white text-red-500 shadow-md hover:scale-110' 
                    : 'bg-black/10 text-white hover:bg-white/90 hover:text-red-500'
                } ${!isFavorite && 'opacity-0 group-hover:opacity-100'}`}
                title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                <Heart 
                  className={`h-5 w-5 transition-all duration-200 ${
                    isFavorite 
                      ? 'fill-current scale-110' 
                      : 'hover:scale-110'
                  }`}
                />
              </button>
            )}
          </div>

          {/* Contenido */}
          <div className="p-6 flex-1 flex flex-col">
            {/* Categorías */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {categories.map((category) => (
                <span
                  key={category.name}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${category.color}15`,
                    color: category.color
                  }}
                >
                  {category.name}
                </span>
              ))}
            </div>

            {/* Nombre y descripción */}
            <div className="flex items-start gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
              {isPremium && (
                <div 
                  className="shrink-0 text-primary" 
                  title="Comercio verificado"
                >
                  <BadgeCheck className="h-5 w-5 fill-primary/20" />
                </div>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-4">{shortDescription}</p>

            {/* Métodos de envío */}
            {shippingMethods.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Truck className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{shippingMethods.join(', ')}</span>
              </div>
            )}

            {/* Dirección */}
            <div className="flex items-start gap-2 text-sm text-gray-500 mb-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{address}</span>
            </div>

            {/* Teléfono */}
            {phone && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Phone className="h-4 w-4 shrink-0" />
                <button 
                  onClick={(e) => handlePhoneClick(e, phone)}
                  className="hover:text-primary transition-colors"
                >
                  {phone}
                </button>
              </div>
            )}

            {/* Botón ver más */}
            <div className="mt-auto mb-4 inline-flex items-center justify-center gap-1 text-sm font-medium text-primary hover:text-primary/80">
              Ver más
              <ChevronRight className="h-4 w-4" />
            </div>

            {/* Footer con redes sociales */}
            <div className="pt-4 border-t flex justify-center gap-4">
              {website && (
                <button
                  onClick={(e) => handleSocialClick(e, 'website', website.startsWith('http') ? website : `https://${website}`)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Globe className="h-5 w-5" />
                </button>
              )}
              {instagram && (
                <button
                  onClick={(e) => handleSocialClick(e, 'instagram', `https://instagram.com/${instagram.replace('@', '')}`)}
                  className="text-[#E4405F] hover:opacity-80"
                >
                  <Instagram className="h-5 w-5" />
                </button>
              )}
              {facebook && (
                <button
                  onClick={(e) => handleSocialClick(e, 'facebook', `https://facebook.com/${facebook}`)}
                  className="text-[#1877F2] hover:opacity-80"
                >
                  <Facebook className="h-5 w-5" />
                </button>
              )}
              {whatsapp && (
                <button
                  onClick={(e) => handleSocialClick(e, 'whatsapp', `https://wa.me/${formatWhatsAppNumber(whatsapp)}`)}
                  className="text-[#25D366] hover:opacity-80"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>

      <UserAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}