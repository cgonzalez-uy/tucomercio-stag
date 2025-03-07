import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBusinesses } from '../lib/hooks/useBusinesses';
import { useSettings } from '../lib/hooks/useSettings';
import { useBusinessMetrics } from '../lib/hooks/useBusinessMetrics';
import { usePlans } from '../lib/hooks/usePlans';
import { useBusinessReviews } from '../lib/hooks/useBusinessReviews';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Store, MapPin, Globe, Instagram, Facebook, MessageCircle, CreditCard, Truck, ArrowLeft, Phone, Clock, BadgeCheck, Star, User, Flag, Share2, Link as LinkIcon, Twitter } from 'lucide-react';
import { formatWhatsAppNumber, cn } from '../lib/utils';
import { Footer } from '../components/Footer';
import { ScheduleDisplay } from '../components/schedule/ScheduleDisplay';
import { BusinessActions } from '../components/business/BusinessActions';
import { PromotionsList } from '../components/business/PromotionsList';
import { CouponsList } from '../components/business/CouponsList';
import { BusinessGalleryCarousel } from '../components/business/BusinessGalleryCarousel';
import { ReviewReportDialog } from '../components/business/ReviewReportDialog';
import { UserAuthModal } from '../components/auth/UserAuthModal';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { trackBusinessInteraction, trackSocialInteraction } from '../lib/analytics';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';

