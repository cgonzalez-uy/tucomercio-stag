import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useBusinessReviews } from '../../lib/hooks/useBusinessReviews';
import { Button } from '../../components/ui/button';
import { Star, Flag, User, MessageCircle, Edit2, Trash2, Lock } from 'lucide-react';
import { ReviewReportDialog } from '../../components/business/ReviewReportDialog';
import { ReviewReplyDialog } from '../../components/business/ReviewReplyDialog';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function BusinessReviews() {
  const [user] = useAuthState(auth);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const { reviews, loading, error, reportReview, replyToReview, editReply, deleteReply } = useBusinessReviews(businessId);
  const [planName, setPlanName] = useState<string>('');

  useEffect(() => {
    const getBusinessId = async () => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          if (idTokenResult.claims.businessId) {
            setBusinessId(idTokenResult.claims.businessId);
          }
        } catch (err) {
          console.error('Error getting business ID:', err);
        }
      }
    };

    getBusinessId();
  }, [user]);

  const handleReport = async (reason: string, details: string) => {
    if (!selectedReview) return;
    try {
      await reportReview(selectedReview, reason, details);
      setSelectedReview(null);
    } catch (err) {
      console.error('Error reporting review:', err);
    }
  };

  const handleReply = async (content: string) => {
    if (!replyingTo) return;
    try {
      await replyToReview(replyingTo, content);
      setReplyingTo(null);
    } catch (err) {
      console.error('Error replying to review:', err);
      throw err;
    }
  };

  const handleEditReply = async (content: string) => {
    if (!editingReply) return;
    try {
      await editReply(editingReply, content);
      setEditingReply(null);
    } catch (err) {
      console.error('Error editing reply:', err);
      throw err;
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    try {
      await deleteReply(reviewId);
    } catch (err) {
      console.error('Error deleting reply:', err);
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
      <div className="flex justify-center py-12">
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

  const canReplyToReviews = planName !== 'Gratis' && planName !== 'Básico';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reseñas</h1>

      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aún no hay reseñas para tu comercio
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200"
            >
              <div className="p-4 sm:p-6 border-b bg-gray-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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

                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {review.userDisplayName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:ml-auto">
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
                        className={cn(
                          "shrink-0",
                          review.reported ? 'text-gray-400' : 'text-red-500'
                        )}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {review.comment && (
                  <p className="text-gray-600 whitespace-pre-line mb-4">
                    {review.comment}
                  </p>
                )}

                {review.reply ? (
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                          <p className="text-sm font-medium text-gray-900">
                            Respuesta del comercio
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(review.reply.createdAt)}
                        </span>
                      </div>
                      
                      {canReplyToReviews && (
                        <div className="flex items-center gap-2 border-t pt-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingReply(review.id);
                              setReplyingTo(null);
                            }}
                            className="flex-1"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReply(review.id)}
                            className="flex-1 text-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-2">
                      {review.reply.content}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    {canReplyToReviews ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(review.id);
                          setEditingReply(null);
                        }}
                        className="w-full sm:w-auto"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Responder
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                        <Lock className="h-4 w-4 shrink-0" />
                        <span className="text-sm text-gray-500">
                          Actualiza a Premium para responder reseñas
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {review.reported && (
                  <div className="mt-4 text-sm text-gray-500 italic">
                    Esta reseña ha sido reportada y está siendo revisada
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ReviewReportDialog
        isOpen={selectedReview !== null}
        onClose={() => setSelectedReview(null)}
        onConfirm={handleReport}
      />

      {canReplyToReviews && (
        <>
          <ReviewReplyDialog
            isOpen={replyingTo !== null}
            onClose={() => setReplyingTo(null)}
            onSubmit={handleReply}
          />

          <ReviewReplyDialog
            isOpen={editingReply !== null}
            onClose={() => setEditingReply(null)}
            onSubmit={handleEditReply}
            existingReply={editingReply ? reviews.find(r => r.id === editingReply)?.reply?.content : ''}
            isEditing
          />
        </>
      )}
    </div>
  );
}
