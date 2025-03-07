import { useState } from 'react';
import { useReportedReviews } from '../lib/hooks/useReportedReviews';
import { Button } from '../components/ui/button';
import { DataTable } from '../components/ui/data-table';
import { Star, Check, X, Eye, User, AlertCircle } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { ReviewDetailsDialog } from '../components/admin/ReviewDetailsDialog';
import { ReviewActionDialog } from '../components/admin/ReviewActionDialog';
import { Tooltip } from '../components/ui/tooltip';
import { cn } from '../lib/utils';

export function ReportedReviewsPage() {
  const { reviews, loading, error, resolveReport, rejectReport } = useReportedReviews();
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [reviewToAction, setReviewToAction] = useState<{
    review: any;
    type: 'approve' | 'reject';
  } | null>(null);

  const handleAction = async () => {
    if (!reviewToAction) return;

    try {
      const { review, type } = reviewToAction;
      if (type === 'approve') {
        await resolveReport(review.businessId, review.reviewId, review.reportId);
      } else {
        await rejectReport(review.businessId, review.reviewId, review.reportId);
      }
    } catch (err) {
      console.error('Error handling review action:', err);
    } finally {
      setReviewToAction(null);
    }
  };

  // Mobile card view for each review
  const ReviewCard = ({ review }: { review: any }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      {/* Business and User Info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-gray-900">{review.businessName}</h3>
          <div className="flex items-center gap-2 mt-1">
            {review.userPhotoURL ? (
              <img
                src={review.userPhotoURL}
                alt={review.userDisplayName}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3 w-3 text-primary" />
              </div>
            )}
            <span className="text-sm text-gray-600">{review.userDisplayName}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={`star-${review.id}-${i}`}
              className={cn(
                "h-4 w-4",
                i < review.rating
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              )}
            />
          ))}
        </div>
      </div>

      {/* Report Info */}
      <div className="bg-red-50 p-3 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Motivo del reporte:</p>
            <p className="text-sm text-red-600">{review.reportReason}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedReview(review)}
          className="text-gray-600"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setReviewToAction({ review, type: 'approve' })}
          className="text-green-600"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setReviewToAction({ review, type: 'reject' })}
          className="text-red-500"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'businessName',
      header: 'Comercio',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900">
          {row.original.businessName}
        </div>
      ),
    },
    {
      accessorKey: 'userDisplayName',
      header: 'Usuario',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.userDisplayName}
        </div>
      ),
    },
    {
      accessorKey: 'reportReason',
      header: 'Motivo',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 max-w-[200px] truncate" title={row.original.reportReason}>
          {row.original.reportReason}
        </div>
      ),
    },
    {
      accessorKey: 'reportDate',
      header: 'Fecha',
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {new Date(row.original.reportDate.seconds * 1000).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Tooltip content="Ver detalles">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReview(review)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Tooltip>

            <Tooltip content="Aprobar reporte">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReviewToAction({ review, type: 'approve' })}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Check className="h-4 w-4" />
              </Button>
            </Tooltip>

            <Tooltip content="Rechazar reporte">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReviewToAction({ review, type: 'reject' })}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        );
      },
    },
  ];

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
      <h2 className="text-2xl font-bold text-gray-900">Reseñas Reportadas</h2>
      
      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay reseñas reportadas
          </div>
        ) : (
          reviews.map(review => (
            <ReviewCard key={`review-${review.id}`} review={review} />
          ))
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={reviews}
          searchPlaceholder="Buscar reseñas..."
          searchColumn="businessName"
        >
          <ReviewDetailsDialog
            isOpen={selectedReview !== null}
            onClose={() => setSelectedReview(null)}
            review={selectedReview}
          />

          {reviewToAction && (
            <ReviewActionDialog
              isOpen={true}
              onClose={() => setReviewToAction(null)}
              onConfirm={handleAction}
              type={reviewToAction.type}
              businessName={reviewToAction.review.businessName}
            />
          )}
        </DataTable>
      </div>

      {/* Dialogs - Shared between mobile and desktop */}
      <ReviewDetailsDialog
        isOpen={selectedReview !== null}
        onClose={() => setSelectedReview(null)}
        review={selectedReview}
      />

      {reviewToAction && (
        <ReviewActionDialog
          isOpen={true}
          onClose={() => setReviewToAction(null)}
          onConfirm={handleAction}
          type={reviewToAction.type}
          businessName={reviewToAction.review.businessName}
        />
      )}
    </div>
  );
}