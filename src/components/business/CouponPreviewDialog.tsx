import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Ticket, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CouponPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: any;
}

export function CouponPreviewDialog({ isOpen, onClose, coupon }: CouponPreviewDialogProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return '';
    
    try {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('es-UY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vista previa del cupón</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cupón */}
          <div className={cn(
            "bg-primary/5 border border-primary/10 rounded-lg p-4",
            "transform hover:scale-[1.02] transition-transform"
          )}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  {coupon.title}
                </h4>
                <p className="text-gray-600 text-sm mb-2">
                  {coupon.description}
                </p>
                <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                  <span className="font-medium text-primary">
                    {coupon.discount}% de descuento
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="font-medium">
                    Código: {coupon.code}
                  </span>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Desde {formatDate(coupon.startDate)}
                    </span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Hasta {formatDate(coupon.endDate)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700">Usos</h5>
              <p className="text-sm text-gray-600">
                {coupon.currentUses} de {coupon.maxUses} utilizados
              </p>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700">Estado</h5>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  coupon.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}
              >
                {coupon.isActive ? 'Activo' : 'Inactivo'}
              </span>
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