import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useUserReviews } from '../lib/hooks/useUserReviews';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Star, Store, ArrowLeft, Trash2, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';

export function UserReviewsPage() {
  const [user] = useAuthState(auth);
  const { reviews, loading, error, deleteReview } = useUserReviews(user?.uid);
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewToDelete, setReviewToDelete] = useState<any | null>(null);
  const ITEMS_PER_PAGE = 10;

  // Calculate total pages
  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);

  // Get reviews for current page
  const paginatedReviews = reviews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      await deleteReview(reviewToDelete.businessId, reviewToDelete.id);
      setReviewToDelete(null);
    } catch (err) {
      console.error('Error deleting review:', err);
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Inicia sesión para ver tus reseñas
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
          Mis Reseñas
        </h1>

        {reviews.length === 0 ? (
          <div className="text-center max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Store className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No tienes reseñas
            </h2>
            <p className="text-gray-600 mb-6">
              Explora los comercios y comparte tu experiencia con otros usuarios
            </p>
            <Button asChild>
              <Link to="/">Explorar comercios</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedReviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <Link 
                      to={`/comercios/${review.businessId}`}
                      className="text-lg font-medium text-gray-900 hover:text-primary"
                    >
                      {review.businessName}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </p>
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

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReviewToDelete(review)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-gray-600 whitespace-pre-line mb-4">
                    {review.comment}
                  </p>
                )}

                {/* Business reply */}
                {review.reply && (
                  <div className="mt-4 bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-gray-900">
                        Respuesta de {review.businessName}
                      </p>
                      <span className="text-xs text-gray-500">
                        • {formatDate(review.reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {review.reply.content}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
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

      {/* Delete confirmation dialog */}
      <Dialog open={reviewToDelete !== null} onOpenChange={() => setReviewToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar reseña</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta reseña? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReview}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}