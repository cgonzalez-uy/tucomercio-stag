import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Star, User } from "lucide-react";

interface ReviewDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  review: any | null;
}

export function ReviewDetailsDialog({ isOpen, onClose, review }: ReviewDetailsDialogProps) {
  if (!review) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalles de la Reseña</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del comercio */}
          <div>
            <h3 className="font-medium text-gray-900">Comercio</h3>
            <p className="text-gray-600">{review.businessName}</p>
          </div>

          {/* Información del usuario y reseña */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start justify-between gap-4 mb-4">
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
                    {new Date(review.createdAt.seconds * 1000).toLocaleDateString('es-UY', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < review.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {review.comment && (
              <p className="text-gray-600 whitespace-pre-line">
                {review.comment}
              </p>
            )}
          </div>

          {/* Información del reporte */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Detalles del Reporte</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Motivo:</span>
                <p className="text-gray-600">{review.reportReason}</p>
              </div>
              {review.reportDetails && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Detalles adicionales:</span>
                  <p className="text-gray-600 whitespace-pre-line">{review.reportDetails}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-700">Fecha del reporte:</span>
                <p className="text-gray-600">
                  {new Date(review.reportDate.seconds * 1000).toLocaleDateString('es-UY', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}