export function BusinessDetailPage() {
  const { id } = useParams();
  const [user] = useAuthState(auth);
  const { businesses, loading, error } = useBusinesses();
  const { settings: categorySettings } = useSettings('categories');
  const { trackEvent } = useBusinessMetrics(id || '');
  const { plans } = usePlans();
  const { reviews, reportReview } = useBusinessReviews(id);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const business = businesses.find(b => b.id === id);

  // Check if business has Premium plan
  const plan = business ? plans.find(p => p.id === business.planId) : null;
  const isPremium = plan?.name === 'Premium';

  // Track social clicks
  const handleSocialClick = async (network: string, url: string) => {
    if (!business) return;
    await trackEvent('social', { network });
    trackSocialInteraction(business.id, network as any);
    window.open(url, '_blank');
  };

  // Track phone clicks
  const handlePhoneClick = async (phone: string) => {
    if (!business) return;
    await trackEvent('phone');
    trackBusinessInteraction(business.id, 'contact', { contact_type: 'phone' });
    window.location.href = `tel:${phone}`;
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
    if (!business) return;

    const url = window.location.href;
    const text = `${business.name}\n${business.shortDescription}`;

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
            title: business.name,
            text: business.shortDescription,
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

  useEffect(() => {
    const trackView = async () => {
      if (business?.id) {
        console.log('Tracking view for business:', business.id); // Para debugging
        try {
          await trackEvent('view');
          await trackBusinessInteraction(business.id, 'view');
        } catch (err) {
          console.error('Error tracking view:', err);
        }
      }
    };

    trackView();
  }, [business?.id, trackEvent]);

  const handleReport = async (reason: string, details: string) => {
    if (!selectedReview) return;
    try {
      await reportReview(selectedReview, reason, details);
      setSelectedReview(null);
    } catch (err) {
      console.error('Error reporting review:', err);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return '';
    
    try {
      return formatDistanceToNow(
        new Date(timestamp.seconds * 1000),
        { addSuffix: true, locale: es }
      );
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Comercio no encontrado
          </h2>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  const hasSocialLinks = business.whatsapp || business.website || business.instagram || business.facebook;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Imagen principal */}
      <div className="relative w-full h-[200px] sm:h-[300px] bg-gray-100">
        {business.image ? (
          <img 
            src={business.image} 
            alt={business.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="h-24 w-24 text-gray-300" />
          </div>
        )}
        {/* Botón volver sobre la imagen */}
        <div className="absolute top-4 left-4">
          <Link to="/">
            <Button variant="outline" className="bg-white/90 backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4">
          {/* Título y acciones */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{business.name}</h1>
                {isPremium && (
                  <div 
                    className="text-primary" 
                    title="Comercio verificado"
                  >
                    <BadgeCheck className="h-6 w-6 fill-primary/20" />
                  </div>
                )}
              </div>
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
                        <MessageCircle className="h-4 w-4 mr-2" />
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
                <BusinessActions businessId={business.id} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {business.categories.map((categoryName) => {
                const category = categorySettings.find(c => c.name === categoryName);
                return (
                  <span
                    key={categoryName}
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: `${category?.color}15`,
                      color: category?.color || '#3B82F6'
                    }}
                  >
                    {categoryName}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <p className="text-gray-600 leading-relaxed">{business.description}</p>
          </div>

          {/* Gallery Carousel */}
          {business.gallery && business.gallery.length > 0 && (
            <div className="mb-6">
              <BusinessGalleryCarousel images={business.gallery} />
            </div>
          )}

          {/* Métodos de pago/envío y redes sociales */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="font-medium text-gray-900">Métodos de pago</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {business.paymentMethods.map((method) => (
                    <span
                      key={method}
                      className="px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-600"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Truck className="h-5 w-5 text-primary" />
                  <h3 className="font-medium text-gray-900">Métodos de envío</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {business.shippingMethods.map((method) => (
                    <span
                      key={method}
                      className="px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-600"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => handlePhoneClick(business.phone)}
                className="w-full bg-white rounded-lg shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <Phone className="h-5 w-5 text-primary" />
                <span className="font-medium text-gray-900">{business.phone}</span>
              </button>
              <div className="bg-white rounded-lg shadow-sm p-4 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                <span className="text-gray-600">{business.address}</span>
              </div>
              {hasSocialLinks && (
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Redes sociales</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {business.whatsapp && (
                      <button
                        onClick={() => handleSocialClick('whatsapp', `https://wa.me/${formatWhatsAppNumber(business.whatsapp)}`)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <MessageCircle className="h-5 w-5 text-[#25D366]" />
                        <span className="text-gray-600">WhatsApp</span>
                      </button>
                    )}
                    {business.website && (
                      <button
                        onClick={() => handleSocialClick('website', business.website.startsWith('http') ? business.website : `https://${business.website}`)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Globe className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-600">Web</span>
                      </button>
                    )}
                    {business.instagram && (
                      <button
                        onClick={() => handleSocialClick('instagram', `https://instagram.com/${business.instagram.replace('@', '')}`)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Instagram className="h-5 w-5 text-[#E4405F]" />
                        <span className="text-gray-600">Instagram</span>
                      </button>
                    )}
                    {business.facebook && (
                      <button
                        onClick={() => handleSocialClick('facebook', `https://facebook.com/${business.facebook}`)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Facebook className="h-5 w-5 text-[#1877F2]" />
                        <span className="text-gray-600">Facebook</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Promociones/Cupones y horarios */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2 space-y-4">
              <PromotionsList businessId={business.id} />
              <CouponsList businessId={business.id} />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-gray-900">Horarios</h3>
              </div>
              <ScheduleDisplay schedule={business.schedule} />
            </div>
          </div>

          {/* Reseñas */}
          <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Reseñas</h2>
            
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aún no hay reseñas para este comercio
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                    {/* Review header - Improved mobile layout */}
                    <div className="space-y-4 sm:space-y-0 sm:flex sm:items-start sm:justify-between">
                      {/* User info */}
                      <div className="flex items-center gap-3">
                        {review.userPhotoURL ? (
                          <img
                            src={review.userPhotoURL}
                            alt={review.userDisplayName}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                        )}

                        <div>
                          <p className="font-medium text-gray-900">
                            {review.userDisplayName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Rating and actions - Improved alignment */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-5 w-5",
                                i < review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>

                        {user && !review.reported && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReview(review.id)}
                            className="text-gray-500 hover:text-red-500"
                            title="Reportar reseña"
                          >
                            <Flag className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Review content */}
                    {review.comment && (
                      <p className="mt-4 text-gray-600 whitespace-pre-line">
                        {review.comment}
                      </p>
                    )}

                    {/* Business reply - Improved spacing */}
                    {review.reply && (
                      <div className="mt-4 pl-4 border-l-4 border-primary/20">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Respuesta del comercio
                        </p>
                        <p className="text-gray-600">
                          {review.reply.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(review.reply.createdAt)}
                        </p>
                      </div>
                    )}

                    {review.reported && (
                      <div className="mt-4 text-sm text-gray-500 italic">
                        Esta reseña ha sido reportada y está siendo revisada
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />

      {/* Report Dialog */}
      <ReviewReportDialog
        isOpen={selectedReview !== null}
        onClose={() => setSelectedReview(null)}
        onConfirm={handleReport}
      />

      <UserAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}