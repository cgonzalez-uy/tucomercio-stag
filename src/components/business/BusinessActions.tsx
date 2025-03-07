import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useFavorites } from '../../lib/hooks/useFavorites';
import { Button } from '../ui/button';
import { Heart, Star } from 'lucide-react';
import { UserAuthModal } from '../auth/UserAuthModal';
import { ReviewModal } from './ReviewModal';
import { trackBusinessInteraction } from '../../lib/analytics';

interface BusinessActionsProps {
  businessId: string;
}

export function BusinessActions({ businessId }: BusinessActionsProps) {
  const [user] = useAuthState(auth);
  const { favorites, toggleFavorite } = useFavorites(user?.uid);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const isFavorite = favorites.includes(businessId);

  const handleAction = (action: 'favorite' | 'review') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (action === 'favorite') {
      toggleFavorite(businessId);
      trackBusinessInteraction(businessId, isFavorite ? 'unfavorite' : 'favorite');
    } else {
      setShowReviewModal(true);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => handleAction('favorite')}
          className={isFavorite ? 'text-red-500' : ''}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          <span className="ml-2  sm:inline">
            {isFavorite ? 'Guardado' : 'Guardar'}
          </span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleAction('review')}
        >
          <Star className="h-4 w-4" />
          <span className="ml-2 sm:inline">Calificar</span>
        </Button>
      </div>

      {showAuthModal && (
        <UserAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          businessId={businessId}
        />
      )}
    </div>
  );
}