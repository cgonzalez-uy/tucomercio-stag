import { useState } from 'react';
import { useBusinessReviews } from '../../lib/hooks/useBusinessReviews';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { Star, User, Flag } from 'lucide-react';
import { Button } from '../ui/button';
import { ReviewReportDialog } from './ReviewReportDialog';
import { cn } from '../../lib/utils';

interface ReviewListProps {
  businessId: string;
}

export function ReviewList({ businessId }: ReviewListProps) {
  const [user] = useAuthState(auth);
  const { reviews, loading, error, reportReview } = useBusinessReviews(businessId);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);

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
      return new Date(timestamp.seconds * 1000).toLocaleDateString('es-UY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aún no hay reseñas para este comercio
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {review.userPhotoURL ? (
                  <img
                    src={review.userPhotoURL}
                    alt={review.userDisplayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
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

              <div className="flex items-center gap-4">
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

            {review.comment && (
              <p className="mt-4 text-gray-600 whitespace-pre-line">
                {review.comment}
              </p>
            )}

            {review.reported && (
              <div className="mt-4 text-sm text-gray-500 italic">
                Esta reseña ha sido reportada y está siendo revisada
              </div>
            )}
          </div>
        ))}
      </div>

      <ReviewReportDialog
        isOpen={selectedReview !== null}
        onClose={() => setSelectedReview(null)}
        onConfirm={handleReport}
      />
    </>
  );
}